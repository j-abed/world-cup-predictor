from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.bracket import build_projected_round_of_32
from src.knockout import simulate_tournament_round_probabilities
from src.reporting import (
    calculate_all_group_standings,
    calculate_current_projected_qualifiers,
    calculate_current_third_place_table,
)
from src.simulator import simulate_all_group_finish_probabilities
from src.tournament import simulate_qualification_probabilities
from src.validation import validate_group_fixture_coverage
from src.web_exports import build_app_state_payload, write_json


@dataclass(frozen=True)
class ScenarioOverride:
    match_id: int
    home_score: int
    away_score: int

    def as_dict(self) -> dict[str, int]:
        return {
            "match_id": self.match_id,
            "home_score": self.home_score,
            "away_score": self.away_score,
        }


def apply_scenario_overrides(
    results: pd.DataFrame,
    overrides: list[ScenarioOverride],
) -> pd.DataFrame:
    if not overrides:
        return results.copy()

    output = results.copy()

    for override in overrides:
        output = output[output["match_id"] != override.match_id].copy()
        output = pd.concat(
            [
                output,
                pd.DataFrame(
                    [
                        {
                            "match_id": override.match_id,
                            "home_score": override.home_score,
                            "away_score": override.away_score,
                            "status": "Complete",
                        }
                    ]
                ),
            ],
            ignore_index=True,
        )

    return output.sort_values("match_id").reset_index(drop=True)


def describe_scenario(
    overrides: list[ScenarioOverride],
    fixtures: pd.DataFrame,
    teams: pd.DataFrame,
) -> str:
    team_names = {
        str(row["team_id"]): str(row["name"])
        for _, row in teams.iterrows()
    }

    labels: list[str] = []

    for override in overrides:
        fixture = fixtures[fixtures["match_id"] == override.match_id]

        if fixture.empty:
            labels.append(
                f"Match {override.match_id}: "
                f"{override.home_score}-{override.away_score}"
            )
            continue

        row = fixture.iloc[0]
        home = team_names.get(str(row["home_team"]), str(row["home_team"]))
        away = team_names.get(str(row["away_team"]), str(row["away_team"]))
        labels.append(
            f"{home} {override.home_score}-{override.away_score} {away}"
        )

    return "; ".join(labels)


def build_scenario_metadata(
    overrides: list[ScenarioOverride],
    fixtures: pd.DataFrame,
    teams: pd.DataFrame,
    *,
    baseline_generated_at: str | None = None,
    simulations: int,
) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "label": describe_scenario(overrides, fixtures, teams),
        "overrides": [override.as_dict() for override in overrides],
        "simulations": simulations,
    }

    if baseline_generated_at is not None:
        metadata["baseline_generated_at"] = baseline_generated_at

    return metadata


def generate_app_state(
    *,
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    simulations: int = 10_000,
    group_simulations: int | None = None,
    seed: int = 42,
    scenario: dict[str, Any] | None = None,
) -> dict[str, Any]:
    group_simulations = group_simulations or simulations

    coverage = validate_group_fixture_coverage(
        teams=teams,
        fixtures=fixtures,
    )

    incomplete_groups = coverage[~coverage["has_complete_fixture_set"]]

    if not incomplete_groups.empty:
        raise RuntimeError("Cannot generate app state with incomplete fixture coverage.")

    standings_by_group = calculate_all_group_standings(
        teams=teams,
        fixtures=fixtures,
        results=results,
    )

    third_place_table = calculate_current_third_place_table(standings_by_group)

    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
    )

    bracket = build_projected_round_of_32(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )

    group_finish_probabilities = simulate_all_group_finish_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=group_simulations,
        seed=seed,
    )

    tournament_probabilities = simulate_qualification_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=simulations,
        seed=seed,
    )

    round_probabilities = simulate_tournament_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=simulations,
        seed=seed,
    )

    return build_app_state_payload(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        coverage=coverage,
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
        projected_qualifiers=projected_qualifiers,
        bracket=bracket,
        group_finish_probabilities=group_finish_probabilities,
        tournament_probabilities=tournament_probabilities,
        round_probabilities=round_probabilities,
        group_simulations=group_simulations,
        tournament_simulations=simulations,
        round_simulations=simulations,
        scenario=scenario,
    )


def run_scenario(
    *,
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    bracket_slots: pd.DataFrame,
    overrides: list[ScenarioOverride],
    simulations: int = 5_000,
    group_simulations: int | None = None,
    seed: int = 42,
    baseline_generated_at: str | None = None,
) -> dict[str, Any]:
    scenario_results = apply_scenario_overrides(results, overrides)

    scenario_meta = build_scenario_metadata(
        overrides,
        fixtures,
        teams,
        baseline_generated_at=baseline_generated_at,
        simulations=simulations,
    )

    return generate_app_state(
        teams=teams,
        fixtures=fixtures,
        results=scenario_results,
        ratings=ratings,
        bracket_slots=bracket_slots,
        simulations=simulations,
        group_simulations=group_simulations,
        seed=seed,
        scenario=scenario_meta,
    )


def write_scenario_app_state(
    payload: dict[str, Any],
    output_path: str = "outputs/web/scenario_app_state.json",
) -> None:
    write_json(Path(output_path), payload)
