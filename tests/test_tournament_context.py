from __future__ import annotations

from datetime import datetime, timedelta, timezone

from src.tournament_context import compute_next_refresh_at, parse_iso_datetime


def test_compute_next_refresh_at_uses_even_utc_hours() -> None:
    generated_at = datetime(2026, 6, 27, 21, 13, tzinfo=timezone.utc)
    next_refresh = compute_next_refresh_at(generated_at)

    assert next_refresh.hour % 2 == 0
    assert next_refresh.minute == 0
    assert next_refresh > generated_at


def test_compute_days_to_final_from_schedule() -> None:
    from src.tournament_context import build_live_context, load_tournament_schedule

    schedule = load_tournament_schedule()
    generated_at = parse_iso_datetime("2026-06-27T12:00:00-04:00")

    context = build_live_context(
        [
            {
                "match_id": 1,
                "group": "A",
                "kickoff": "2026-06-28T15:00:00-04:00",
                "home_team": "Mexico",
                "home_code": "MEX",
                "away_team": "Brazil",
                "away_code": "BRA",
                "status": "Scheduled",
                "home_score": None,
                "away_score": None,
            }
        ],
        generated_at=generated_at,
        final_kickoff=schedule.final_kickoff,
    )

    assert context["days_to_final"] == 22
    assert context["next_match"]["home_code"] == "MEX"


def test_build_live_context_marks_kickoff_in_past_as_in_progress() -> None:
    from src.tournament_context import build_live_context

    generated_at = parse_iso_datetime("2026-06-27T18:00:00-04:00")

    context = build_live_context(
        [
            {
                "match_id": 2,
                "group": "B",
                "kickoff": "2026-06-27T15:00:00-04:00",
                "home_team": "Canada",
                "home_code": "CAN",
                "away_team": "France",
                "away_code": "FRA",
                "status": "Scheduled",
                "home_score": None,
                "away_score": None,
            }
        ],
        generated_at=generated_at,
        final_kickoff="2026-07-19T18:00:00-04:00",
    )

    assert len(context["in_progress_matches"]) == 1
    assert context["in_progress_matches"][0]["status"] == "In Progress"
