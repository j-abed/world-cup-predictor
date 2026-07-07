from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from src.knockout import (
    advance_knockout_match,
    load_knockout_results,
    rating_knockout_advance_probability,
    simulate_knockout_winners_by_match,
    simulate_most_likely_knockout_winners_by_match,
    simulate_penalty_shootout,
    simulate_tournament_round_probabilities,
)
from src.simulator import build_rating_lookup


@pytest.fixture
def rating_lookup() -> dict[str, float]:
    ratings = pd.DataFrame(
        [
            {"team_id": "team_a", "rating": 1800.0},
            {"team_id": "team_b", "rating": 1600.0},
        ]
    )
    return build_rating_lookup(ratings)


def test_advance_knockout_match_always_returns_a_participant(
    rating_lookup: dict[str, float],
) -> None:
    rng = np.random.default_rng(0)

    for _ in range(200):
        winner = advance_knockout_match(
            team_a="team_a",
            team_b="team_b",
            rating_lookup=rating_lookup,
            rng=rng,
        )
        assert winner in {"team_a", "team_b"}


def test_rating_knockout_advance_probability_favors_stronger_team(
    rating_lookup: dict[str, float],
) -> None:
    probability = rating_knockout_advance_probability(
        "team_a", "team_b", rating_lookup
    )

    assert probability > 0.5


def test_simulate_penalty_shootout_favors_stronger_team_over_many_trials(
    rating_lookup: dict[str, float],
) -> None:
    rng = np.random.default_rng(1)
    wins = sum(
        simulate_penalty_shootout("team_a", "team_b", rating_lookup, rng)
        == "team_a"
        for _ in range(500)
    )

    assert wins > 250


def test_load_knockout_results_returns_empty_for_missing_file(
    tmp_path: Path,
) -> None:
    result = load_knockout_results(str(tmp_path / "nonexistent.csv"))
    assert result == {}


def test_load_knockout_results_parses_csv(tmp_path: Path) -> None:
    csv = tmp_path / "knockout_results.csv"
    csv.write_text(
        "match_id,home_code,away_code,home_score,away_score,"
        "winner_code,loser_code,winner_team_id,loser_team_id,espn_event_id,date\n"
        "73,RSA,CAN,0,1,CAN,RSA,CAN,RSA,760490,2026-06-28\n"
        "76,BRA,JPN,2,1,BRA,JPN,BRA,JPN,760491,2026-06-29\n"
    )
    result = load_knockout_results(str(csv))
    assert result == {73: "CAN", 76: "BRA"}


def test_completed_results_are_locked_in_simulation(repo_root: Path) -> None:
    """Completed knockout results must be used as fixed outcomes in every simulation."""
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")
    ratings = pd.read_csv(repo_root / "data/ratings.csv")

    probs = simulate_tournament_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=500,
        seed=42,
        knockout_results_path=str(repo_root / "data/knockout_results.csv"),
    )

    ko_results = load_knockout_results(str(repo_root / "data/knockout_results.csv"))
    if not ko_results:
        pytest.skip("No knockout_results.csv found — run sync_knockout_results.py first")

    eliminated_in_r32 = {
        row["loser_team_id"]
        for _, row in pd.read_csv(repo_root / "data/knockout_results.csv").iterrows()
        if "Round of 32" in str(row.get("match_id", "")) or int(row["match_id"]) < 89
    }

    # Every team that lost in R32 must have 0% QF probability.
    r32_losers = pd.read_csv(repo_root / "data/knockout_results.csv")
    r32_losers = r32_losers[r32_losers["match_id"].astype(int) <= 88]["loser_team_id"].tolist()
    for loser_id in r32_losers:
        row = probs[probs["team_id"] == loser_id]
        if row.empty:
            continue
        assert row.iloc[0]["qf_prob"] == 0.0, (
            f"{loser_id} was eliminated in R32 but still shows qf_prob > 0"
        )

    # Every team that lost in R16 must have 0% QF probability.
    r16_losers = pd.read_csv(repo_root / "data/knockout_results.csv")
    r16_losers = r16_losers[
        (r16_losers["match_id"].astype(int) >= 89) & (r16_losers["match_id"].astype(int) <= 96)
    ]["loser_team_id"].tolist()
    for loser_id in r16_losers:
        row = probs[probs["team_id"] == loser_id]
        if row.empty:
            continue
        assert row.iloc[0]["qf_prob"] == 0.0, (
            f"{loser_id} was eliminated in R16 but still shows qf_prob > 0"
        )
