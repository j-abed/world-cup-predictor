from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


FIXTURES_PATH = Path("data/fixtures.csv")
RESULTS_PATH = Path("data/results.csv")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add or update a completed World Cup match result."
    )
    parser.add_argument("match_id", type=int)
    parser.add_argument("home_score", type=int)
    parser.add_argument("away_score", type=int)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing result for the same match_id.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.home_score < 0 or args.away_score < 0:
        raise SystemExit("Scores must be non-negative integers.")

    fixtures = pd.read_csv(FIXTURES_PATH)
    results = pd.read_csv(RESULTS_PATH)

    fixture_matches = fixtures[fixtures["match_id"] == args.match_id]

    if fixture_matches.empty:
        raise SystemExit(f"Match ID {args.match_id} was not found in {FIXTURES_PATH}.")

    fixture = fixture_matches.iloc[0]

    if fixture["stage"] != "Group":
        raise SystemExit(
            f"Match ID {args.match_id} is not a group-stage fixture. "
            f"Stage: {fixture['stage']}"
        )

    existing = results[results["match_id"] == args.match_id]

    new_row = {
        "match_id": args.match_id,
        "home_score": args.home_score,
        "away_score": args.away_score,
        "status": "Complete",
    }

    if not existing.empty and not args.force:
        current = existing.iloc[0]
        raise SystemExit(
            f"Result already exists for match_id {args.match_id}: "
            f"{int(current['home_score'])}-{int(current['away_score'])}. "
            "Use --force to overwrite it."
        )

    if not existing.empty:
        results = results[results["match_id"] != args.match_id].copy()

    results = pd.concat([results, pd.DataFrame([new_row])], ignore_index=True)
    results = results.sort_values("match_id").reset_index(drop=True)
    results.to_csv(RESULTS_PATH, index=False)

    print(
        f"Saved result: {fixture['home_team']} {args.home_score} - "
        f"{args.away_score} {fixture['away_team']} "
        f"(match_id {args.match_id})"
    )


if __name__ == "__main__":
    main()
