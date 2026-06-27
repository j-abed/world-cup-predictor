from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SCHEDULE_PATH = Path("data/tournament_schedule.json")
REFRESH_INTERVAL_HOURS = 2


@dataclass(frozen=True)
class TournamentSchedule:
    tournament: str
    final_kickoff: str
    refresh_interval_hours: int
    tournament_start: str
    tournament_end: str


def load_tournament_schedule(path: Path = SCHEDULE_PATH) -> TournamentSchedule:
    payload = json.loads(path.read_text(encoding="utf-8"))

    return TournamentSchedule(
        tournament=str(payload["tournament"]),
        final_kickoff=str(payload["final_kickoff"]),
        refresh_interval_hours=int(payload.get("refresh_interval_hours", 2)),
        tournament_start=str(payload["tournament_start"]),
        tournament_end=str(payload["tournament_end"]),
    )


def parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def compute_next_refresh_at(
    generated_at: datetime,
    *,
    interval_hours: int = REFRESH_INTERVAL_HOURS,
) -> datetime:
    """Next GitHub Actions refresh slot: even hours UTC on the hour."""
    now_utc = ensure_aware(generated_at)
    candidate = now_utc.replace(minute=0, second=0, microsecond=0)

    if candidate <= now_utc:
        candidate += timedelta(hours=1)

    while candidate.hour % interval_hours != 0:
        candidate += timedelta(hours=1)

    return candidate


def compute_days_to_final(generated_at: datetime, final_kickoff: str) -> int:
    final_dt = ensure_aware(parse_iso_datetime(final_kickoff))
    generated_date = ensure_aware(generated_at).astimezone(final_dt.tzinfo).date()
    final_date = final_dt.date()
    return max(0, (final_date - generated_date).days)


def _match_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "match_id": row["match_id"],
        "group": row["group"],
        "kickoff": row["kickoff"],
        "home_team": row["home_team"],
        "home_code": row["home_code"],
        "away_team": row["away_team"],
        "away_code": row["away_code"],
        "status": row["status"],
        "home_score": row.get("home_score"),
        "away_score": row.get("away_score"),
    }


def build_live_context(
    fixtures_payload: list[dict[str, Any]],
    *,
    generated_at: datetime,
    final_kickoff: str,
) -> dict[str, Any]:
    now = ensure_aware(generated_at)

    in_progress: list[dict[str, Any]] = []
    upcoming: list[dict[str, Any]] = []

    for row in fixtures_payload:
        status = str(row["status"]).lower()
        kickoff = ensure_aware(parse_iso_datetime(str(row["kickoff"])))

        if status == "in progress":
            in_progress.append(_match_summary(row))
            continue

        if status == "complete":
            continue

        if kickoff <= now:
            in_progress.append(
                {
                    **_match_summary(row),
                    "status": "In Progress",
                }
            )
            continue

        upcoming.append(row)

    upcoming.sort(key=lambda row: str(row["kickoff"]))
    next_match = _match_summary(upcoming[0]) if upcoming else None

    return {
        "days_to_final": compute_days_to_final(now, final_kickoff),
        "final_kickoff": final_kickoff,
        "in_progress_matches": in_progress,
        "next_match": next_match,
    }


def build_refresh_metadata(
    generated_at: datetime,
    schedule: TournamentSchedule,
) -> dict[str, Any]:
    next_refresh = compute_next_refresh_at(
        generated_at,
        interval_hours=schedule.refresh_interval_hours,
    )

    return {
        "next_refresh_at": next_refresh.isoformat(timespec="seconds"),
        "refresh_interval_hours": schedule.refresh_interval_hours,
        "tournament_final_kickoff": schedule.final_kickoff,
    }
