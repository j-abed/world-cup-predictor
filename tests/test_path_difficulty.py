from pathlib import Path

import pandas as pd

from src.path_difficulty import build_path_difficulty_payload


def test_path_difficulty_returns_top_three(repo_root: Path) -> None:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    ratings = pd.read_csv(repo_root / "data/ratings.csv")
    bracket_slots = pd.read_csv(repo_root / "data/bracket_slots.csv")

    from src.reporting import (
        calculate_all_group_standings,
        calculate_current_projected_qualifiers,
        calculate_current_third_place_table,
    )
    from src.bracket import build_projected_round_of_32
    from src.knockout import simulate_tournament_round_probabilities

    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")

    standings = calculate_all_group_standings(teams, fixtures, results)
    third_place = calculate_current_third_place_table(standings)
    projected = calculate_current_projected_qualifiers(standings, third_place)
    bracket = build_projected_round_of_32(bracket_slots, projected)

    round_probs = simulate_tournament_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=100,
        seed=42,
    )

    payload = build_path_difficulty_payload(
        bracket=bracket,
        round_probabilities=round_probs,
        ratings=ratings,
    )

    assert len(payload) == 3
    assert payload[0]["rank"] == 1
    assert payload[0]["label"] in {"Easy", "Moderate", "Hard"}
