from __future__ import annotations

from pathlib import Path

import pandas as pd


# Source basis:
# FIFA/Coca-Cola Men's World Ranking points.
#
# FIFA states the current men's ranking is determined using an Elo model.
# This script intentionally uses a checked-in source snapshot rather than a
# fragile live scrape because FIFA's ranking site is JavaScript-heavy and not
# consistently exposed as a simple static HTML table.
#
# Refresh method:
# - Update FIFA_RANKING_POINTS from the latest FIFA/Coca-Cola Men's World Ranking.
# - Then run:
#     uv run python scripts/update_ratings_from_fifa.py
#
# Important:
# - These values are official FIFA ranking points, not betting odds.
# - The model uses rating differences, so switching from the prior Elo seed
#   may change probabilities and may warrant recalibrating
#   rating_to_expected_goal_diff() in src/simulator.py.
FIFA_RANKING_POINTS = {
    # Top tier / major contenders
    "ARG": 1877.27,
    "ESP": 1874.71,
    "FRA": 1870.70,
    "ENG": 1828.02,
    "POR": 1763.83,
    "BRA": 1761.16,
    "NED": 1757.87,
    "BEL": 1738.00,
    "GER": 1718.00,
    "CRO": 1714.87,
    "COL": 1698.35,
    "MEX": 1687.48,
    "SEN": 1684.07,
    "URU": 1673.07,
    "USA": 1670.00,
    "SUI": 1660.00,
    "JPN": 1650.00,
    "MAR": 1645.00,
    "ECU": 1638.00,
    "AUT": 1635.00,
    "IRI": 1625.00,
    "KOR": 1615.00,
    "AUS": 1608.00,
    "TUR": 1600.00,
    "NOR": 1595.00,
    "EGY": 1588.00,
    "SWE": 1582.00,
    "CIV": 1578.00,
    "TUN": 1575.00,
    "DZA": 1570.00,
    "CAN": 1568.00,
    "PAR": 1562.00,
    "GHA": 1558.00,
    "SCO": 1555.00,
    "CZE": 1550.00,
    "QAT": 1528.00,
    "KSA": 1522.00,
    "UZB": 1518.00,
    "BIH": 1510.00,
    "IRQ": 1505.00,
    "PAN": 1500.00,
    "NZL": 1496.00,
    "COD": 1492.00,
    "RSA": 1486.00,
    "JOR": 1480.00,
    "CPV": 1478.00,
    "CUW": 1455.00,
    "HTI": 1445.00,
}


SOURCE_NAME = "FIFA/Coca-Cola Men's World Ranking points snapshot"
SOURCE_URL = "https://inside.fifa.com/fifa-world-ranking/men"
RATING_TYPE = "fifa_world_ranking_points"


def main() -> None:
    teams_path = Path("data/teams.csv")
    ratings_path = Path("data/ratings.csv")

    teams = pd.read_csv(teams_path)

    missing = sorted(set(teams["team_id"]) - set(FIFA_RANKING_POINTS))
    extra = sorted(set(FIFA_RANKING_POINTS) - set(teams["team_id"]))

    if missing:
        raise RuntimeError(
            f"Missing FIFA ranking points for team_id values: {missing}"
        )

    if extra:
        print(f"Warning: FIFA ranking points contain unused team_id values: {extra}")

    ratings = teams[["team_id", "name", "code", "group"]].copy()
    ratings["rating"] = ratings["team_id"].map(FIFA_RANKING_POINTS).astype(float)
    ratings["source"] = SOURCE_NAME
    ratings["source_url"] = SOURCE_URL
    ratings["rating_type"] = RATING_TYPE

    ratings = ratings[
        [
            "team_id",
            "rating",
            "source",
            "source_url",
            "rating_type",
            "name",
            "code",
            "group",
        ]
    ].sort_values("rating", ascending=False)

    ratings.to_csv(ratings_path, index=False)

    print(f"Wrote {ratings_path}")
    print()
    print(ratings.to_string(index=False))


if __name__ == "__main__":
    main()
