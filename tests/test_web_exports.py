from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from src.web_exports import build_data_caveats, build_fixtures_payload


def test_build_fixtures_payload_joins_results_and_teams(repo_root: Path) -> None:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")

    payload = build_fixtures_payload(
        fixtures=fixtures,
        results=results,
        teams=teams,
    )

    assert len(payload) == len(fixtures)

    complete_results = results[
        results["status"].astype(str).str.lower() == "complete"
    ]
    completed = [row for row in payload if row["status"].lower() == "complete"]
    scheduled = [row for row in payload if row["status"] == "Scheduled"]
    in_progress = [
        row for row in payload if row["status"].lower() == "in progress"
    ]

    assert len(completed) == len(complete_results)
    assert len(completed) == complete_results["match_id"].nunique()
    assert (
        len(completed) + len(scheduled) + len(in_progress) == len(fixtures)
    )
    assert len(scheduled) == len(fixtures) - results["match_id"].nunique()

    first = payload[0]
    assert "home_team" in first
    assert "home_code" in first
    assert "away_team" in first
    assert "kickoff" in first

    completed_row = next(row for row in payload if row["match_id"] == 66456904)
    assert completed_row["home_score"] == 2
    assert completed_row["away_score"] == 0

    if scheduled:
        assert scheduled[0]["home_score"] is None
        assert scheduled[0]["away_score"] is None


def test_build_fixtures_payload_handles_in_progress_results() -> None:
    teams = pd.DataFrame(
        {
            "team_id": [1, 2, 3, 4],
            "name": ["A", "B", "C", "D"],
            "code": ["A", "B", "C", "D"],
            "group": ["A", "A", "B", "B"],
        }
    )
    fixtures = pd.DataFrame(
        {
            "match_id": [1, 2, 3],
            "home_team": [1, 3, 1],
            "away_team": [2, 4, 3],
            "group": ["A", "B", "A"],
            "kickoff": ["2026-06-01", "2026-06-02", "2026-06-03"],
            "stage": ["Group", "Group", "Group"],
        }
    )
    results = pd.DataFrame(
        {
            "match_id": [1, 2],
            "home_score": [2, 1],
            "away_score": [0, 1],
            "status": ["Complete", "In Progress"],
        }
    )

    payload = build_fixtures_payload(
        fixtures=fixtures,
        results=results,
        teams=teams,
    )

    completed = [row for row in payload if row["status"].lower() == "complete"]
    in_progress = [
        row for row in payload if row["status"].lower() == "in progress"
    ]
    scheduled = [row for row in payload if row["status"] == "Scheduled"]

    assert len(completed) == 1
    assert len(in_progress) == 1
    assert len(scheduled) == 1
    assert in_progress[0]["home_score"] == 1
    assert in_progress[0]["away_score"] == 1


def test_build_fixtures_payload_promotes_past_scheduled_to_in_progress() -> None:
    teams = pd.DataFrame(
        {
            "team_id": [1, 2],
            "name": ["Home", "Away"],
            "code": ["HOM", "AWY"],
            "group": ["A", "A"],
        }
    )
    fixtures = pd.DataFrame(
        {
            "match_id": [99],
            "home_team": [1],
            "away_team": [2],
            "group": ["A"],
            "kickoff": ["2026-06-21T18:00:00-04:00"],
            "stage": ["Group"],
        }
    )
    results = pd.DataFrame(columns=["match_id", "home_score", "away_score", "status"])

    payload = build_fixtures_payload(
        fixtures=fixtures,
        results=results,
        teams=teams,
        generated_at=datetime(2026, 6, 27, 12, 0, tzinfo=timezone.utc),
    )

    assert len(payload) == 1
    assert payload[0]["status"] == "In Progress"
    assert payload[0]["home_score"] == 0
    assert payload[0]["away_score"] == 0


def test_build_data_caveats_reflect_fair_play_source(repo_root: Path) -> None:
    ratings = pd.read_csv(repo_root / "data/ratings.csv")
    caveats = build_data_caveats(ratings)

    assert any("Knockout draws" in caveat for caveat in caveats)
    assert any("Fair-play" in caveat for caveat in caveats)

    fair_play = pd.read_csv(repo_root / "data/fair_play.csv")
    if "espn_summary" in set(fair_play["source"].astype(str)):
        assert any("ESPN yellow/red card" in caveat for caveat in caveats)
    else:
        assert any("placeholder" in caveat for caveat in caveats)

