from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.ratings_update import update_ratings_from_results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Apply Elo-style rating updates for newly completed matches."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show rating deltas without writing data/ratings.csv.",
    )
    args = parser.parse_args()

    count, messages = update_ratings_from_results(dry_run=args.dry_run)

    for message in messages:
        print(message)

    print(f"Processed {count} pending match(es).")


if __name__ == "__main__":
    main()
