from __future__ import annotations

import pandas as pd

from src.tiebreakers import (
    apply_fifa_group_tiebreakers,
    head_to_head_table,
    rank_third_place_table,
)


def test_head_to_head_table_counts_points_and_goal_difference() -> None:
    match_rows = [
        {
            "group": "A",
            "home_team": "team_a",
            "away_team": "team_b",
            "home_score": 2,
            "away_score": 1,
        },
        {
            "group": "A",
            "home_team": "team_b",
            "away_team": "team_c",
            "home_score": 1,
            "away_score": 0,
        },
    ]

    table = head_to_head_table(["team_a", "team_b", "team_c"], match_rows)

    assert table["team_a"]["h2h_points"] == 3
    assert table["team_b"]["h2h_points"] == 3
    assert table["team_c"]["h2h_points"] == 0
    assert table["team_a"]["h2h_goal_difference"] == 1
    assert table["team_b"]["h2h_goal_difference"] == 0


def test_apply_fifa_group_tiebreakers_uses_head_to_head_for_two_team_tie() -> None:
    standings = pd.DataFrame(
        [
            {
                "team_id": "team_a",
                "points": 3,
                "goal_difference": 1,
                "goals_for": 2,
                "goals_against": 1,
                "played": 1,
                "wins": 1,
                "draws": 0,
                "losses": 0,
            },
            {
                "team_id": "team_b",
                "points": 3,
                "goal_difference": -1,
                "goals_for": 1,
                "goals_against": 2,
                "played": 1,
                "wins": 0,
                "draws": 0,
                "losses": 1,
            },
        ]
    )

    match_rows = [
        {
            "group": "A",
            "home_team": "team_a",
            "away_team": "team_b",
            "home_score": 2,
            "away_score": 1,
        },
    ]

    ranked = apply_fifa_group_tiebreakers(standings, match_rows)

    assert ranked.iloc[0]["team_id"] == "team_a"
    assert ranked.iloc[1]["team_id"] == "team_b"


def test_rank_third_place_table_orders_by_points_then_goal_difference() -> None:
    third_place = pd.DataFrame(
        [
            {
                "team_id": "t1",
                "group": "A",
                "points": 4,
                "goal_difference": 0,
                "goals_for": 3,
                "goals_against": 3,
            },
            {
                "team_id": "t2",
                "group": "B",
                "points": 4,
                "goal_difference": 1,
                "goals_for": 4,
                "goals_against": 3,
            },
            {
                "team_id": "t3",
                "group": "C",
                "points": 3,
                "goal_difference": 2,
                "goals_for": 5,
                "goals_against": 3,
            },
        ]
    )

    ranked = rank_third_place_table(
        third_place,
        conduct_scores={"t1": 0.0, "t2": 0.0, "t3": 0.0},
        ranking_fallback={"t1": 100.0, "t2": 200.0, "t3": 300.0},
    )

    assert ranked.iloc[0]["team_id"] == "t2"
    assert ranked.iloc[1]["team_id"] == "t1"
    assert ranked.iloc[2]["team_id"] == "t3"


def test_rank_third_place_table_uses_conduct_score_when_points_are_tied() -> None:
    third_place = pd.DataFrame(
        [
            {
                "team_id": "clean",
                "group": "A",
                "points": 4,
                "goal_difference": 0,
                "goals_for": 3,
                "goals_against": 3,
            },
            {
                "team_id": "cards",
                "group": "B",
                "points": 4,
                "goal_difference": 0,
                "goals_for": 3,
                "goals_against": 3,
            },
        ]
    )

    ranked = rank_third_place_table(
        third_place,
        conduct_scores={"clean": 0.0, "cards": -2.0},
        ranking_fallback={"clean": 100.0, "cards": 200.0},
    )

    assert ranked.iloc[0]["team_id"] == "clean"
    assert ranked.iloc[1]["team_id"] == "cards"
