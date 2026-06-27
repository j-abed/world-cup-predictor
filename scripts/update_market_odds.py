from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.market_odds import MARKET_ODDS_PATH, SPORT_KEYS, normalize_team_code

ODDS_API_BASE = "https://api.the-odds-api.com/v4"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update outright winner market odds for model comparison."
    )
    parser.add_argument(
        "--output",
        default=MARKET_ODDS_PATH,
        help="Output CSV path. Default: data/market_odds.csv",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and print summary without writing CSV.",
    )
    return parser.parse_args()


def fetch_json(url: str) -> dict | list:
    request = Request(
        url,
        headers={
            "User-Agent": "world-cup-predictor/0.1",
            "Accept": "application/json",
        },
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def collect_outright_odds(api_key: str) -> tuple[list[dict[str, float]], str]:
    decimals_by_code: dict[str, list[float]] = defaultdict(list)
    sport_used = ""

    for sport_key in SPORT_KEYS:
        params = urlencode(
            {
                "apiKey": api_key,
                "regions": "us,uk,eu",
                "markets": "outrights",
                "oddsFormat": "decimal",
            }
        )
        url = f"{ODDS_API_BASE}/sports/{sport_key}/odds?{params}"

        try:
            payload = fetch_json(url)
        except Exception as error:
            print(f"Skipping {sport_key}: {error}")
            continue

        if not isinstance(payload, list) or not payload:
            continue

        found_outcomes = False

        for event in payload:
            for bookmaker in event.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    if market.get("key") != "outrights":
                        continue

                    for outcome in market.get("outcomes", []):
                        code = normalize_team_code(str(outcome.get("name", "")))
                        price = outcome.get("price")

                        if code is None or price is None:
                            continue

                        decimal_odds = float(price)

                        if decimal_odds <= 1.0:
                            continue

                        decimals_by_code[code].append(decimal_odds)
                        found_outcomes = True

        if found_outcomes:
            sport_used = sport_key
            break

    if not decimals_by_code:
        raise SystemExit(
            "No outright odds returned. Check ODDS_API_KEY and tournament availability."
        )

    rows = []

    for code, decimals in sorted(decimals_by_code.items()):
        avg_decimal = sum(decimals) / len(decimals)
        rows.append(
            {
                "code": code,
                "decimal_odds": avg_decimal,
                "bookmaker_count": len(decimals),
            }
        )

    return rows, sport_used


def build_dataframe(
    rows: list[dict[str, float | int | str]],
    *,
    source: str,
) -> pd.DataFrame:
    teams = pd.read_csv("data/teams.csv")
    team_names = teams.set_index("code")["name"].to_dict()
    as_of = datetime.now(timezone.utc).isoformat(timespec="seconds")

    output_rows = []

    for row in rows:
        code = str(row["code"])
        decimal_odds = float(row["decimal_odds"])

        output_rows.append(
            {
                "code": code,
                "team": team_names.get(code, code),
                "decimal_odds": round(decimal_odds, 4),
                "implied_prob": round(1.0 / decimal_odds, 6),
                "source": source,
                "as_of": as_of,
            }
        )

    dataframe = pd.DataFrame(output_rows)
    return dataframe.sort_values("implied_prob", ascending=False).reset_index(drop=True)


def write_seed_if_missing(output_path: Path) -> None:
    if output_path.exists():
        return

    # Checked-in fallback snapshot for local/dev when no API key is configured.
    seed_rows = [
        ("ESP", 4.50),
        ("BRA", 5.00),
        ("FRA", 5.50),
        ("ARG", 6.50),
        ("ENG", 7.00),
        ("POR", 9.00),
        ("GER", 10.00),
        ("NED", 12.00),
        ("COL", 21.00),
        ("BEL", 17.00),
    ]

    rows = [
        {"code": code, "decimal_odds": decimal, "bookmaker_count": 1}
        for code, decimal in seed_rows
    ]

    dataframe = build_dataframe(rows, source="seed_snapshot")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(output_path, index=False)
    print(f"Wrote seed market odds to {output_path}")


def main() -> None:
    args = parse_args()
    output_path = Path(args.output)
    api_key = os.environ.get("ODDS_API_KEY", "").strip()

    if not api_key:
        write_seed_if_missing(output_path)

        if output_path.exists():
            print(
                "ODDS_API_KEY is not set; keeping existing market odds CSV. "
                "Set ODDS_API_KEY to refresh from The Odds API."
            )
            return

        raise SystemExit(
            "ODDS_API_KEY is not set and no market odds CSV exists. "
            "Set ODDS_API_KEY or commit data/market_odds.csv."
        )

    rows, sport_used = collect_outright_odds(api_key)
    dataframe = build_dataframe(rows, source=f"the_odds_api:{sport_used}")

    print(f"Fetched {len(dataframe)} teams from {sport_used}")

    if args.dry_run:
        print(dataframe.head(10).to_string(index=False))
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(output_path, index=False)
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
