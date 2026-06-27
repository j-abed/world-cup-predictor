from __future__ import annotations

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

    completed = [row for row in payload if row["status"].lower() == "complete"]
    scheduled = [row for row in payload if row["status"] == "Scheduled"]

    assert len(completed) == len(results)
    assert len(scheduled) == len(fixtures) - len(results)

    first = payload[0]
    assert "home_team" in first
    assert "home_code" in first
    assert "away_team" in first
    assert "kickoff" in first

    completed_row = next(row for row in payload if row["match_id"] == 66456904)
    assert completed_row["home_score"] == 2
    assert completed_row["away_score"] == 0

    scheduled_row = next(row for row in payload if row["status"] == "Scheduled")
    assert scheduled_row["home_score"] is None
    assert scheduled_row["away_score"] is None


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

