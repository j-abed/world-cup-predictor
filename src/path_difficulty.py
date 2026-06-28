from __future__ import annotations

from typing import Any

import pandas as pd

from src.simulator import build_rating_lookup


def difficulty_label(score: float) -> str:
    if score >= 0.67:
        return "Hard"
    if score >= 0.34:
        return "Moderate"
    return "Easy"


def _normalize_rating(value: float, min_rating: float, max_rating: float) -> float:
    if max_rating <= min_rating:
        return 0.5

    return max(0.0, min(1.0, (value - min_rating) / (max_rating - min_rating)))


def _projected_winner(
    home_code: str,
    away_code: str,
    rating_lookup: dict[str, float],
) -> str:
    if home_code in {"TBD", ""} and away_code not in {"TBD", ""}:
        return away_code

    if away_code in {"TBD", ""} and home_code not in {"TBD", ""}:
        return home_code

    if home_code in {"TBD", ""} or away_code in {"TBD", ""}:
        return home_code if home_code not in {"TBD", ""} else away_code

    home_rating = rating_lookup.get(home_code, 0.0)
    away_rating = rating_lookup.get(away_code, 0.0)

    return home_code if home_rating >= away_rating else away_code


def _slot_codes(slot: pd.Series) -> tuple[str, str]:
    return str(slot["home_code"]), str(slot["away_code"])


def _find_team_slot(bracket: pd.DataFrame, team_code: str) -> pd.Series | None:
    matches = bracket[
        (bracket["home_code"] == team_code) | (bracket["away_code"] == team_code)
    ]

    if matches.empty:
        return None

    round_order = {
        "Round of 32": 1,
        "Round of 16": 2,
        "Quarterfinals": 3,
        "Semifinals": 4,
        "Final": 5,
    }

    matches = matches.copy()
    matches["round_order"] = matches["round"].map(round_order).fillna(99)
    matches = matches.sort_values("round_order")

    return matches.iloc[0]


def _opponent_in_slot(slot: pd.Series, team_code: str) -> str | None:
    home_code, away_code = _slot_codes(slot)

    if home_code == team_code:
        return away_code if away_code not in {"TBD", ""} else None

    if away_code == team_code:
        return home_code if home_code not in {"TBD", ""} else None

    return None


def _slot_by_match_id(bracket: pd.DataFrame) -> dict[int, pd.Series]:
    lookup: dict[int, pd.Series] = {}

    for _, slot in bracket.iterrows():
        lookup[int(slot["match_id"])] = slot

    return lookup


def _collect_opponent_ratings(
    bracket: pd.DataFrame,
    team_code: str,
    rating_lookup: dict[str, float],
) -> tuple[list[float], list[str]]:
    ratings: list[float] = []
    notes: list[str] = []

    slot = _find_team_slot(bracket, team_code)

    if slot is None:
        return ratings, notes

    opponent_code = _opponent_in_slot(slot, team_code)

    if opponent_code and opponent_code in rating_lookup:
        ratings.append(rating_lookup[opponent_code])
        notes.append(f"{slot['round']} vs {opponent_code}")

    slots_by_match = _slot_by_match_id(bracket)
    next_match_id = slot.get("winner_advances_to")

    while next_match_id not in (None, ""):
        try:
            next_id = int(float(next_match_id))
        except (TypeError, ValueError):
            break

        next_slot = slots_by_match.get(next_id)

        if next_slot is None:
            break

        home_code, away_code = _slot_codes(next_slot)
        projected_home = _projected_winner(home_code, away_code, rating_lookup)
        projected_away = (
            away_code
            if projected_home == home_code
            else home_code
        )

        if team_code not in {projected_home, projected_away}:
            break

        opponent_code = (
            projected_away if team_code == projected_home else projected_home
        )

        if opponent_code in rating_lookup:
            ratings.append(rating_lookup[opponent_code])
            notes.append(f"{next_slot['round']} vs {opponent_code}")

        next_match_id = next_slot.get("winner_advances_to")

    return ratings, notes


def build_path_difficulty_payload(
    bracket: pd.DataFrame,
    round_probabilities: pd.DataFrame,
    ratings: pd.DataFrame,
    *,
    top_n: int | None = None,
) -> list[dict[str, Any]]:
    rating_lookup = build_rating_lookup(ratings)
    rating_values = list(rating_lookup.values())

    if not rating_values:
        return []

    min_rating = min(rating_values)
    max_rating = max(rating_values)

    ranked = round_probabilities.sort_values(
        "champion_prob",
        ascending=False,
    )

    if top_n is not None:
        ranked = ranked.head(top_n)

    payload: list[dict[str, Any]] = []

    for rank, (_, team) in enumerate(ranked.iterrows(), start=1):
        code = str(team["code"])
        opponent_ratings, notes = _collect_opponent_ratings(
            bracket=bracket,
            team_code=code,
            rating_lookup=rating_lookup,
        )

        if opponent_ratings:
            avg_opponent_rating = sum(opponent_ratings) / len(opponent_ratings)
            score = _normalize_rating(avg_opponent_rating, min_rating, max_rating)
        else:
            avg_opponent_rating = 0.0
            score = 0.5

        payload.append(
            {
                "code": code,
                "team": str(team["team"]),
                "rank": rank,
                "score": round(score, 4),
                "label": difficulty_label(score),
                "avg_opponent_rating": round(avg_opponent_rating, 2),
                "notes": "; ".join(notes) if notes else "Projected path unavailable",
            }
        )

    return payload
