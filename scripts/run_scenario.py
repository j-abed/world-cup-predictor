from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pandas as pd

from src.scenario import ScenarioOverride, run_scenario, write_scenario_app_state
from src.scenario_report import format_scenario_report


def parse_override(raw: str) -> ScenarioOverride:
    parts = raw.split(":")

    if len(parts) != 3:
        raise argparse.ArgumentTypeError(
            "Override must look like MATCH_ID:HOME_SCORE:AWAY_SCORE "
            "(example: 66456904:3:0)"
        )

    match_id, home_score, away_score = parts

    return ScenarioOverride(
        match_id=int(match_id),
        home_score=int(home_score),
        away_score=int(away_score),
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a what-if scenario and export scenario_app_state.json."
    )
    parser.add_argument(
        "--override",
        action="append",
        type=parse_override,
        required=True,
        help="Hypothetical result as MATCH_ID:HOME:AWAY. Repeat for multiple matches.",
    )
    parser.add_argument(
        "--simulations",
        type=int,
        default=5_000,
        help="Monte Carlo runs for scenario odds. Default: 5000",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed. Default: 42",
    )
    parser.add_argument(
        "--output",
        default="outputs/web/scenario_app_state.json",
        help="Scenario JSON output path.",
    )
    parser.add_argument(
        "--copy-to-frontend",
        action="store_true",
        help="Also copy the scenario JSON into frontend/public/data/.",
    )
    parser.add_argument(
        "--baseline-metadata",
        help="Optional path to baseline app_state.json for baseline_generated_at metadata.",
    )
    return parser.parse_args()


def load_baseline_payload(path: str | None) -> dict | None:
    if path is None:
        baseline_path = Path("frontend/public/data/app_state.json")
        if not baseline_path.exists():
            return None
        path = str(baseline_path)

    baseline_file = Path(path)
    if not baseline_file.exists():
        return None

    return json.loads(baseline_file.read_text(encoding="utf-8"))


def main() -> None:
    args = parse_args()

    start = time.perf_counter()

    teams = pd.read_csv("data/teams.csv")
    fixtures = pd.read_csv("data/fixtures.csv")
    results = pd.read_csv("data/results.csv")
    ratings = pd.read_csv("data/ratings.csv")
    bracket_slots = pd.read_csv("data/bracket_slots.csv")

    baseline_payload = load_baseline_payload(args.baseline_metadata)
    baseline_generated_at = (
        baseline_payload.get("metadata", {}).get("generated_at")
        if baseline_payload is not None
        else None
    )

    payload = run_scenario(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        bracket_slots=bracket_slots,
        overrides=args.override,
        simulations=args.simulations,
        seed=args.seed,
        baseline_generated_at=baseline_generated_at,
    )

    write_scenario_app_state(payload, args.output)

    if args.copy_to_frontend:
        frontend_path = Path("frontend/public/data/scenario_app_state.json")
        frontend_path.parent.mkdir(parents=True, exist_ok=True)
        frontend_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    elapsed = time.perf_counter() - start

    print()
    print(format_scenario_report(payload, baseline_payload))
    print()
    print(f"Wrote {args.output}")
    if args.copy_to_frontend:
        print("Copied scenario JSON to frontend/public/data/scenario_app_state.json")
    print(f"Runtime: {elapsed:.2f} seconds")


if __name__ == "__main__":
    main()
