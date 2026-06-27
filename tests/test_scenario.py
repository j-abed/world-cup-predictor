from __future__ import annotations

import pandas as pd
import pytest

from src.scenario import ScenarioOverride, apply_scenario_overrides, describe_scenario


def test_apply_scenario_overrides_replaces_existing_result() -> None:
    results = pd.DataFrame(
        [
            {"match_id": 1, "home_score": 0, "away_score": 0, "status": "Complete"},
            {"match_id": 2, "home_score": 1, "away_score": 1, "status": "Complete"},
        ]
    )

    updated = apply_scenario_overrides(
        results,
        [ScenarioOverride(match_id=1, home_score=3, away_score=0)],
    )

    row = updated[updated["match_id"] == 1].iloc[0]
    assert int(row["home_score"]) == 3
    assert int(row["away_score"]) == 0
    assert len(updated) == 2


def test_describe_scenario_uses_team_names(repo_root) -> None:
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    teams = pd.read_csv(repo_root / "data/teams.csv")

    match_id = int(fixtures.iloc[0]["match_id"])
    label = describe_scenario(
        [ScenarioOverride(match_id=match_id, home_score=2, away_score=1)],
        fixtures,
        teams,
    )

    assert "2-1" in label
    assert "Match " not in label
