from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pathlib import Path

import pandas as pd

from src.market_odds import MARKET_ODDS_PATH


def load_market_odds(path: str = MARKET_ODDS_PATH) -> pd.DataFrame:
    if not Path(path).exists():
        return pd.DataFrame(
            columns=[
                "code",
                "team",
                "decimal_odds",
                "implied_prob",
                "source",
                "as_of",
            ]
        )

    return pd.read_csv(path)


def build_market_comparison_payload(
    round_probabilities: pd.DataFrame,
    market_odds: pd.DataFrame,
) -> dict[str, Any]:
    if market_odds.empty:
        return {
            "available": False,
            "source": None,
            "as_of": None,
            "methodology": (
                "Market odds are unavailable. Add data/market_odds.csv or run "
                "scripts/update_market_odds.py with ODDS_API_KEY set."
            ),
            "teams": [],
            "summary": None,
        }

    model_by_code = round_probabilities.set_index("code")
    rows: list[dict[str, Any]] = []

    for _, market_row in market_odds.iterrows():
        code = str(market_row["code"])

        if code not in model_by_code.index:
            continue

        model_row = model_by_code.loc[code]
        model_prob = float(model_row["champion_prob"])
        market_prob = float(market_row["implied_prob"])
        delta = model_prob - market_prob

        rows.append(
            {
                "code": code,
                "team": str(market_row["team"]),
                "model_champion_prob": round(model_prob, 6),
                "market_implied_prob": round(market_prob, 6),
                "delta": round(delta, 6),
                "decimal_odds": round(float(market_row["decimal_odds"]), 3),
            }
        )

    if not rows:
        return {
            "available": False,
            "source": str(market_odds.iloc[0].get("source", "")),
            "as_of": str(market_odds.iloc[0].get("as_of", "")),
            "methodology": "Market odds loaded but no teams matched the model field.",
            "teams": [],
            "summary": None,
        }

    rows.sort(key=lambda row: abs(row["delta"]), reverse=True)

    model_favorite = round_probabilities.sort_values(
        "champion_prob",
        ascending=False,
    ).iloc[0]
    market_favorite = market_odds.sort_values("implied_prob", ascending=False).iloc[0]

    mean_abs_gap = sum(abs(row["delta"]) for row in rows) / len(rows)

    source = str(market_odds.iloc[0]["source"])
    as_of = str(market_odds.iloc[0]["as_of"])

    return {
        "available": True,
        "source": source,
        "as_of": as_of,
        "methodology": (
            "Compares model championship probability to average implied probability "
            "from outright winner odds. Positive delta means the model is more bullish "
            "than the market."
        ),
        "teams": rows,
        "summary": {
            "model_favorite_code": str(model_favorite["code"]),
            "model_favorite_team": str(model_favorite["team"]),
            "market_favorite_code": str(market_favorite["code"]),
            "market_favorite_team": str(market_favorite["team"]),
            "mean_absolute_gap": round(mean_abs_gap, 6),
            "compared_team_count": len(rows),
            "favorites_agree": str(model_favorite["code"])
            == str(market_favorite["code"]),
        },
    }
