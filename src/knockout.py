from __future__ import annotations

from collections import defaultdict
from copy import deepcopy

import numpy as np
import pandas as pd

from src.reporting import calculate_current_projected_qualifiers
from src.simulator import (
    apply_result_to_state,
    build_rating_lookup,
    get_remaining_group_matches,
    rank_state,
    simulate_score,
    standings_df_to_state,
)
from src.standings import calculate_group_standings
from src.tournament import GROUPS, select_best_third_place_teams


ROUND_COLUMNS = {
    "r32": "r32_count",
    "r16": "r16_count",
    "qf": "qf_count",
    "sf": "sf_count",
    "final": "final_count",
    "champion": "champion_count",
}


def simulate_group_stage_once(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> dict[str, list[dict]]:
    group_results: dict[str, list[dict]] = {}

    for group in GROUPS:
        current_standings = calculate_group_standings(
            teams=teams,
            fixtures=fixtures,
            results=results,
            group=group,
        )

        state = standings_df_to_state(current_standings)

        remaining_matches = get_remaining_group_matches(
            fixtures=fixtures,
            results=results,
            group=group,
        )

        for match in remaining_matches:
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

        rows = []

        for rank, team_id in enumerate(ranked_team_ids, start=1):
            metrics = state[team_id]

            rows.append(
                {
                    "team_id": team_id,
                    "group": group,
                    "group_rank": rank,
                    "points": metrics["points"],
                    "goal_difference": metrics["goal_difference"],
                    "goals_for": metrics["goals_for"],
                }
            )

        group_results[group] = rows

    return group_results


def group_results_to_projected_qualifiers(
    teams: pd.DataFrame,
    group_results: dict[str, list[dict]],
) -> pd.DataFrame:
    team_lookup = {
        row["team_id"]: {
            "team": row["name"],
            "code": row["code"],
            "group": row["group"],
        }
        for _, row in teams.iterrows()
    }

    rows = []

    for group, group_rows in group_results.items():
        sorted_rows = sorted(group_rows, key=lambda row: row["group_rank"])

        for row in sorted_rows[:2]:
            team_id = row["team_id"]
            meta = team_lookup[team_id]

            qualifying_path = (
                "Group winner" if row["group_rank"] == 1 else "Group runner-up"
            )

            source = (
                f"1st Group {group}"
                if row["group_rank"] == 1
                else f"2nd Group {group}"
            )

            rows.append(
                {
                    "source": source,
                    "group": group,
                    "qualifying_path": qualifying_path,
                    "team": meta["team"],
                    "code": meta["code"],
                    "team_id": team_id,
                    "points": row["points"],
                    "goal_difference": row["goal_difference"],
                    "goals_for": row["goals_for"],
                }
            )

    best_thirds = select_best_third_place_teams(group_results)

    for row in best_thirds:
        team_id = row["team_id"]
        meta = team_lookup[team_id]

        rows.append(
            {
                "source": f"3rd Group {row['group']}",
                "group": row["group"],
                "qualifying_path": "Best third-place",
                "team": meta["team"],
                "code": meta["code"],
                "team_id": team_id,
                "points": row["points"],
                "goal_difference": row["goal_difference"],
                "goals_for": row["goals_for"],
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


def advance_knockout_match(
    team_a: str,
    team_b: str,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> str:
    """
    Simulate a knockout match winner.

    MVP behavior:
    - simulate regulation score using Poisson
    - if draw, use rating-weighted coin flip for extra time / penalties

    Later:
    - model extra time and penalties separately
    """
    score_a, score_b = simulate_score(
        home_team=team_a,
        away_team=team_b,
        rating_lookup=rating_lookup,
        rng=rng,
    )

    if score_a > score_b:
        return team_a

    if score_b > score_a:
        return team_b

    rating_a = rating_lookup[team_a]
    rating_b = rating_lookup[team_b]

    probability_a_advances = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

    return team_a if rng.random() < probability_a_advances else team_b


def pair_bracket_sequentially(team_ids: list[str]) -> list[tuple[str, str]]:
    """
    MVP generic knockout pairing.

    This is not the official FIFA bracket mapping.
    It pairs teams sequentially for whatever round is being simulated:
    - 32 teams -> 16 matches
    - 16 teams -> 8 matches
    - 8 teams -> 4 matches
    - 4 teams -> 2 matches
    - 2 teams -> 1 match
    """
    if len(team_ids) < 2:
        raise ValueError(f"Expected at least 2 teams, got {len(team_ids)}")

    if len(team_ids) % 2 != 0:
        raise ValueError(f"Expected an even number of teams, got {len(team_ids)}")

    return [
        (team_ids[index], team_ids[index + 1])
        for index in range(0, len(team_ids), 2)
    ]


def simulate_knockout_bracket_once(
    qualified_team_ids: list[str],
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> dict[str, set[str] | str]:
    r32_teams = set(qualified_team_ids)

    r32_pairings = pair_bracket_sequentially(qualified_team_ids)

    r16_teams = [
        advance_knockout_match(a, b, rating_lookup, rng)
        for a, b in r32_pairings
    ]

    qf_pairings = pair_bracket_sequentially(r16_teams)
    qf_teams = [
        advance_knockout_match(a, b, rating_lookup, rng)
        for a, b in qf_pairings
    ]

    sf_pairings = pair_bracket_sequentially(qf_teams)
    sf_teams = [
        advance_knockout_match(a, b, rating_lookup, rng)
        for a, b in sf_pairings
    ]

    final_pairings = pair_bracket_sequentially(sf_teams)
    final_teams = [
        advance_knockout_match(a, b, rating_lookup, rng)
        for a, b in final_pairings
    ]

    champion = advance_knockout_match(
        final_teams[0],
        final_teams[1],
        rating_lookup,
        rng,
    )

    return {
        "r32": set(r32_teams),
        "r16": set(r16_teams),
        "qf": set(qf_teams),
        "sf": set(sf_teams),
        "final": set(final_teams),
        "champion": champion,
    }


def simulate_tournament_round_probabilities(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    simulations: int = 10_000,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rating_lookup = build_rating_lookup(ratings)

    prepared_groups = {}

    for group in GROUPS:
        current_standings = calculate_group_standings(
            teams=teams,
            fixtures=fixtures,
            results=results,
            group=group,
        )

        prepared_groups[group] = {
            "base_state": standings_df_to_state(current_standings),
            "remaining_matches": get_remaining_group_matches(
                fixtures=fixtures,
                results=results,
                group=group,
            ),
        }

    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for _ in range(simulations):
        group_results: dict[str, list[dict]] = {}

        for group, prepared_group in prepared_groups.items():
            state = deepcopy(prepared_group["base_state"])

            for match in prepared_group["remaining_matches"]:
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

            rows = []

            for rank, team_id in enumerate(ranked_team_ids, start=1):
                metrics = state[team_id]

                rows.append(
                    {
                        "team_id": team_id,
                        "group": group,
                        "group_rank": rank,
                        "points": metrics["points"],
                        "goal_difference": metrics["goal_difference"],
                        "goals_for": metrics["goals_for"],
                    }
                )

            group_results[group] = rows

        qualifiers = group_results_to_projected_qualifiers(
            teams=teams,
            group_results=group_results,
        )

        qualified_team_ids = list(qualifiers["team_id"])

        knockout_result = simulate_knockout_bracket_once(
            qualified_team_ids=qualified_team_ids,
            rating_lookup=rating_lookup,
            rng=rng,
        )

        for stage in ["r32", "r16", "qf", "sf", "final"]:
            for team_id in knockout_result[stage]:
                counts[team_id][ROUND_COLUMNS[stage]] += 1

        champion = knockout_result["champion"]
        counts[champion][ROUND_COLUMNS["champion"]] += 1

    rows = []

    for _, team in teams.iterrows():
        team_id = team["team_id"]

        rows.append(
            {
                "team_id": team_id,
                "team": team["name"],
                "code": team["code"],
                "group": team["group"],
                "r32_prob": counts[team_id]["r32_count"] / simulations,
                "r16_prob": counts[team_id]["r16_count"] / simulations,
                "qf_prob": counts[team_id]["qf_count"] / simulations,
                "sf_prob": counts[team_id]["sf_count"] / simulations,
                "final_prob": counts[team_id]["final_count"] / simulations,
                "champion_prob": counts[team_id]["champion_count"] / simulations,
            }
        )

    output = pd.DataFrame(rows)

    output = output.sort_values(
        by=["champion_prob", "final_prob", "sf_prob", "qf_prob", "r16_prob"],
        ascending=[False, False, False, False, False],
    ).reset_index(drop=True)

    return output
