from __future__ import annotations

import time

import pandas as pd

from src.bracket import build_projected_round_of_32
from src.exports import export_all_group_standings, export_dataframe
from src.knockout import simulate_tournament_round_probabilities
from src.reporting import (
    calculate_all_group_standings,
    calculate_current_projected_qualifiers,
    calculate_current_third_place_table,
)
from src.simulator import format_probability, simulate_group_finish_probabilities
from src.tournament import simulate_qualification_probabilities
from src.validation import validate_group_fixture_coverage


def print_all_group_standings(standings_by_group: dict[str, pd.DataFrame]) -> None:
    display_columns = [
        "rank",
        "team",
        "code",
        "played",
        "wins",
        "draws",
        "losses",
        "goals_for",
        "goals_against",
        "goal_difference",
        "points",
    ]

    print("Current Group Standings")
    print("=======================")

    for group, standings in standings_by_group.items():
        print()
        print(f"Group {group}")
        print("-" * 7)
        print(standings[display_columns].to_string(index=False))

    print()


def print_third_place_table(third_place_table: pd.DataFrame) -> None:
    display = third_place_table.copy()

    display["currently_qualifies"] = display["currently_qualifies"].map(
        {True: "Yes", False: "No"}
    )

    display = display.rename(
        columns={
            "third_rank": "Rank",
            "group": "Group",
            "team": "Team",
            "code": "Code",
            "played": "Pld",
            "points": "Pts",
            "goal_difference": "GD",
            "goals_for": "GF",
            "goals_against": "GA",
            "currently_qualifies": "Qualifies",
        }
    )

    print("Current Third-Place Ranking")
    print("===========================")
    print(
        display[
            [
                "Rank",
                "Group",
                "Team",
                "Code",
                "Pld",
                "Pts",
                "GD",
                "GF",
                "GA",
                "Qualifies",
            ]
        ].to_string(index=False)
    )
    print()


def print_projected_qualifiers(qualifiers: pd.DataFrame) -> None:
    display = qualifiers.copy()

    display = display.rename(
        columns={
            "seed": "#",
            "source": "Source",
            "group": "Group",
            "qualifying_path": "Path",
            "team": "Team",
            "code": "Code",
            "points": "Pts",
            "goal_difference": "GD",
            "goals_for": "GF",
        }
    )

    print("Current Projected Round of 32 Field")
    print("===================================")
    print(
        display[
            [
                "#",
                "Source",
                "Path",
                "Team",
                "Code",
                "Pts",
                "GD",
                "GF",
            ]
        ].to_string(index=False)
    )
    print()


def print_projected_round_of_32(round_of_32: pd.DataFrame) -> None:
    display = round_of_32.copy()

    display = display.rename(
        columns={
            "slot_id": "Slot",
            "match_id": "Match ID",
            "home_source": "Home Source",
            "home_team": "Home",
            "home_code": "Home Code",
            "away_source": "Away Source",
            "away_team": "Away",
            "away_code": "Away Code",
            "winner_advances_to": "Winner To",
        }
    )

    print("Projected Round of 32 Matchups")
    print("==============================")
    print(
        display[
            [
                "Slot",
                "Match ID",
                "Home Source",
                "Home",
                "Home Code",
                "Away Source",
                "Away",
                "Away Code",
                "Winner To",
            ]
        ].to_string(index=False)
    )
    print()


def print_group_d_simulation(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
) -> None:
    group_simulation_count = 10_000

    start = time.perf_counter()

    probabilities = simulate_group_finish_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        group="D",
        simulations=group_simulation_count,
        seed=42,
    )

    elapsed_seconds = time.perf_counter() - start

    probability_columns = [
        "finish_1_prob",
        "finish_2_prob",
        "finish_3_prob",
        "finish_4_prob",
        "top_2_prob",
        "top_3_prob",
    ]

    formatted = probabilities.copy()

    for column in probability_columns:
        formatted[column] = formatted[column].map(format_probability)

    formatted = formatted.rename(
        columns={
            "team": "Team",
            "code": "Code",
            "finish_1_prob": "1st",
            "finish_2_prob": "2nd",
            "finish_3_prob": "3rd",
            "finish_4_prob": "4th",
            "top_2_prob": "Top 2",
            "top_3_prob": "Top 3",
        }
    )

    print("Group D Simulation Probabilities")
    print("================================")
    print(
        formatted[
            [
                "Team",
                "Code",
                "1st",
                "2nd",
                "3rd",
                "4th",
                "Top 2",
                "Top 3",
            ]
        ].to_string(index=False)
    )
    print()
    print(f"Group simulations: {group_simulation_count:,}")
    print(f"Group runtime: {elapsed_seconds:.2f} seconds")
    print()


def print_tournament_simulation(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
) -> None:
    tournament_simulation_count = 10_000

    start = time.perf_counter()

    tournament_probs = simulate_qualification_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=tournament_simulation_count,
        seed=42,
    )

    tournament_elapsed_seconds = time.perf_counter() - start

    export_dataframe(tournament_probs, "tournament_probabilities.csv")

    tournament_display = tournament_probs.copy()

    for column in [
        "qualify_prob",
        "first_prob",
        "second_prob",
        "third_qualify_prob",
    ]:
        tournament_display[column] = tournament_display[column].map(format_probability)

    tournament_display = tournament_display.rename(
        columns={
            "team": "Team",
            "code": "Code",
            "group": "Group",
            "qualify_prob": "Qualify",
            "first_prob": "1st",
            "second_prob": "2nd",
            "third_qualify_prob": "3rd Qual",
        }
    )

    print("Tournament Qualification Probabilities")
    print("======================================")
    print(
        tournament_display[
            [
                "Team",
                "Code",
                "Group",
                "Qualify",
                "1st",
                "2nd",
                "3rd Qual",
            ]
        ].to_string(index=False)
    )
    print()
    print(f"Tournament simulations: {tournament_simulation_count:,}")
    print(f"Tournament runtime: {tournament_elapsed_seconds:.2f} seconds")
    print()


def print_round_probabilities(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
) -> None:
    round_simulation_count = 10_000

    print("Running tournament round simulations...")
    print(f"Round simulations: {round_simulation_count:,}")
    print()

    start = time.perf_counter()

    round_probs = simulate_tournament_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=round_simulation_count,
        seed=42,
    )

    elapsed_seconds = time.perf_counter() - start

    export_dataframe(round_probs, "tournament_round_probabilities.csv")

    display = round_probs.copy()

    for column in [
        "r32_prob",
        "r16_prob",
        "qf_prob",
        "sf_prob",
        "final_prob",
        "champion_prob",
    ]:
        display[column] = display[column].map(format_probability)

    display = display.rename(
        columns={
            "team": "Team",
            "code": "Code",
            "group": "Group",
            "r32_prob": "R32",
            "r16_prob": "R16",
            "qf_prob": "QF",
            "sf_prob": "SF",
            "final_prob": "Final",
            "champion_prob": "Champion",
        }
    )

    print("Tournament Round Probabilities")
    print("==============================")
    print(
        display[
            [
                "Team",
                "Code",
                "Group",
                "R32",
                "R16",
                "QF",
                "SF",
                "Final",
                "Champion",
            ]
        ].head(25).to_string(index=False)
    )
    print()
    print(f"Round simulations: {round_simulation_count:,}")
    print(f"Round simulation runtime: {elapsed_seconds:.2f} seconds")
    print()



def main() -> None:
    teams = pd.read_csv("data/teams.csv")
    fixtures = pd.read_csv("data/fixtures.csv")
    results = pd.read_csv("data/results.csv")
    ratings = pd.read_csv("data/ratings.csv")

    coverage = validate_group_fixture_coverage(
        teams=teams,
        fixtures=fixtures,
    )

    print()
    print("Fixture Coverage Check")
    print("======================")
    print(
        coverage[
            [
                "group",
                "team_count",
                "fixture_count",
                "expected_fixture_count",
                "has_complete_fixture_set",
                "missing_from_fixtures",
            ]
        ].to_string(index=False)
    )
    print()

    standings_by_group = calculate_all_group_standings(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )

    print_all_group_standings(standings_by_group)

    third_place_table = calculate_current_third_place_table(standings_by_group)

    print_third_place_table(third_place_table)

    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
    )

    print_projected_qualifiers(projected_qualifiers)

    bracket_slots = pd.read_csv("data/bracket_slots.csv")

    round_of_32 = build_projected_round_of_32(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )

    print_projected_round_of_32(round_of_32)

    export_all_group_standings(standings_by_group)
    export_dataframe(third_place_table, "third_place_table.csv")
    export_dataframe(projected_qualifiers, "projected_qualifiers.csv")
    export_dataframe(round_of_32, "projected_round_of_32.csv")

    print_group_d_simulation(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
    )

    incomplete_groups = coverage[~coverage["has_complete_fixture_set"]]

    if not incomplete_groups.empty:
        print("Tournament Qualification Probabilities")
        print("======================================")
        print(
            "Skipped: fixture data is incomplete for one or more groups. "
            "Load all six fixtures per group before running tournament-wide qualification odds."
        )
        print()
        return

    print_tournament_simulation(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
    )

    print_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
    )


if __name__ == "__main__":
    main()
