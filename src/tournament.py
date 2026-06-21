from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from dataclasses import dataclass

import numpy as np
import pandas as pd

from src.simulator import (
    build_rating_lookup,
    get_remaining_group_matches,
    rank_state,
    simulate_score,
    apply_result_to_state,
    standings_df_to_state,
)
from src.standings import calculate_group_standings


GROUPS = list("ABCDEFGHIJKL")


@dataclass(frozen=True)
class PreparedGroup:
    group: str
    base_state: dict[str, dict[str, int]]
    remaining_matches: list[dict[str, str]]


def prepare_groups(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
) -> dict[str, PreparedGroup]:
    prepared: dict[str, PreparedGroup] = {}

    for group in GROUPS:
        current_standings = calculate_group_standings(
            teams=teams,
            fixtures=fixtures,
            results=results,
            group=group,
        )

        base_state = standings_df_to_state(current_standings)

        remaining_matches = get_remaining_group_matches(
            fixtures=fixtures,
            results=results,
            group=group,
        )

        prepared[group] = PreparedGroup(
            group=group,
            base_state=base_state,
            remaining_matches=remaining_matches,
        )

    return prepared


def simulate_prepared_group_once(
    prepared_group: PreparedGroup,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> list[dict]:
    state = deepcopy(prepared_group.base_state)

    for match in prepared_group.remaining_matches:
        home_team = match["home_team"]
        away_team = match["away_team"]

        home_score, away_score = simulate_score(
            home_team=home_team,
            away_team=away_team,
            rating_lookup=rating_lookup,
            rng=rng,
        )

        apply_result_to_state(
            state=state,
            home_team=home_team,
            away_team=away_team,
            home_score=home_score,
            away_score=away_score,
        )

    ranked_team_ids = rank_state(state)

    group_rows = []

    for rank, team_id in enumerate(ranked_team_ids, start=1):
        metrics = state[team_id]

        group_rows.append(
            {
                "team_id": team_id,
                "group": prepared_group.group,
                "group_rank": rank,
                "points": metrics["points"],
                "goal_difference": metrics["goal_difference"],
                "goals_for": metrics["goals_for"],
            }
        )

    return group_rows


def simulate_all_groups_once(
    prepared_groups: dict[str, PreparedGroup],
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> dict[str, list[dict]]:
    group_results: dict[str, list[dict]] = {}

    for group, prepared_group in prepared_groups.items():
        group_results[group] = simulate_prepared_group_once(
            prepared_group=prepared_group,
            rating_lookup=rating_lookup,
            rng=rng,
        )

    return group_results


def select_best_third_place_teams(
    group_results: dict[str, list[dict]],
    count: int = 8,
) -> list[dict]:
    third_place_teams = []

    for rows in group_results.values():
        third_place = next(row for row in rows if row["group_rank"] == 3)
        third_place_teams.append(third_place)

    third_place_teams = sorted(
        third_place_teams,
        key=lambda row: (
            row["points"],
            row["goal_difference"],
            row["goals_for"],
            row["team_id"],
        ),
        reverse=True,
    )

    return third_place_teams[:count]


def simulate_qualification_probabilities(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    simulations: int = 10_000,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    prepared_groups = prepare_groups(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )

    rating_lookup = build_rating_lookup(ratings)

    qualification_counts = defaultdict(int)
    first_counts = defaultdict(int)
    second_counts = defaultdict(int)
    third_qualified_counts = defaultdict(int)

    for _ in range(simulations):
        group_results = simulate_all_groups_once(
            prepared_groups=prepared_groups,
            rating_lookup=rating_lookup,
            rng=rng,
        )

        best_thirds = select_best_third_place_teams(group_results)
        best_third_ids = {row["team_id"] for row in best_thirds}

        for rows in group_results.values():
            for row in rows:
                team_id = row["team_id"]
                group_rank = row["group_rank"]

                if group_rank == 1:
                    qualification_counts[team_id] += 1
                    first_counts[team_id] += 1
                elif group_rank == 2:
                    qualification_counts[team_id] += 1
                    second_counts[team_id] += 1
                elif group_rank == 3 and team_id in best_third_ids:
                    qualification_counts[team_id] += 1
                    third_qualified_counts[team_id] += 1

    rows = []

    for _, team in teams.iterrows():
        team_id = team["team_id"]

        rows.append(
            {
                "team_id": team_id,
                "team": team["name"],
                "code": team["code"],
                "group": team["group"],
                "qualify_prob": qualification_counts[team_id] / simulations,
                "first_prob": first_counts[team_id] / simulations,
                "second_prob": second_counts[team_id] / simulations,
                "third_qualify_prob": third_qualified_counts[team_id] / simulations,
            }
        )

    output = pd.DataFrame(rows)

    output = output.sort_values(
        by=["qualify_prob", "first_prob", "second_prob", "third_qualify_prob"],
        ascending=[False, False, False, False],
    ).reset_index(drop=True)

    return output
