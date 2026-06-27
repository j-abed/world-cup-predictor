from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from src.movement import (
    build_movement_payload,
    extract_team_snapshots,
    load_movement_snapshot,
    resolve_baseline_snapshot,
    write_movement_snapshot,
)


def _sample_round_df() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "team": "Brazil",
                "code": "BRA",
                "champion_prob": 0.22,
                "final_prob": 0.40,
            },
            {
                "team": "Argentina",
                "code": "ARG",
                "champion_prob": 0.18,
                "final_prob": 0.35,
            },
            {
                "team": "France",
                "code": "FRA",
                "champion_prob": 0.15,
                "final_prob": 0.30,
            },
        ]
    )


def _sample_qualification_df() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"code": "BRA", "qualify_prob": 0.90},
            {"code": "ARG", "qualify_prob": 0.88},
            {"code": "FRA", "qualify_prob": 0.85},
        ]
    )


def test_build_movement_without_baseline() -> None:
    current = extract_team_snapshots(_sample_round_df(), _sample_qualification_df())
    payload = build_movement_payload(current, None)

    assert payload["has_baseline"] is False
    assert payload["biggest_movers"] == []
    assert payload["top_champion_changes"] == []


def test_build_movement_detects_biggest_movers_and_top_three() -> None:
    current = extract_team_snapshots(_sample_round_df(), _sample_qualification_df())

    previous_round = _sample_round_df().copy()
    previous_round.loc[previous_round["code"] == "BRA", "champion_prob"] = 0.20
    previous_round.loc[previous_round["code"] == "ARG", "champion_prob"] = 0.16
    previous_round.loc[previous_round["code"] == "FRA", "champion_prob"] = 0.17

    previous_qualification = _sample_qualification_df().copy()
    previous_qualification.loc[
        previous_qualification["code"] == "BRA",
        "qualify_prob",
    ] = 0.84

    previous_teams = extract_team_snapshots(previous_round, previous_qualification)

    from src.movement import MovementSnapshot

    previous = MovementSnapshot(
        generated_at="2026-06-27T12:00:00",
        teams=previous_teams,
    )

    payload = build_movement_payload(current, previous)

    assert payload["has_baseline"] is True
    assert payload["baseline_generated_at"] == "2026-06-27T12:00:00"
    assert payload["biggest_movers"][0]["code"] == "BRA"
    assert payload["biggest_movers"][0]["metric"] == "qualify_prob"
    assert payload["biggest_movers"][0]["delta"] == 0.06

    top_three_codes = [row["code"] for row in payload["top_champion_changes"]]
    assert top_three_codes == ["BRA", "ARG", "FRA"]
    assert payload["top_champion_changes"][0]["delta"] == 0.02


def test_snapshot_round_trip(tmp_path: Path) -> None:
    teams = extract_team_snapshots(_sample_round_df(), _sample_qualification_df())
    snapshot_path = tmp_path / "movement_snapshot.json"

    write_movement_snapshot(
        snapshot_path,
        generated_at="2026-06-27T18:00:00",
        teams=teams,
    )

    loaded = load_movement_snapshot(snapshot_path)

    assert loaded is not None
    assert loaded.generated_at == "2026-06-27T18:00:00"
    assert loaded.teams["BRA"].champion_prob == 0.22


def test_resolve_baseline_from_app_state_json(tmp_path: Path) -> None:
    app_state = {
        "metadata": {"generated_at": "2026-06-27T10:00:00"},
        "odds": {
            "round": _sample_round_df().to_dict(orient="records"),
            "qualification": _sample_qualification_df().to_dict(orient="records"),
        },
    }

    app_state_path = tmp_path / "app_state.json"
    app_state_path.write_text(json.dumps(app_state), encoding="utf-8")

    snapshot = resolve_baseline_snapshot(
        snapshot_path=tmp_path / "movement_snapshot.json",
        baseline_app_state_path=app_state_path,
    )

    assert snapshot is not None
    assert snapshot.generated_at == "2026-06-27T10:00:00"
    assert snapshot.teams["ARG"].champion_prob == 0.18
