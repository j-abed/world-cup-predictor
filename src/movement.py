from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import pandas as pd

MovementMetric = Literal["champion_prob", "final_prob", "qualify_prob"]

MOVEMENT_METRICS: tuple[MovementMetric, ...] = (
    "champion_prob",
    "final_prob",
    "qualify_prob",
)

SNAPSHOT_VERSION = 1


@dataclass(frozen=True)
class TeamProbabilitySnapshot:
    team: str
    code: str
    champion_prob: float
    final_prob: float
    qualify_prob: float


@dataclass(frozen=True)
class MovementSnapshot:
    generated_at: str
    teams: dict[str, TeamProbabilitySnapshot]


def _round_prob(value: float) -> float:
    return round(float(value), 6)


def extract_team_snapshots(
    round_probabilities: pd.DataFrame,
    tournament_probabilities: pd.DataFrame,
) -> dict[str, TeamProbabilitySnapshot]:
    qualification_by_code = tournament_probabilities.set_index("code")
    snapshots: dict[str, TeamProbabilitySnapshot] = {}

    for _, row in round_probabilities.iterrows():
        code = str(row["code"])
        qualify_row = qualification_by_code.loc[code]

        snapshots[code] = TeamProbabilitySnapshot(
            team=str(row["team"]),
            code=code,
            champion_prob=_round_prob(row["champion_prob"]),
            final_prob=_round_prob(row["final_prob"]),
            qualify_prob=_round_prob(qualify_row["qualify_prob"]),
        )

    return snapshots


def snapshot_to_payload(
    generated_at: str,
    teams: dict[str, TeamProbabilitySnapshot],
) -> dict[str, Any]:
    return {
        "version": SNAPSHOT_VERSION,
        "generated_at": generated_at,
        "teams": {
            code: {
                "team": team.team,
                "code": team.code,
                "champion_prob": team.champion_prob,
                "final_prob": team.final_prob,
                "qualify_prob": team.qualify_prob,
            }
            for code, team in teams.items()
        },
    }


def snapshot_from_payload(payload: dict[str, Any]) -> MovementSnapshot | None:
    teams_payload = payload.get("teams")
    generated_at = payload.get("generated_at")

    if not isinstance(teams_payload, dict) or not isinstance(generated_at, str):
        return None

    teams: dict[str, TeamProbabilitySnapshot] = {}

    for code, row in teams_payload.items():
        if not isinstance(row, dict):
            continue

        teams[str(code)] = TeamProbabilitySnapshot(
            team=str(row["team"]),
            code=str(row.get("code", code)),
            champion_prob=_round_prob(row["champion_prob"]),
            final_prob=_round_prob(row["final_prob"]),
            qualify_prob=_round_prob(row["qualify_prob"]),
        )

    if not teams:
        return None

    return MovementSnapshot(generated_at=generated_at, teams=teams)


def extract_snapshot_from_app_state(payload: dict[str, Any]) -> MovementSnapshot | None:
    generated_at = payload.get("metadata", {}).get("generated_at")
    odds = payload.get("odds")

    if not isinstance(generated_at, str) or not isinstance(odds, dict):
        return None

    round_rows = odds.get("round")
    qualification_rows = odds.get("qualification")

    if not isinstance(round_rows, list) or not isinstance(qualification_rows, list):
        return None

    round_probabilities = pd.DataFrame(round_rows)
    tournament_probabilities = pd.DataFrame(qualification_rows)

    if round_probabilities.empty or tournament_probabilities.empty:
        return None

    teams = extract_team_snapshots(
        round_probabilities=round_probabilities,
        tournament_probabilities=tournament_probabilities,
    )

    return MovementSnapshot(generated_at=generated_at, teams=teams)


def load_movement_snapshot(path: Path) -> MovementSnapshot | None:
    if not path.exists():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))
    return snapshot_from_payload(payload)


def write_movement_snapshot(
    path: Path,
    *,
    generated_at: str,
    teams: dict[str, TeamProbabilitySnapshot],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            snapshot_to_payload(generated_at, teams),
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def resolve_baseline_snapshot(
    *,
    snapshot_path: Path,
    baseline_app_state_path: Path | None = None,
) -> MovementSnapshot | None:
    existing_snapshot = load_movement_snapshot(snapshot_path)
    if existing_snapshot is not None:
        return existing_snapshot

    candidates: list[Path] = []

    if baseline_app_state_path is not None:
        candidates.append(baseline_app_state_path)

    candidates.append(snapshot_path.parent / "app_state.json")

    for candidate in candidates:
        if not candidate.exists():
            continue

        payload = json.loads(candidate.read_text(encoding="utf-8"))
        snapshot = extract_snapshot_from_app_state(payload)

        if snapshot is not None:
            return snapshot

    return None


def _metric_value(team: TeamProbabilitySnapshot, metric: MovementMetric) -> float:
    return getattr(team, metric)


def build_movement_payload(
    current_teams: dict[str, TeamProbabilitySnapshot],
    previous: MovementSnapshot | None,
    *,
    biggest_mover_count: int = 8,
) -> dict[str, Any]:
    if previous is None:
        return {
            "has_baseline": False,
            "baseline_generated_at": None,
            "biggest_movers": [],
            "top_champion_changes": [],
            "champion_changes": [],
        }

    movers: list[dict[str, Any]] = []

    for code, current in current_teams.items():
        prior = previous.teams.get(code)

        if prior is None:
            continue

        best_metric: MovementMetric | None = None
        best_delta = 0.0
        best_previous = 0.0
        best_current = 0.0

        for metric in MOVEMENT_METRICS:
            previous_value = _metric_value(prior, metric)
            current_value = _metric_value(current, metric)
            delta = _round_prob(current_value - previous_value)

            if best_metric is None or abs(delta) > abs(best_delta):
                best_metric = metric
                best_delta = delta
                best_previous = previous_value
                best_current = current_value

        if best_metric is None or best_delta == 0.0:
            continue

        movers.append(
            {
                "code": code,
                "team": current.team,
                "metric": best_metric,
                "delta": best_delta,
                "previous": _round_prob(best_previous),
                "current": _round_prob(best_current),
            }
        )

    movers.sort(key=lambda row: abs(row["delta"]), reverse=True)

    top_champion_changes: list[dict[str, Any]] = []
    champion_changes: list[dict[str, Any]] = []

    ranked_current = sorted(
        current_teams.values(),
        key=lambda team: team.champion_prob,
        reverse=True,
    )

    for rank, current in enumerate(ranked_current, start=1):
        prior = previous.teams.get(current.code)

        if prior is None:
            continue

        row = {
            "code": current.code,
            "team": current.team,
            "rank": rank,
            "delta": _round_prob(current.champion_prob - prior.champion_prob),
            "previous": prior.champion_prob,
            "current": current.champion_prob,
        }
        champion_changes.append(row)

        if rank <= 3:
            top_champion_changes.append(row)

    return {
        "has_baseline": True,
        "baseline_generated_at": previous.generated_at,
        "biggest_movers": movers[:biggest_mover_count],
        "top_champion_changes": top_champion_changes,
        "champion_changes": champion_changes,
    }
