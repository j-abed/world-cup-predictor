from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.tiebreakers import build_match_rows

RATINGS_PATH = Path("data/ratings.csv")
APPLIED_MATCHES_PATH = Path("data/ratings_applied_matches.csv")
FIXTURES_PATH = Path("data/fixtures.csv")
RESULTS_PATH = Path("data/results.csv")

# Elo-style update on FIFA-scale rating points (similar numeric range to Elo).
RATINGS_ELO_DIVISOR = 400.0
WORLD_CUP_K_FACTOR = 40.0


def expected_match_score(rating_a: float, rating_b: float) -> float:
    return 1 / (1 + 10 ** ((rating_b - rating_a) / RATINGS_ELO_DIVISOR))


def actual_match_scores(home_score: int, away_score: int) -> tuple[float, float]:
    if home_score > away_score:
        return 1.0, 0.0
    if away_score > home_score:
        return 0.0, 1.0
    return 0.5, 0.5


def apply_single_match_update(
    ratings: dict[str, float],
    home_team: str,
    away_team: str,
    home_score: int,
    away_score: int,
    *,
    k_factor: float = WORLD_CUP_K_FACTOR,
) -> None:
    home_rating = ratings[home_team]
    away_rating = ratings[away_team]

    expected_home = expected_match_score(home_rating, away_rating)
    expected_away = expected_match_score(away_rating, home_rating)
    actual_home, actual_away = actual_match_scores(home_score, away_score)

    ratings[home_team] = home_rating + k_factor * (actual_home - expected_home)
    ratings[away_team] = away_rating + k_factor * (actual_away - expected_away)


def load_applied_match_ids(path: Path = APPLIED_MATCHES_PATH) -> set[int]:
    if not path.exists() or path.stat().st_size == 0:
        return set()

    applied = pd.read_csv(path)

    if applied.empty or "match_id" not in applied.columns:
        return set()

    return {int(match_id) for match_id in applied["match_id"]}


def save_applied_match_ids(
    match_ids: set[int],
    path: Path = APPLIED_MATCHES_PATH,
) -> None:
    if match_ids:
        rows = [{"match_id": match_id} for match_id in sorted(match_ids)]
        pd.DataFrame(rows).to_csv(path, index=False)
    else:
        path.write_text("match_id\n", encoding="utf-8")


def pending_completed_matches(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    applied_match_ids: set[int],
) -> pd.DataFrame:
    completed = results[results["status"] == "Complete"].copy()
    matches = completed.merge(fixtures, on="match_id", how="inner")

    pending = matches[~matches["match_id"].isin(applied_match_ids)].copy()
    return pending.sort_values("match_id").reset_index(drop=True)


def ensure_ratings_bootstrap(
    results: pd.DataFrame,
    applied_matches_path: Path = APPLIED_MATCHES_PATH,
) -> str | None:
    if applied_matches_path.exists():
        return None

    completed_ids = {
        int(match_id)
        for match_id in results.loc[results["status"] == "Complete", "match_id"]
    }
    save_applied_match_ids(completed_ids, applied_matches_path)
    return (
        f"Bootstrapped {applied_matches_path} with {len(completed_ids)} existing "
        "completed matches (no retroactive rating changes)."
    )


def update_ratings_from_results(
    *,
    ratings_path: Path = RATINGS_PATH,
    fixtures_path: Path = FIXTURES_PATH,
    results_path: Path = RESULTS_PATH,
    applied_matches_path: Path = APPLIED_MATCHES_PATH,
    k_factor: float = WORLD_CUP_K_FACTOR,
    dry_run: bool = False,
) -> tuple[int, list[str]]:
    ratings = pd.read_csv(ratings_path)
    fixtures = pd.read_csv(fixtures_path)
    results = pd.read_csv(results_path)

    messages: list[str] = []

    bootstrap_message = ensure_ratings_bootstrap(results, applied_matches_path)
    if bootstrap_message:
        messages.append(bootstrap_message)

    rating_lookup = {
        str(row["team_id"]): float(row["rating"])
        for _, row in ratings.iterrows()
    }

    applied_match_ids = load_applied_match_ids(applied_matches_path)
    pending = pending_completed_matches(fixtures, results, applied_match_ids)

    if pending.empty:
        messages.append("No new completed matches to apply to ratings.")
        return 0, messages

    for _, match in pending.iterrows():
        match_id = int(match["match_id"])
        home_team = str(match["home_team"])
        away_team = str(match["away_team"])
        home_score = int(match["home_score"])
        away_score = int(match["away_score"])

        if home_team not in rating_lookup or away_team not in rating_lookup:
            messages.append(
                f"Skipping match_id {match_id}: missing rating for "
                f"{home_team} or {away_team}"
            )
            continue

        before_home = rating_lookup[home_team]
        before_away = rating_lookup[away_team]

        apply_single_match_update(
            rating_lookup,
            home_team,
            away_team,
            home_score,
            away_score,
            k_factor=k_factor,
        )

        applied_match_ids.add(match_id)

        messages.append(
            f"Applied match_id {match_id}: {home_team} {home_score}-{away_score} "
            f"{away_team} | {home_team} {before_home:.2f} -> "
            f"{rating_lookup[home_team]:.2f}, {away_team} {before_away:.2f} -> "
            f"{rating_lookup[away_team]:.2f}"
        )

    if dry_run:
        messages.append("Dry run only. ratings.csv not written.")
        return len(pending), messages

    ratings["rating"] = ratings["team_id"].map(
        lambda team_id: rating_lookup[str(team_id)]
    )
    ratings["source"] = "post_match_elo_updates"
    if "rating_type" not in ratings.columns:
        ratings["rating_type"] = "fifa_world_ranking_points"

    ratings.to_csv(ratings_path, index=False)
    save_applied_match_ids(applied_match_ids, applied_matches_path)

    messages.append(f"Wrote {ratings_path}")
    messages.append(f"Wrote {applied_matches_path}")

    return len(pending), messages


def list_group_match_rows(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
) -> list[dict]:
    group_fixtures = fixtures[fixtures["stage"] == "Group"]
    return build_match_rows(group_fixtures, results)
