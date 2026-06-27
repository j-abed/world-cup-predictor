from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from src.simulator import simulate_group_finish_probabilities
from src.tournament import simulate_qualification_probabilities


@pytest.fixture
def tournament_data(repo_root: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")
    ratings = pd.read_csv(repo_root / "data/ratings.csv")
    return teams, fixtures, results, ratings


def test_qualification_probabilities_are_valid(
    tournament_data: tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame],
) -> None:
    teams, fixtures, results, ratings = tournament_data

    probs = simulate_qualification_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=200,
        seed=42,
    )

    assert len(probs) == len(teams)
    assert (probs["qualify_prob"] >= 0).all()
    assert (probs["qualify_prob"] <= 1).all()
    assert (probs["first_prob"] + probs["second_prob"] + probs["third_qualify_prob"] <= probs["qualify_prob"] + 1e-9).all()


def test_group_finish_probabilities_sum_to_one_per_team(
    tournament_data: tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame],
) -> None:
    teams, fixtures, results, ratings = tournament_data

    probs = simulate_group_finish_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        group="D",
        simulations=200,
        seed=42,
    )

    finish_totals = (
        probs["finish_1_prob"]
        + probs["finish_2_prob"]
        + probs["finish_3_prob"]
        + probs["finish_4_prob"]
    )

    assert (finish_totals - 1.0).abs().max() < 1e-9
