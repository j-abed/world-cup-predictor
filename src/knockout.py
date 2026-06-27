from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

import numpy as np
import pandas as pd

from src.bracket import build_third_place_assignment, load_third_place_permutations
from src.simulator import (
    build_rating_lookup,
    prepare_groups,
    simulate_all_groups_once,
    simulate_score,
)
from src.tournament import select_best_third_place_teams
from src.tiebreakers import load_conduct_scores, load_ranking_fallback


ROUND_COLUMNS = {
    "r32": "r32_count",
    "r16": "r16_count",
    "qf": "qf_count",
    "sf": "sf_count",
    "final": "final_count",
    "champion": "champion_count",
}


def group_results_to_projected_qualifiers(
    teams: pd.DataFrame,
    group_results: dict[str, list[dict]],
    conduct_scores: dict[str, float] | None = None,
    ranking_fallback: dict[str, float] | None = None,
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

    best_thirds = select_best_third_place_teams(
        group_results,
        conduct_scores=conduct_scores,
        ranking_fallback=ranking_fallback,
    )

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


# Extra-time scoring intensity relative to regulation (single 15-minute period proxy).
EXTRA_TIME_GOAL_FACTOR = 0.35

# Elo divisor for knockout advancement after ET / in penalty shootouts.
KNOCKOUT_RATING_ELO_DIVISOR = 400.0


def rating_knockout_advance_probability(
    team_a: str,
    team_b: str,
    rating_lookup: dict[str, float],
) -> float:
    rating_a = rating_lookup[team_a]
    rating_b = rating_lookup[team_b]
    return 1 / (
        1 + 10 ** ((rating_b - rating_a) / KNOCKOUT_RATING_ELO_DIVISOR)
    )


def simulate_penalty_shootout(
    team_a: str,
    team_b: str,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> str:
    """
    Penalty shootout resolution using rating-based win probability.

    Individual kicks are not modeled; the stronger side is more likely to
    advance after a drawn extra time.
    """
    probability_a = rating_knockout_advance_probability(
        team_a, team_b, rating_lookup
    )
    return team_a if rng.random() < probability_a else team_b


def advance_knockout_match(
    team_a: str,
    team_b: str,
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
) -> str:
    """
    Simulate a knockout match winner.

    1. Regulation Poisson score (same model as group stage)
    2. If tied, extra time with reduced goal rates
    3. If still tied, penalty shootout
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

    et_a, et_b = simulate_score(
        home_team=team_a,
        away_team=team_b,
        rating_lookup=rating_lookup,
        rng=rng,
        goal_factor=EXTRA_TIME_GOAL_FACTOR,
    )

    score_a += et_a
    score_b += et_b

    if score_a > score_b:
        return team_a

    if score_b > score_a:
        return team_b

    return simulate_penalty_shootout(
        team_a=team_a,
        team_b=team_b,
        rating_lookup=rating_lookup,
        rng=rng,
    )


@dataclass(frozen=True)
class CompiledSource:
    source_type: str
    value: str | int
    allowed_groups: tuple[str, ...] = ()


@dataclass(frozen=True)
class CompiledKnockoutMatch:
    match_id: int
    home_source: CompiledSource
    away_source: CompiledSource
    stage_key: str


def load_knockout_bracket(path: str = "data/bracket_slots.csv") -> pd.DataFrame:
    bracket = pd.read_csv(path)
    bracket["match_id"] = bracket["match_id"].astype(int)

    if "winner_advances_to" in bracket.columns:
        bracket["winner_advances_to"] = pd.to_numeric(
            bracket["winner_advances_to"],
            errors="coerce",
        ).astype("Int64")

    return bracket.sort_values("match_id").reset_index(drop=True)


def compile_source(source: str) -> CompiledSource:
    source = str(source)
    winner_prefix = "Winner Match "
    third_prefix = "3rd Group "

    if source.startswith(winner_prefix):
        return CompiledSource(
            source_type="winner",
            value=int(source.removeprefix(winner_prefix)),
        )

    if source.startswith(third_prefix) and "/" in source:
        allowed_groups = tuple(source.removeprefix(third_prefix).split("/"))

        return CompiledSource(
            source_type="third_placeholder",
            value=source,
            allowed_groups=allowed_groups,
        )

    return CompiledSource(
        source_type="qualifier",
        value=source,
    )


def stage_key_for_match(match_id: int) -> str:
    if 73 <= match_id <= 88:
        return "r16"
    if 89 <= match_id <= 96:
        return "qf"
    if 97 <= match_id <= 100:
        return "sf"
    if 101 <= match_id <= 102:
        return "final"
    if match_id == 103:
        return "champion"

    raise ValueError(f"Unknown knockout match_id: {match_id}")


def compile_knockout_bracket(
    bracket_slots: pd.DataFrame,
) -> list[CompiledKnockoutMatch]:
    compiled_matches = []

    for _, slot in bracket_slots.sort_values("match_id").iterrows():
        match_id = int(slot["match_id"])

        compiled_matches.append(
            CompiledKnockoutMatch(
                match_id=match_id,
                home_source=compile_source(str(slot["home_source"])),
                away_source=compile_source(str(slot["away_source"])),
                stage_key=stage_key_for_match(match_id),
            )
        )

    return compiled_matches


def build_fast_qualifier_maps(
    projected_qualifiers: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    third_place_assignment_cache: dict[tuple[str, ...], dict[str, dict]],
    third_place_permutations: pd.DataFrame,
) -> tuple[dict[str, str], dict[str, str]]:
    source_to_team_id = {}

    for _, row in projected_qualifiers.iterrows():
        source = str(row["source"])
        team_id = str(row["team_id"])
        source_to_team_id[source] = team_id

    third_place_groups = tuple(
        sorted(
            str(row["group"])
            for _, row in projected_qualifiers[
                projected_qualifiers["qualifying_path"] == "Best third-place"
            ].iterrows()
        )
    )

    if third_place_groups not in third_place_assignment_cache:
        third_place_assignment_cache[third_place_groups] = build_third_place_assignment(
            bracket_slots=bracket_slots,
            projected_qualifiers=projected_qualifiers,
            permutations=third_place_permutations,
        )

    third_place_assignment = third_place_assignment_cache[third_place_groups]

    third_placeholder_to_team_id = {
        placeholder: str(team["team_id"])
        for placeholder, team in third_place_assignment.items()
    }

    return source_to_team_id, third_placeholder_to_team_id


def resolve_compiled_source(
    source: CompiledSource,
    winners_by_match: dict[int, str],
    source_to_team_id: dict[str, str],
    third_placeholder_to_team_id: dict[str, str],
) -> str:
    if source.source_type == "winner":
        match_id = int(source.value)

        if match_id not in winners_by_match:
            raise RuntimeError(f"Winner for Match {match_id} has not been simulated yet.")

        return winners_by_match[match_id]

    if source.source_type == "qualifier":
        source_name = str(source.value)

        if source_name not in source_to_team_id:
            raise RuntimeError(f"Could not resolve bracket source: {source_name}")

        return source_to_team_id[source_name]

    if source.source_type == "third_placeholder":
        source_name = str(source.value)

        if source_name not in third_placeholder_to_team_id:
            raise RuntimeError(f"Could not resolve third-place bracket source: {source_name}")

        return third_placeholder_to_team_id[source_name]

    raise ValueError(f"Unknown compiled source type: {source.source_type}")


def simulate_knockout_bracket_once(
    projected_qualifiers: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    compiled_bracket: list[CompiledKnockoutMatch],
    rating_lookup: dict[str, float],
    rng: np.random.Generator,
    third_place_assignment_cache: dict[tuple[str, ...], dict[str, dict]],
    third_place_permutations: pd.DataFrame,
) -> dict[str, set[str] | str]:
    source_to_team_id, third_placeholder_to_team_id = build_fast_qualifier_maps(
        projected_qualifiers=projected_qualifiers,
        bracket_slots=bracket_slots,
        third_place_assignment_cache=third_place_assignment_cache,
        third_place_permutations=third_place_permutations,
    )

    winners_by_match: dict[int, str] = {}

    r32_teams = set(projected_qualifiers["team_id"])
    r16_teams: set[str] = set()
    qf_teams: set[str] = set()
    sf_teams: set[str] = set()
    final_teams: set[str] = set()
    champion: str | None = None

    for match in compiled_bracket:
        home_team = resolve_compiled_source(
            source=match.home_source,
            winners_by_match=winners_by_match,
            source_to_team_id=source_to_team_id,
            third_placeholder_to_team_id=third_placeholder_to_team_id,
        )

        away_team = resolve_compiled_source(
            source=match.away_source,
            winners_by_match=winners_by_match,
            source_to_team_id=source_to_team_id,
            third_placeholder_to_team_id=third_placeholder_to_team_id,
        )

        winner = advance_knockout_match(
            team_a=home_team,
            team_b=away_team,
            rating_lookup=rating_lookup,
            rng=rng,
        )

        winners_by_match[match.match_id] = winner

        if match.stage_key == "r16":
            r16_teams.add(winner)
        elif match.stage_key == "qf":
            qf_teams.add(winner)
        elif match.stage_key == "sf":
            sf_teams.add(winner)
        elif match.stage_key == "final":
            final_teams.add(winner)
        elif match.stage_key == "champion":
            champion = winner

    if champion is None:
        raise RuntimeError("Final was not simulated; no champion was produced.")

    return {
        "r32": r32_teams,
        "r16": r16_teams,
        "qf": qf_teams,
        "sf": sf_teams,
        "final": final_teams,
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
    bracket_slots = load_knockout_bracket()
    compiled_bracket = compile_knockout_bracket(bracket_slots)
    third_place_permutations = load_third_place_permutations()
    third_place_assignment_cache: dict[tuple[str, ...], dict[str, dict]] = {}
    conduct_scores = load_conduct_scores()
    ranking_fallback = load_ranking_fallback()

    prepared_groups = prepare_groups(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )

    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for _ in range(simulations):
        group_results = simulate_all_groups_once(
            prepared_groups=prepared_groups,
            rating_lookup=rating_lookup,
            rng=rng,
            conduct_scores=conduct_scores,
            ranking_fallback=ranking_fallback,
        )

        qualifiers = group_results_to_projected_qualifiers(
            teams=teams,
            group_results=group_results,
            conduct_scores=conduct_scores,
            ranking_fallback=ranking_fallback,
        )

        knockout_result = simulate_knockout_bracket_once(
            projected_qualifiers=qualifiers,
            bracket_slots=bracket_slots,
            compiled_bracket=compiled_bracket,
            rating_lookup=rating_lookup,
            rng=rng,
            third_place_assignment_cache=third_place_assignment_cache,
            third_place_permutations=third_place_permutations,
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
