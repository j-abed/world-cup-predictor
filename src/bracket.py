from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


THIRD_PLACE_PERMUTATIONS_PATH = "data/third_place_permutations.csv"

PROJECTED_BRACKET_SEED = 42

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


def build_third_place_key(third_place_qualifiers: pd.DataFrame) -> str:
    groups = sorted(str(group) for group in third_place_qualifiers["group"].tolist())

    if len(groups) != 8:
        raise RuntimeError(
            f"Expected exactly 8 qualifying third-place groups, found {len(groups)}: {groups}"
        )

    return "-".join(groups)


def load_third_place_permutations(
    path: str = THIRD_PLACE_PERMUTATIONS_PATH,
) -> pd.DataFrame:
    permutations = pd.read_csv(path)

    required_columns = {
        "scenario_number",
        "qualifying_groups",
        "slot_74",
        "slot_77",
        "slot_79",
        "slot_80",
        "slot_81",
        "slot_82",
        "slot_85",
        "slot_87",
        "source_url",
    }

    missing = required_columns - set(permutations.columns)

    if missing:
        raise RuntimeError(
            f"Third-place permutation table is missing required columns: {sorted(missing)}"
        )

    if len(permutations) != 495:
        raise RuntimeError(
            f"Expected 495 third-place permutation rows, found {len(permutations)}"
        )

    if permutations["qualifying_groups"].duplicated().any():
        duplicates = permutations[
            permutations["qualifying_groups"].duplicated(keep=False)
        ]["qualifying_groups"].tolist()
        raise RuntimeError(
            f"Duplicate third-place qualifying group combinations found: {duplicates}"
        )

    return permutations


def get_official_third_place_row(
    third_place_qualifiers: pd.DataFrame,
    permutations: pd.DataFrame | None = None,
) -> pd.Series:
    if permutations is None:
        permutations = load_third_place_permutations()

    key = build_third_place_key(third_place_qualifiers)

    rows = permutations[permutations["qualifying_groups"] == key]

    if len(rows) != 1:
        raise RuntimeError(
            f"Expected one third-place permutation row for {key}, found {len(rows)}"
        )

    return rows.iloc[0]


def slot_id_to_permutation_column(slot_id: str) -> str:
    # slot_id examples: R32-74, R32-77, etc.
    match_id = str(slot_id).split("-")[-1]
    return f"slot_{match_id}"


def build_third_place_assignment(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    permutations: pd.DataFrame | None = None,
) -> dict[str, dict]:
    """
    Assign qualifying third-place teams to R32 slots using the official
    2026 World Cup third-place permutation table.

    The table is keyed by the eight third-place groups that qualify.
    """
    third_place_qualifiers = projected_qualifiers[
        projected_qualifiers["qualifying_path"] == "Best third-place"
    ].copy()

    official_row = get_official_third_place_row(
        third_place_qualifiers=third_place_qualifiers,
        permutations=permutations,
    )

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

    assignment: dict[str, dict] = {}

    round_of_32 = bracket_slots[bracket_slots["round"] == "Round of 32"].copy()

    for _, slot in round_of_32.iterrows():
        slot_id = str(slot["slot_id"])
        permutation_column = slot_id_to_permutation_column(slot_id)

        if permutation_column not in official_row.index:
            continue

        for source_column in ["home_source", "away_source"]:
            placeholder = str(slot[source_column])

            if not is_third_place_placeholder(placeholder):
                continue

            group = str(official_row[permutation_column])

            allowed_groups = parse_third_place_placeholder(placeholder)

            if group not in allowed_groups:
                raise RuntimeError(
                    f"Official third-place assignment mismatch for {slot_id}. "
                    f"Group {group} is not allowed by placeholder {placeholder}."
                )

            if group not in third_by_group:
                raise RuntimeError(
                    f"Official third-place assignment references non-qualifying group {group}."
                )

            assignment[placeholder] = third_by_group[group]

    if len(assignment) != 8:
        raise RuntimeError(
            f"Expected 8 official third-place assignments, found {len(assignment)}."
        )

    assigned_groups = sorted(str(team["group"]) for team in assignment.values())
    expected_groups = sorted(str(row["group"]) for _, row in third_place_qualifiers.iterrows())

    if assigned_groups != expected_groups:
        raise RuntimeError(
            "Official third-place assignment does not match qualifying groups. "
            f"Assigned {assigned_groups}; expected {expected_groups}."
        )

    return assignment


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


def build_team_id_lookup(teams: pd.DataFrame) -> dict[str, dict[str, str]]:
    return {
        str(row["team_id"]): {
            "team": str(row["name"]),
            "code": str(row["code"]),
        }
        for _, row in teams.iterrows()
    }


def _resolve_source_to_team_info(
    source: str,
    *,
    qualifier_lookup: dict[str, dict],
    third_place_assignment: dict[str, dict],
    winners_by_match: dict[int, str],
    team_lookup: dict[str, dict[str, str]],
) -> dict[str, str] | None:
    winner_prefix = "Winner Match "

    if source.startswith(winner_prefix):
        match_id = int(source.removeprefix(winner_prefix))
        team_id = winners_by_match.get(match_id)

        if team_id is None:
            return None

        return team_lookup.get(str(team_id))

    resolved = resolve_bracket_source(
        source=source,
        qualifier_lookup=qualifier_lookup,
        third_place_assignment=third_place_assignment,
    )

    if resolved is None:
        return None

    return {
        "team": str(resolved["team"]),
        "code": str(resolved["code"]),
    }


def apply_simulated_knockout_path(
    bracket: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    winners_by_match: dict[int, str],
    team_lookup: dict[str, dict[str, str]],
) -> pd.DataFrame:
    """Fill every bracket slot and attach the simulated winner for each match."""
    qualifier_lookup = build_qualifier_lookup(projected_qualifiers)
    third_place_assignment = build_third_place_assignment(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )

    output = bracket.copy()
    projected_winner_teams: list[str] = []
    projected_winner_codes: list[str] = []

    for idx, row in output.iterrows():
        home_info = _resolve_source_to_team_info(
            str(row["home_source"]),
            qualifier_lookup=qualifier_lookup,
            third_place_assignment=third_place_assignment,
            winners_by_match=winners_by_match,
            team_lookup=team_lookup,
        )
        away_info = _resolve_source_to_team_info(
            str(row["away_source"]),
            qualifier_lookup=qualifier_lookup,
            third_place_assignment=third_place_assignment,
            winners_by_match=winners_by_match,
            team_lookup=team_lookup,
        )

        if home_info:
            output.at[idx, "home_team"] = home_info["team"]
            output.at[idx, "home_code"] = home_info["code"]

        if away_info:
            output.at[idx, "away_team"] = away_info["team"]
            output.at[idx, "away_code"] = away_info["code"]

        match_id = int(row["match_id"])
        winner = team_lookup[str(winners_by_match[match_id])]
        projected_winner_teams.append(winner["team"])
        projected_winner_codes.append(winner["code"])

    output["projected_winner_team"] = projected_winner_teams
    output["projected_winner_code"] = projected_winner_codes

    return output


def build_projected_complete_bracket(
    *,
    teams: pd.DataFrame,
    ratings: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    seed: int = PROJECTED_BRACKET_SEED,
    simulations: int = 10_000,
    knockout_results_path: str = "data/knockout_results.csv",
) -> pd.DataFrame:
    """Build a full knockout tree using the modal winner per match.

    Completed knockout matches (from ``knockout_results_path``) are locked in
    with their actual winners; only future matches are simulated.
    """
    import numpy as np

    from src.knockout import (
        compile_knockout_bracket,
        load_knockout_results,
        simulate_most_likely_knockout_winners_by_match,
    )
    from src.simulator import build_rating_lookup

    bracket = build_projected_round_of_32(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )
    compiled_bracket = compile_knockout_bracket(bracket_slots)
    rating_lookup = build_rating_lookup(ratings)
    rng = np.random.default_rng(seed)
    third_place_permutations = load_third_place_permutations()
    completed_results = load_knockout_results(knockout_results_path)

    winners_by_match = simulate_most_likely_knockout_winners_by_match(
        projected_qualifiers=projected_qualifiers,
        bracket_slots=bracket_slots,
        compiled_bracket=compiled_bracket,
        rating_lookup=rating_lookup,
        rng=rng,
        third_place_assignment_cache={},
        third_place_permutations=third_place_permutations,
        simulations=simulations,
        completed_results=completed_results,
    )

    return apply_simulated_knockout_path(
        bracket=bracket,
        projected_qualifiers=projected_qualifiers,
        bracket_slots=bracket_slots,
        winners_by_match=winners_by_match,
        team_lookup=build_team_id_lookup(teams),
    )
