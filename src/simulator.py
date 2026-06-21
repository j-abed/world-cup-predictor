from __future__ import annotations

from collections import defaultdict
from copy import deepcopy

import numpy as np
import pandas as pd

from src.standings import calculate_group_standings


StandingState = dict[str, dict[str, int]]


def format_probability(value: float) -> str:
    return f"{value * 100:5.1f}%"


def rating_to_expected_goal_diff(rating_diff: float) -> float:
    """
    Convert Elo-like rating difference into expected goal difference.

    MVP assumption:
    100 rating points ≈ 0.35 expected goals.
    """
    return rating_diff / 285.0


def build_rating_lookup(ratings: pd.DataFrame) -> dict[str, float]:
    return {
        str(row["team_id"]): float(row["rating"])
        for _, row in ratings.iterrows()
    }


def get_match_goal_expectations(
    home_team: str,
    away_team: str,
    rating_lookup: dict[str, float],
) -> tuple[float, float]:
    home_rating = rating_lookup[home_team]
    away_rating = rating_lookup[away_team]

    rating_diff = home_rating - away_rating
    expected_goal_diff = rating_to_expected_goal_diff(rating_diff)

    baseline_total_goals = 2.6

    home_lambda = max(0.2, (baseline_total_goals + expected_goal_diff) / 2)
    away_lambda = max(0.2, (baseline_total_goals - expected_goal_diff) / 2)

    return home_lambda, away_lambda


def simulate_score(
    home_team: str,
    away_team: str,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> tuple[int, int]:
    home_lambda, away_lambda = get_match_goal_expectations(
        home_team=home_team,
        away_team=away_team,
        rating_lookup=rating_lookup,
    )

    home_score = int(rng.poisson(home_lambda))
    away_score = int(rng.poisson(away_lambda))

    return home_score, away_score


def standings_df_to_state(standings: pd.DataFrame) -> StandingState:
    state: StandingState = {}

    for _, row in standings.iterrows():
        team_id = str(row["team_id"])

        state[team_id] = {
            "played": int(row["played"]),
            "wins": int(row["wins"]),
            "draws": int(row["draws"]),
            "losses": int(row["losses"]),
            "goals_for": int(row["goals_for"]),
            "goals_against": int(row["goals_against"]),
            "goal_difference": int(row["goal_difference"]),
            "points": int(row["points"]),
        }

    return state


def apply_result_to_state(
    state: StandingState,
    home_team: str,
    away_team: str,
    home_score: int,
    away_score: int,
) -> None:
    home = state[home_team]
    away = state[away_team]

    home["played"] += 1
    away["played"] += 1

    home["goals_for"] += home_score
    home["goals_against"] += away_score

    away["goals_for"] += away_score
    away["goals_against"] += home_score

    home["goal_difference"] = home["goals_for"] - home["goals_against"]
    away["goal_difference"] = away["goals_for"] - away["goals_against"]

    if home_score > away_score:
        home["wins"] += 1
        away["losses"] += 1
        home["points"] += 3
    elif away_score > home_score:
        away["wins"] += 1
        home["losses"] += 1
        away["points"] += 3
    else:
        home["draws"] += 1
        away["draws"] += 1
        home["points"] += 1
        away["points"] += 1


def rank_state(
    state: StandingState,
) -> list[str]:
    """
    MVP ranking:
    1. Points
    2. Goal difference
    3. Goals scored
    4. Team ID for deterministic sorting

    Later we will add FIFA tiebreakers.
    """
    return sorted(
        state.keys(),
        key=lambda team_id: (
            state[team_id]["points"],
            state[team_id]["goal_difference"],
            state[team_id]["goals_for"],
            team_id,
        ),
        reverse=True,
    )


def get_remaining_group_matches(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    group: str,
) -> list[dict[str, str]]:
    completed_match_ids = set(results.loc[results["status"] == "Complete", "match_id"])

    remaining = fixtures[
        (fixtures["stage"] == "Group")
        & (fixtures["group"] == group)
        & (~fixtures["match_id"].isin(completed_match_ids))
    ].copy()

    remaining = remaining.sort_values("kickoff").reset_index(drop=True)

    return [
        {
            "match_id": str(row["match_id"]),
            "home_team": str(row["home_team"]),
            "away_team": str(row["away_team"]),
        }
        for _, row in remaining.iterrows()
    ]


def simulate_group_finish_probabilities(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    group: str,
    simulations: int = 10_000,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

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

    rating_lookup = build_rating_lookup(ratings)

    finish_counts: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for _ in range(simulations):
        state = deepcopy(base_state)

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

        for index, team_id in enumerate(ranked_team_ids, start=1):
            finish_counts[team_id][index] += 1

    rows = []

    group_teams = teams[teams["group"] == group].copy()

    for _, team in group_teams.iterrows():
        team_id = str(team["team_id"])

        row = {
            "team_id": team_id,
            "team": team["name"],
            "code": team["code"],
        }

        for rank in range(1, 5):
            row[f"finish_{rank}_prob"] = finish_counts[team_id][rank] / simulations

        row["top_2_prob"] = row["finish_1_prob"] + row["finish_2_prob"]
        row["top_3_prob"] = row["top_2_prob"] + row["finish_3_prob"]

        rows.append(row)

    output = pd.DataFrame(rows)

    output = output.sort_values(
        by=["finish_1_prob", "top_2_prob", "top_3_prob"],
        ascending=[False, False, False],
    ).reset_index(drop=True)

    return output
