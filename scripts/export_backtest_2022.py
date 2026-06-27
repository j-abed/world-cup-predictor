from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.backtest_2022 import build_backtest_payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export the 2022 historical backtest JSON for the web app."
    )
    parser.add_argument(
        "--simulations",
        type=int,
        default=5_000,
        help="Monte Carlo runs for the pre-tournament replay. Default: 5000",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed. Default: 42",
    )
    parser.add_argument(
        "--output",
        default="outputs/web/backtest_2022.json",
        help="Output JSON path.",
    )
    parser.add_argument(
        "--copy-to-frontend",
        action="store_true",
        help="Also copy JSON into frontend/public/data/.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    start = time.perf_counter()

    payload = build_backtest_payload(
        simulations=args.simulations,
        seed=args.seed,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    if args.copy_to_frontend:
        frontend_path = Path("frontend/public/data/backtest_2022.json")
        frontend_path.parent.mkdir(parents=True, exist_ok=True)
        frontend_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"Copied backtest JSON to {frontend_path}")

    summary = payload["summary"]
    elapsed = time.perf_counter() - start

    print(f"Actual champion: {summary['actual_champion_team']}")
    print(
        "Model rank for champion: "
        f"#{summary['predicted_champion_rank']} "
        f"({summary['predicted_champion_probability'] * 100:.1f}%)"
    )
    print(f"Wrote {output_path}")
    print(f"Runtime: {elapsed:.2f} seconds")


if __name__ == "__main__":
    main()
