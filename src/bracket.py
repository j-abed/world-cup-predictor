from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class ThirdPlaceAssignment:
    placeholder_source: str
    group: str
    team_id: str
    team: str
    code: str
    resolved_source: str


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


def parse_third_place_placeholder(source: str) -> tuple[str, ...]:
    prefix = "3rd Group "

    if not str(source).startswith(prefix):
        return ()

    return tuple(str(source).removeprefix(prefix).split("/"))


def is_third_place_placeholder(source: str) -> bool:
    return bool(parse_third_place_placeholder(source)) and "/" in str(source)


def get_third_place_placeholders(bracket_slots: pd.DataFrame) -> list[str]:
    placeholders = []

    round_of_32 = bracket_slots[bracket_slots["round"] == "Round of 32"].copy()

    for _, slot in round_of_32.iterrows():
        for column in ["home_source", "away_source"]:
            source = str(slot[column])

            if is_third_place_placeholder(source):
                placeholders.append(source)

    return placeholders


def build_third_place_assignment(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
) -> dict[str, dict]:
    """
    Assign each qualifying third-place team to exactly one compatible R32 slot.

    This is a valid non-duplicating assignment, not yet the official FIFA
    495-case permutation table.

    It uses deterministic backtracking instead of greedy assignment because
    some groups are valid for fewer placeholder slots than others.
    """
    placeholders = get_third_place_placeholders(bracket_slots)

    third_place_qualifiers = projected_qualifiers[
        projected_qualifiers["qualifying_path"] == "Best third-place"
    ].copy()

    third_place_qualifiers = third_place_qualifiers.sort_values(
        by=["group", "points", "goal_difference", "goals_for"],
        ascending=[True, False, False, False],
    ).reset_index(drop=True)

    third_by_group = {
        str(row["group"]): {
            "team_id": row["team_id"],
            "team": row["team"],
            "code": row["code"],
            "source": f"3rd Group {row['group']}",
            "group": row["group"],
        }
        for _, row in third_place_qualifiers.iterrows()
    }

    qualifying_groups = set(third_by_group)

    placeholder_options = {
        placeholder: [
            group
            for group in parse_third_place_placeholder(placeholder)
            if group in qualifying_groups
        ]
        for placeholder in placeholders
    }

    impossible_placeholders = [
        placeholder
        for placeholder, options in placeholder_options.items()
        if not options
    ]

    if impossible_placeholders:
        raise RuntimeError(
            "Some third-place placeholders cannot be resolved by the current "
            f"qualifying groups {sorted(qualifying_groups)}. "
            f"Impossible placeholders: {impossible_placeholders}"
        )

    # Search most constrained placeholders first. Tie-break by source text so the
    # assignment is reproducible.
    ordered_placeholders = sorted(
        placeholders,
        key=lambda placeholder: (len(placeholder_options[placeholder]), placeholder),
    )

    assignment_by_placeholder: dict[str, str] = {}
    assigned_groups: set[str] = set()

    def backtrack(index: int) -> bool:
        if index == len(ordered_placeholders):
            return assigned_groups == qualifying_groups

        placeholder = ordered_placeholders[index]

        # Try groups in alphabetical order for deterministic output.
        for group in sorted(placeholder_options[placeholder]):
            if group in assigned_groups:
                continue

            assignment_by_placeholder[placeholder] = group
            assigned_groups.add(group)

            if backtrack(index + 1):
                return True

            assigned_groups.remove(group)
            del assignment_by_placeholder[placeholder]

        return False

    if not backtrack(0):
        raise RuntimeError(
            "Could not assign each third-place qualifier exactly once. "
            f"Qualifying groups: {sorted(qualifying_groups)}. "
            f"Placeholder options: {placeholder_options}"
        )

    return {
        placeholder: third_by_group[group]
        for placeholder, group in assignment_by_placeholder.items()
    }


def resolve_bracket_source(
    source: str,
    qualifier_lookup: dict[str, dict],
    third_place_assignment: dict[str, dict] | None = None,
) -> dict | None:
    if source in qualifier_lookup:
        return qualifier_lookup[source]

    if third_place_assignment and source in third_place_assignment:
        return third_place_assignment[source]

    return None


def build_projected_round_of_32(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
) -> pd.DataFrame:
    qualifier_lookup = build_qualifier_lookup(projected_qualifiers)
    third_place_assignment = build_third_place_assignment(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )

    rows = []

    for _, slot in bracket_slots.iterrows():
        home = resolve_bracket_source(
            source=str(slot["home_source"]),
            qualifier_lookup=qualifier_lookup,
            third_place_assignment=third_place_assignment,
        )

        away = resolve_bracket_source(
            source=str(slot["away_source"]),
            qualifier_lookup=qualifier_lookup,
            third_place_assignment=third_place_assignment,
        )

        winner_advances_to = slot["winner_advances_to"]

        if pd.isna(winner_advances_to):
            winner_advances_to_display = ""
        else:
            winner_advances_to_display = str(int(float(winner_advances_to)))

        rows.append(
            {
                "slot_id": slot["slot_id"],
                "round": slot["round"],
                "match_id": int(slot["match_id"]),
                "home_source": slot["home_source"],
                "home_team": home["team"] if home else "TBD",
                "home_code": home["code"] if home else "TBD",
                "away_source": slot["away_source"],
                "away_team": away["team"] if away else "TBD",
                "away_code": away["code"] if away else "TBD",
                "winner_advances_to": winner_advances_to_display,
            }
        )

    return pd.DataFrame(rows)
