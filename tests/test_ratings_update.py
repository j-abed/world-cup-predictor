from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from src.ratings_update import (
    apply_single_match_update,
    expected_match_score,
    pending_completed_matches,
    save_applied_match_ids,
    update_ratings_from_results,
)


def test_expected_match_score_is_symmetric() -> None:
    assert expected_match_score(1800.0, 1600.0) > 0.5
    assert expected_match_score(1600.0, 1800.0) < 0.5
    assert expected_match_score(1700.0, 1700.0) == pytest.approx(0.5)


def test_apply_single_match_update_moves_ratings_toward_result() -> None:
    ratings = {"team_a": 1700.0, "team_b": 1700.0}

    apply_single_match_update(ratings, "team_a", "team_b", 2, 0)

    assert ratings["team_a"] > 1700.0
    assert ratings["team_b"] < 1700.0


def test_update_ratings_from_results_is_idempotent(tmp_path: Path) -> None:
    ratings_path = tmp_path / "ratings.csv"
    fixtures_path = tmp_path / "fixtures.csv"
    results_path = tmp_path / "results.csv"
    applied_path = tmp_path / "applied.csv"

    pd.DataFrame(
        [
            {"team_id": "team_a", "rating": 1700.0, "rating_type": "test"},
            {"team_id": "team_b", "rating": 1700.0, "rating_type": "test"},
        ]
    ).to_csv(ratings_path, index=False)

    pd.DataFrame(
        [
            {
                "match_id": 1,
                "stage": "Group",
                "group": "A",
                "home_team": "team_a",
                "away_team": "team_b",
                "kickoff": "2026-06-11T15:00:00-04:00",
            }
        ]
    ).to_csv(fixtures_path, index=False)

    pd.DataFrame(
        [{"match_id": 1, "home_score": 1, "away_score": 0, "status": "Complete"}]
    ).to_csv(results_path, index=False)

    save_applied_match_ids(set(), applied_path)

    first_count, _ = update_ratings_from_results(
        ratings_path=ratings_path,
        fixtures_path=fixtures_path,
        results_path=results_path,
        applied_matches_path=applied_path,
    )
    ratings_after_first = pd.read_csv(ratings_path)["rating"].tolist()

    second_count, _ = update_ratings_from_results(
        ratings_path=ratings_path,
        fixtures_path=fixtures_path,
        results_path=results_path,
        applied_matches_path=applied_path,
    )
    ratings_after_second = pd.read_csv(ratings_path)["rating"].tolist()

    assert first_count == 1
    assert second_count == 0
    assert ratings_after_first != [1700.0, 1700.0]
    assert ratings_after_second == ratings_after_first


def test_pending_completed_matches_excludes_applied_ids() -> None:
    fixtures = pd.DataFrame(
        [
            {
                "match_id": 1,
                "stage": "Group",
                "group": "A",
                "home_team": "team_a",
                "away_team": "team_b",
            }
        ]
    )
    results = pd.DataFrame(
        [{"match_id": 1, "home_score": 1, "away_score": 0, "status": "Complete"}]
    )

    pending = pending_completed_matches(fixtures, results, applied_match_ids=set())
    assert len(pending) == 1

    pending_after = pending_completed_matches(
        fixtures, results, applied_match_ids={1}
    )
    assert pending_after.empty
