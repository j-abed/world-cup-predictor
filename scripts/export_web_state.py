from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pandas as pd

from src.bracket import build_projected_complete_bracket
from src.knockout import simulate_tournament_round_probabilities
from src.reporting import (
    calculate_all_group_standings,
    calculate_current_projected_qualifiers,
    calculate_current_third_place_table,
)
from src.simulator import simulate_all_group_finish_probabilities
from src.tournament import simulate_qualification_probabilities
from src.validation import validate_group_fixture_coverage
from src.web_exports import export_web_state


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export web-app-ready World Cup predictor JSON files."
    )
    parser.add_argument(
        "--output-dir",
        default="outputs/web",
        help="Directory for JSON output files. Default: outputs/web",
    )
    parser.add_argument(
        "--simulations",
        type=int,
        default=10_000,
        help="Simulation count for tournament and round odds. Default: 10000",
    )
    parser.add_argument(
        "--group-simulations",
        type=int,
        default=10_000,
        help="Simulation count per group for finish odds. Default: 10000",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed. Default: 42",
    )
    parser.add_argument(
        "--baseline-path",
        default="frontend/public/data/app_state.json",
        help=(
            "Previous app_state.json for movement deltas. "
            "Default: frontend/public/data/app_state.json if present."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    start = time.perf_counter()

    teams = pd.read_csv("data/teams.csv")
    fixtures = pd.read_csv("data/fixtures.csv")
    results = pd.read_csv("data/results.csv")
    ratings = pd.read_csv("data/ratings.csv")
    bracket_slots = pd.read_csv("data/bracket_slots.csv")

    coverage = validate_group_fixture_coverage(
        teams=teams,
        fixtures=fixtures,
    )

    incomplete_groups = coverage[~coverage["has_complete_fixture_set"]]

    if not incomplete_groups.empty:
        raise SystemExit(
            "Cannot export web state because fixture coverage is incomplete."
        )

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

    bracket = build_projected_complete_bracket(
        teams=teams,
        ratings=ratings,
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
        seed=args.seed,
        simulations=args.simulations,
    )

    group_finish_probabilities = simulate_all_group_finish_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=args.group_simulations,
        seed=args.seed,
    )

    tournament_probabilities = simulate_qualification_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=args.simulations,
        seed=args.seed,
    )

    round_probabilities = simulate_tournament_round_probabilities(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        simulations=args.simulations,
        seed=args.seed,
    )

    baseline_path = Path(args.baseline_path)
    baseline_app_state_path = baseline_path if baseline_path.exists() else None

    outputs = export_web_state(
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
        output_dir=args.output_dir,
        group_simulations=args.group_simulations,
        tournament_simulations=args.simulations,
        round_simulations=args.simulations,
        baseline_app_state_path=baseline_app_state_path,
        projected_bracket_simulations=args.simulations,
    )

    elapsed = time.perf_counter() - start

    print("Exported web app state:")
    for name, path in outputs.items():
        print(f"- {name}: {path}")

    print(f"Runtime: {elapsed:.2f} seconds")


if __name__ == "__main__":
    main()
