from __future__ import annotations

import pandas as pd


def build_qualifier_lookup(projected_qualifiers: pd.DataFrame) -> dict[str, dict]:
    lookup = {}

    for _, row in projected_qualifiers.iterrows():
        source = row["source"]

        lookup[source] = {
            "team_id": row["team_id"],
            "team": row["team"],
            "code": row["code"],
            "source": source,
        }

    return lookup


def resolve_third_place_source(
    source: str,
    projected_qualifiers: pd.DataFrame,
) -> dict | None:
    """
    Resolves placeholder sources such as:
    3rd Group A/B/C/D/F

    MVP behavior:
    choose the first currently qualified third-place team whose group is in the allowed set.

    Later:
    replace this with official FIFA third-place permutation mapping.
    """
    prefix = "3rd Group "

    if not source.startswith(prefix):
        return None

    allowed_groups = source.removeprefix(prefix).split("/")

    third_place_qualifiers = projected_qualifiers[
        projected_qualifiers["qualifying_path"] == "Best third-place"
    ].copy()

    third_place_qualifiers = third_place_qualifiers[
        third_place_qualifiers["group"].isin(allowed_groups)
    ].copy()

    if third_place_qualifiers.empty:
        return None

    selected = third_place_qualifiers.iloc[0]

    return {
        "team_id": selected["team_id"],
        "team": selected["team"],
        "code": selected["code"],
        "source": f"3rd Group {selected['group']}",
    }


def resolve_bracket_source(
    source: str,
    qualifier_lookup: dict[str, dict],
    projected_qualifiers: pd.DataFrame,
) -> dict | None:
    if source in qualifier_lookup:
        return qualifier_lookup[source]

    if source.startswith("3rd Group "):
        return resolve_third_place_source(
            source=source,
            projected_qualifiers=projected_qualifiers,
        )

    return None


def build_projected_round_of_32(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
) -> pd.DataFrame:
    qualifier_lookup = build_qualifier_lookup(projected_qualifiers)

    rows = []

    for _, slot in bracket_slots.iterrows():
        home = resolve_bracket_source(
            source=slot["home_source"],
            qualifier_lookup=qualifier_lookup,
            projected_qualifiers=projected_qualifiers,
        )

        away = resolve_bracket_source(
            source=slot["away_source"],
            qualifier_lookup=qualifier_lookup,
            projected_qualifiers=projected_qualifiers,
        )

        rows.append(
            {
                "slot_id": slot["slot_id"],
                "round": slot["round"],
                "match_id": slot["match_id"],
                "home_source": slot["home_source"],
                "home_team": home["team"] if home else "TBD",
                "home_code": home["code"] if home else "TBD",
                "away_source": slot["away_source"],
                "away_team": away["team"] if away else "TBD",
                "away_code": away["code"] if away else "TBD",
                "winner_advances_to": slot["winner_advances_to"],
            }
        )

    return pd.DataFrame(rows)
