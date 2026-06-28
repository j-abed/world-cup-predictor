#!/usr/bin/env python3
"""Compare model champion odds to market (seed CSV or live Odds API fetch)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import importlib.util

import pandas as pd

from src.market_comparison import build_market_comparison_payload, load_market_odds
from src.market_odds import MARKET_ODDS_PATH


def _load_update_market_odds_module():
    module_path = REPO_ROOT / "scripts" / "update_market_odds.py"
    spec = importlib.util.spec_from_file_location("update_market_odds", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {module_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare model vs market champion probabilities.",
    )
    parser.add_argument(
        "--app-state",
        default="frontend/public/data/app_state.json",
        help="Path to app_state.json for model probabilities.",
    )
    parser.add_argument(
        "--fetch-live",
        action="store_true",
        help="Fetch live odds via ODDS_API_KEY instead of data/market_odds.csv.",
    )
    parser.add_argument(
        "--devig",
        action="store_true",
        help="Renormalize market implied probs across quoted teams (remove overround).",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=12,
        help="Number of rows to print.",
    )
    return parser.parse_args()


def load_model_round(app_state_path: Path) -> pd.DataFrame:
    payload = json.loads(app_state_path.read_text(encoding="utf-8"))
    return pd.DataFrame(payload["odds"]["round"])


def load_market(*, fetch_live: bool) -> pd.DataFrame:
    api_key = os.environ.get("ODDS_API_KEY", "").strip()

    if fetch_live:
        if not api_key:
            raise SystemExit(
                "ODDS_API_KEY is required for --fetch-live. "
                "Get a key at https://the-odds-api.com/"
            )

    update_market_odds = _load_update_market_odds_module()
    rows, sport_used = update_market_odds.collect_outright_odds(api_key)
    return update_market_odds.build_dataframe(rows, source=f"the_odds_api:{sport_used}")

    return load_market_odds()


def apply_devig(market_odds: pd.DataFrame) -> pd.DataFrame:
    frame = market_odds.copy()
    total = frame["implied_prob"].sum()

    if total <= 0:
        return frame

    frame["implied_prob"] = frame["implied_prob"] / total
    return frame


def print_table(
    comparison: dict,
    *,
    market_label: str,
    top: int,
) -> None:
    summary = comparison.get("summary") or {}
    print(f"\nMarket source: {market_label}")
    print(f"Compared teams: {summary.get('compared_team_count', 0)}")
    print(
        f"Favorites — model: {summary.get('model_favorite_team')} | "
        f"market: {summary.get('market_favorite_team')} | "
        f"agree: {summary.get('favorites_agree')}"
    )
    print(f"Mean |delta|: {float(summary.get('mean_absolute_gap', 0)) * 100:.2f} pp")

    print(f"\n{'Team':<18} {'Model':>7} {'Market':>7} {'Delta':>8}")
    print("-" * 44)

    for row in comparison.get("teams", [])[:top]:
        print(
            f"{row['team']:<18} "
            f"{row['model_champion_prob'] * 100:6.1f}% "
            f"{row['market_implied_prob'] * 100:6.1f}% "
            f"{row['delta'] * 100:+7.1f}pp"
        )


def main() -> None:
    args = parse_args()
    app_state_path = Path(args.app_state)

    if not app_state_path.exists():
        raise SystemExit(f"Missing app state: {app_state_path}")

    round_probabilities = load_model_round(app_state_path)

    seed_market = load_market_odds()
    seed_comparison = build_market_comparison_payload(round_probabilities, seed_market)
    print_table(
        seed_comparison,
        market_label=f"seed CSV ({seed_market.iloc[0]['source'] if not seed_market.empty else 'empty'})",
        top=args.top,
    )

    live_market = load_market(fetch_live=args.fetch_live)
    market_label = str(live_market.iloc[0]["source"]) if not live_market.empty else "live"

    if args.devig and not live_market.empty:
        live_market = apply_devig(live_market)
        market_label += " (de-vigged)"

    live_comparison = build_market_comparison_payload(round_probabilities, live_market)
    print_table(live_comparison, market_label=market_label, top=args.top)


if __name__ == "__main__":
    main()
