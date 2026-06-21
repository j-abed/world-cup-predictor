from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import pandas as pd


FAIR_PLAY_PATH = Path("data/fair_play.csv")
RATINGS_PATH = Path("data/ratings.csv")


def load_conduct_scores(path: Path = FAIR_PLAY_PATH) -> dict[str, float]:
    if not path.exists():
        return {}

    fair_play = pd.read_csv(path)

    if "team_id" not in fair_play.columns or "conduct_score" not in fair_play.columns:
        raise RuntimeError(
            f"{path} must contain team_id and conduct_score columns."
        )

    return {
        str(row["team_id"]): float(row["conduct_score"])
        for _, row in fair_play.iterrows()
    }


def load_ranking_fallback(path: Path = RATINGS_PATH) -> dict[str, float]:
    """
    Fallback ordering when all competitive and conduct criteria are tied.

    Until official FIFA ranking points are implemented, this uses the current
    ratings.csv rating column as a deterministic ranking proxy.
    """
    if not path.exists():
        return {}

    ratings = pd.read_csv(path)

    if "team_id" not in ratings.columns or "rating" not in ratings.columns:
        raise RuntimeError(f"{path} must contain team_id and rating columns.")

    return {
        str(row["team_id"]): float(row["rating"])
        for _, row in ratings.iterrows()
    }


def build_match_rows(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    group: str | None = None,
) -> list[dict]:
    completed_results = results[results["status"] == "Complete"].copy()

    matches = completed_results.merge(
        fixtures,
        on="match_id",
        how="left",
        validate="many_to_one",
    )

    if group is not None:
        matches = matches[matches["group"] == group].copy()

    rows = []

    for _, match in matches.iterrows():
        rows.append(
            {
                "group": match["group"],
                "home_team": str(match["home_team"]),
                "away_team": str(match["away_team"]),
                "home_score": int(match["home_score"]),
                "away_score": int(match["away_score"]),
            }
        )

    return rows


def head_to_head_table(team_ids: list[str], match_rows: list[dict]) -> dict[str, dict]:
    tied = set(team_ids)

    table = {
        team_id: {
            "h2h_points": 0,
            "h2h_goals_for": 0,
            "h2h_goals_against": 0,
            "h2h_goal_difference": 0,
        }
        for team_id in team_ids
    }

    for match in match_rows:
        home = str(match["home_team"])
        away = str(match["away_team"])

        if home not in tied or away not in tied:
            continue

        home_score = int(match["home_score"])
        away_score = int(match["away_score"])

        table[home]["h2h_goals_for"] += home_score
        table[home]["h2h_goals_against"] += away_score
        table[away]["h2h_goals_for"] += away_score
        table[away]["h2h_goals_against"] += home_score

        if home_score > away_score:
            table[home]["h2h_points"] += 3
        elif away_score > home_score:
            table[away]["h2h_points"] += 3
        else:
            table[home]["h2h_points"] += 1
            table[away]["h2h_points"] += 1

    for team_id in team_ids:
        table[team_id]["h2h_goal_difference"] = (
            table[team_id]["h2h_goals_for"] - table[team_id]["h2h_goals_against"]
        )

    return table


def split_equal_groups(
    standings: pd.DataFrame,
    criteria: list[str],
) -> list[pd.DataFrame]:
    groups = []

    grouped = standings.groupby(criteria, sort=False, dropna=False)

    for _, subset in grouped:
        groups.append(subset.copy())

    return groups


def rank_tied_subset(
    tied_subset: pd.DataFrame,
    match_rows: list[dict],
    conduct_scores: dict[str, float],
    ranking_fallback: dict[str, float],
) -> pd.DataFrame:
    if len(tied_subset) == 1:
        return tied_subset.copy()

    tied_subset = tied_subset.copy()
    tied_team_ids = [str(team_id) for team_id in tied_subset["team_id"].tolist()]

    h2h = head_to_head_table(tied_team_ids, match_rows)

    tied_subset["h2h_points"] = tied_subset["team_id"].map(
        lambda team_id: h2h[str(team_id)]["h2h_points"]
    )
    tied_subset["h2h_goal_difference"] = tied_subset["team_id"].map(
        lambda team_id: h2h[str(team_id)]["h2h_goal_difference"]
    )
    tied_subset["h2h_goals_for"] = tied_subset["team_id"].map(
        lambda team_id: h2h[str(team_id)]["h2h_goals_for"]
    )
    tied_subset["conduct_score"] = tied_subset["team_id"].map(
        lambda team_id: conduct_scores.get(str(team_id), 0.0)
    )
    tied_subset["ranking_fallback"] = tied_subset["team_id"].map(
        lambda team_id: ranking_fallback.get(str(team_id), 0.0)
    )

    tied_subset = tied_subset.sort_values(
        by=[
            "h2h_points",
            "h2h_goal_difference",
            "h2h_goals_for",
            "conduct_score",
            "ranking_fallback",
            "team_id",
        ],
        ascending=[False, False, False, False, False, True],
    ).reset_index(drop=True)

    return tied_subset


def apply_fifa_group_tiebreakers(
    standings: pd.DataFrame,
    match_rows: list[dict],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> pd.DataFrame:
    """
    Rank one group's standings using a FIFA-style tiebreaker chain.

    Implemented chain:
    1. points
    2. goal difference
    3. goals for
    4. head-to-head points among still-tied teams
    5. head-to-head goal difference among still-tied teams
    6. head-to-head goals for among still-tied teams
    7. conduct/fair-play score
    8. ranking fallback
    9. deterministic team_id fallback
    """
    conduct_scores = conduct_scores or {}
    ranking_fallback = ranking_fallback or {}

    standings = standings.copy()

    primary_sorted = standings.sort_values(
        by=["points", "goal_difference", "goals_for"],
        ascending=[False, False, False],
    ).reset_index(drop=True)

    ranked_parts = []

    for tied_subset in split_equal_groups(
        primary_sorted,
        criteria=["points", "goal_difference", "goals_for"],
    ):
        ranked_parts.append(
            rank_tied_subset(
                tied_subset=tied_subset,
                match_rows=match_rows,
                conduct_scores=conduct_scores,
                ranking_fallback=ranking_fallback,
            )
        )

    ranked = pd.concat(ranked_parts, ignore_index=True)

    cleanup_columns = [
        "h2h_points",
        "h2h_goal_difference",
        "h2h_goals_for",
        "conduct_score",
        "ranking_fallback",
    ]

    for column in cleanup_columns:
        if column in ranked.columns:
            ranked = ranked.drop(columns=[column])

    ranked = ranked.reset_index(drop=True)

    if "rank" in ranked.columns:
        ranked = ranked.drop(columns=["rank"])

    ranked.insert(0, "rank", range(1, len(ranked) + 1))

    return ranked


def rank_third_place_table(
    third_place_table: pd.DataFrame,
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> pd.DataFrame:
    """
    Rank third-place teams across groups.

    Third-place ranking does not have head-to-head across groups, so it uses:
    points, goal difference, goals for, conduct score, ranking fallback.
    """
    conduct_scores = conduct_scores or {}
    ranking_fallback = ranking_fallback or {}

    table = third_place_table.copy()

    table["conduct_score"] = table["team_id"].map(
        lambda team_id: conduct_scores.get(str(team_id), 0.0)
    )
    table["ranking_fallback"] = table["team_id"].map(
        lambda team_id: ranking_fallback.get(str(team_id), 0.0)
    )

    table = table.sort_values(
        by=[
            "points",
            "goal_difference",
            "goals_for",
            "conduct_score",
            "ranking_fallback",
            "team_id",
        ],
        ascending=[False, False, False, False, False, True],
    ).reset_index(drop=True)

    table = table.drop(columns=["conduct_score", "ranking_fallback"])

    if "rank" in table.columns:
        table = table.drop(columns=["rank"])

    table.insert(0, "rank", range(1, len(table) + 1))

    return table


def standings_state_to_dataframe(state: dict[str, dict[str, int]]) -> pd.DataFrame:
    rows = []

    for team_id, metrics in state.items():
        rows.append(
            {
                "team_id": team_id,
                "points": metrics["points"],
                "goal_difference": metrics["goal_difference"],
                "goals_for": metrics["goals_for"],
                "goals_against": metrics["goals_against"],
                "played": metrics["played"],
                "wins": metrics["wins"],
                "draws": metrics["draws"],
                "losses": metrics["losses"],
            }
        )

    return pd.DataFrame(rows)


def rank_state_with_tiebreakers(
    state: dict[str, dict[str, int]],
    match_rows: list[dict],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> list[str]:
    standings = standings_state_to_dataframe(state)

    ranked = apply_fifa_group_tiebreakers(
        standings=standings,
        match_rows=match_rows,
        conduct_scores=conduct_scores,
        ranking_fallback=ranking_fallback,
    )

    return [str(team_id) for team_id in ranked["team_id"].tolist()]


def rank_third_place_rows(
    third_place_rows: list[dict],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> list[dict]:
    table = pd.DataFrame(third_place_rows)

    ranked = rank_third_place_table(
        third_place_table=table,
        conduct_scores=conduct_scores,
        ranking_fallback=ranking_fallback,
    )

    return ranked.drop(columns=["rank"]).to_dict("records")


def rank_team_ids_fast(
    team_ids: list[str],
    state: dict[str, dict[str, int]],
    match_rows: list[dict],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> list[str]:
    """
    Fast pure-Python FIFA-style tiebreaker ranking for simulation hot paths.

    This avoids creating pandas DataFrames inside every simulation loop.
    """
    conduct_scores = conduct_scores or {}
    ranking_fallback = ranking_fallback or {}

    primary_sorted = sorted(
        team_ids,
        key=lambda team_id: (
            state[team_id]["points"],
            state[team_id]["goal_difference"],
            state[team_id]["goals_for"],
        ),
        reverse=True,
    )

    ranked: list[str] = []
    i = 0

    while i < len(primary_sorted):
        team_id = primary_sorted[i]
        primary_key = (
            state[team_id]["points"],
            state[team_id]["goal_difference"],
            state[team_id]["goals_for"],
        )

        tied_group = [team_id]
        i += 1

        while i < len(primary_sorted):
            next_team_id = primary_sorted[i]
            next_key = (
                state[next_team_id]["points"],
                state[next_team_id]["goal_difference"],
                state[next_team_id]["goals_for"],
            )

            if next_key != primary_key:
                break

            tied_group.append(next_team_id)
            i += 1

        if len(tied_group) == 1:
            ranked.extend(tied_group)
            continue

        h2h = head_to_head_table(tied_group, match_rows)

        tied_group = sorted(
            tied_group,
            key=lambda tied_team_id: (
                h2h[tied_team_id]["h2h_points"],
                h2h[tied_team_id]["h2h_goal_difference"],
                h2h[tied_team_id]["h2h_goals_for"],
                conduct_scores.get(tied_team_id, 0.0),
                ranking_fallback.get(tied_team_id, 0.0),
                # Use reverse sort for the numeric values, but keep team_id
                # deterministic by making it negative-sort safe below.
            ),
            reverse=True,
        )

        # If everything above is tied, make the final fallback stable and deterministic.
        # This matters only when conduct and ranking fallback are equal or missing.
        final_groups: dict[tuple, list[str]] = {}

        for tied_team_id in tied_group:
            key = (
                h2h[tied_team_id]["h2h_points"],
                h2h[tied_team_id]["h2h_goal_difference"],
                h2h[tied_team_id]["h2h_goals_for"],
                conduct_scores.get(tied_team_id, 0.0),
                ranking_fallback.get(tied_team_id, 0.0),
            )
            final_groups.setdefault(key, []).append(tied_team_id)

        for key in sorted(final_groups.keys(), reverse=True):
            ranked.extend(sorted(final_groups[key]))

    return ranked


# Override the pandas-backed helper with the fast implementation for hot paths.
def rank_state_with_tiebreakers(
    state: dict[str, dict[str, int]],
    match_rows: list[dict],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
) -> list[str]:
    return rank_team_ids_fast(
        team_ids=list(state.keys()),
        state=state,
        match_rows=match_rows,
        conduct_scores=conduct_scores,
        ranking_fallback=ranking_fallback,
    )
