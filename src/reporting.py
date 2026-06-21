from __future__ import annotations

import pandas as pd

from src.standings import calculate_group_standings
from src.tiebreakers import (
    load_conduct_scores,
    load_ranking_fallback,
    rank_third_place_table,
)


GROUPS = list("ABCDEFGHIJKL")


def calculate_all_group_standings(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
) -> dict[str, pd.DataFrame]:
    standings_by_group = {}

    for group in GROUPS:
        standings_by_group[group] = calculate_group_standings(
            teams=teams,
            fixtures=fixtures,
            results=results,
            group=group,
        )

    return standings_by_group


def calculate_current_third_place_table(
    standings_by_group: dict[str, pd.DataFrame],
) -> pd.DataFrame:
    rows = []

    for group, standings in standings_by_group.items():
        if len(standings) < 3:
            continue

        third_place = standings.iloc[2].copy()

        rows.append(
            {
                "group": group,
                "team": third_place["team"],
                "code": third_place["code"],
                "team_id": third_place["team_id"],
                "played": third_place["played"],
                "points": third_place["points"],
                "goal_difference": third_place["goal_difference"],
                "goals_for": third_place["goals_for"],
                "goals_against": third_place["goals_against"],
            }
        )

    third_place_table = pd.DataFrame(rows)

    third_place_table = rank_third_place_table(
        third_place_table=third_place_table,
        conduct_scores=load_conduct_scores(),
        ranking_fallback=load_ranking_fallback(),
    )

    third_place_table = third_place_table.rename(columns={"rank": "third_rank"})
    third_place_table["currently_qualifies"] = third_place_table["third_rank"] <= 8

    return third_place_table


def calculate_current_projected_qualifiers(
    standings_by_group: dict[str, pd.DataFrame],
    third_place_table: pd.DataFrame,
) -> pd.DataFrame:
    rows = []

    for group, standings in standings_by_group.items():
        group_winner = standings.iloc[0]
        group_runner_up = standings.iloc[1]

        rows.append(
            {
                "source": f"1st Group {group}",
                "group": group,
                "qualifying_path": "Group winner",
                "team": group_winner["team"],
                "code": group_winner["code"],
                "team_id": group_winner["team_id"],
                "points": group_winner["points"],
                "goal_difference": group_winner["goal_difference"],
                "goals_for": group_winner["goals_for"],
            }
        )

        rows.append(
            {
                "source": f"2nd Group {group}",
                "group": group,
                "qualifying_path": "Group runner-up",
                "team": group_runner_up["team"],
                "code": group_runner_up["code"],
                "team_id": group_runner_up["team_id"],
                "points": group_runner_up["points"],
                "goal_difference": group_runner_up["goal_difference"],
                "goals_for": group_runner_up["goals_for"],
            }
        )

    qualifying_thirds = third_place_table[
        third_place_table["currently_qualifies"]
    ].copy()

    for _, third in qualifying_thirds.iterrows():
        rows.append(
            {
                "source": f"3rd Group {third['group']}",
                "group": third["group"],
                "qualifying_path": "Best third-place",
                "team": third["team"],
                "code": third["code"],
                "team_id": third["team_id"],
                "points": third["points"],
                "goal_difference": third["goal_difference"],
                "goals_for": third["goals_for"],
            }
        )

    qualifiers = pd.DataFrame(rows)

    path_order = {
        "Group winner": 1,
        "Group runner-up": 2,
        "Best third-place": 3,
    }

    qualifiers["path_order"] = qualifiers["qualifying_path"].map(path_order)

    qualifiers = qualifiers.sort_values(
        by=["path_order", "group", "points", "goal_difference", "goals_for"],
        ascending=[True, True, False, False, False],
    ).reset_index(drop=True)

    qualifiers.insert(0, "seed", range(1, len(qualifiers) + 1))

    return qualifiers.drop(columns=["path_order"])
