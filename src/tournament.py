from __future__ import annotations

from collections import defaultdict

import numpy as np
import pandas as pd

from src.simulator import (
    build_rating_lookup,
    prepare_groups,
    simulate_all_groups_once,
)
from src.tiebreakers import (
    load_conduct_scores,
    load_ranking_fallback,
    rank_third_place_rows,
)


def select_best_third_place_teams(
    group_results: dict[str, list[dict]],
    count: int = 8,
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> list[dict]:
    third_place_teams = []

    for rows in group_results.values():
        third_place = next(row for row in rows if row["group_rank"] == 3)
        third_place_teams.append(third_place)

    third_place_teams = rank_third_place_rows(
        third_place_rows=third_place_teams,
        conduct_scores=conduct_scores,
        ranking_fallback=ranking_fallback,
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
    conduct_scores = load_conduct_scores()
    ranking_fallback = load_ranking_fallback()

    qualification_counts = defaultdict(int)
    first_counts = defaultdict(int)
    second_counts = defaultdict(int)
    third_qualified_counts = defaultdict(int)

    for _ in range(simulations):
        group_results = simulate_all_groups_once(
            prepared_groups=prepared_groups,
            rating_lookup=rating_lookup,
            rng=rng,
            conduct_scores=conduct_scores,
            ranking_fallback=ranking_fallback,
        )

        best_thirds = select_best_third_place_teams(
            group_results,
            conduct_scores=conduct_scores,
            ranking_fallback=ranking_fallback,
        )
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
