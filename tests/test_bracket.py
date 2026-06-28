from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.bracket import (
    build_projected_complete_bracket,
    build_projected_round_of_32,
    build_third_place_key,
    get_official_third_place_row,
    is_third_place_placeholder,
    load_third_place_permutations,
    parse_third_place_placeholder,
)
from src.reporting import (
    calculate_all_group_standings,
    calculate_current_projected_qualifiers,
    calculate_current_third_place_table,
)


def test_third_place_placeholder_parsing() -> None:
    assert parse_third_place_placeholder("3rd Group E/F/G/H") == ("E", "F", "G", "H")
    assert is_third_place_placeholder("3rd Group E/F/G/H") is True
    assert is_third_place_placeholder("Winner Group A") is False


def test_third_place_key_is_sorted() -> None:
    qualifiers = pd.DataFrame({"group": ["K", "D", "E", "F", "G", "H", "I", "J"]})

    assert build_third_place_key(qualifiers) == "D-E-F-G-H-I-J-K"


def test_official_permutation_lookup_for_known_combo() -> None:
    permutations = load_third_place_permutations()
    qualifiers = pd.DataFrame({"group": list("DEFGHIJK")})

    row = get_official_third_place_row(qualifiers, permutations)

    assert int(row["scenario_number"]) == 9
    assert row["slot_74"] == "D"
    assert row["slot_87"] == "I"


def test_projected_round_of_32_resolves_all_slots(repo_root: Path) -> None:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")
    bracket_slots = pd.read_csv(repo_root / "data/bracket_slots.csv")

    standings_by_group = calculate_all_group_standings(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )
    third_place_table = calculate_current_third_place_table(standings_by_group)

    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
    )

    bracket = build_projected_round_of_32(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )

    round_of_32 = bracket[bracket["round"] == "Round of 32"]

    assert len(round_of_32) == 16
    assert (round_of_32["home_team"] != "TBD").all()
    assert (round_of_32["away_team"] != "TBD").all()
    assert (round_of_32["home_code"] != "TBD").all()
    assert (round_of_32["away_code"] != "TBD").all()


def test_projected_complete_bracket_fills_all_rounds(repo_root: Path) -> None:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")
    ratings = pd.read_csv(repo_root / "data/ratings.csv")
    bracket_slots = pd.read_csv(repo_root / "data/bracket_slots.csv")

    standings_by_group = calculate_all_group_standings(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )
    third_place_table = calculate_current_third_place_table(standings_by_group)

    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
    )

    bracket = build_projected_complete_bracket(
        teams=teams,
        ratings=ratings,
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
        seed=42,
        simulations=500,
    )

    assert (bracket["home_team"] != "TBD").all()
    assert (bracket["away_team"] != "TBD").all()
    assert (bracket["projected_winner_team"] != "TBD").all()
    assert len(bracket) == len(bracket_slots)


def test_projected_complete_bracket_uses_modal_match_winners(repo_root: Path) -> None:
    teams = pd.read_csv(repo_root / "data/teams.csv")
    fixtures = pd.read_csv(repo_root / "data/fixtures.csv")
    results = pd.read_csv(repo_root / "data/results.csv")
    ratings = pd.read_csv(repo_root / "data/ratings.csv")
    bracket_slots = pd.read_csv(repo_root / "data/bracket_slots.csv")

    standings_by_group = calculate_all_group_standings(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )
    third_place_table = calculate_current_third_place_table(standings_by_group)

    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
    )

    bracket = build_projected_complete_bracket(
        teams=teams,
        ratings=ratings,
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
        seed=42,
        simulations=2_000,
    )

    match_89 = bracket[bracket["match_id"] == 89].iloc[0]
    assert match_89["home_code"] == "GER"
    assert match_89["away_code"] == "FRA"
    assert match_89["projected_winner_code"] == "FRA"
