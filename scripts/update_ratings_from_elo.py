from __future__ import annotations

from pathlib import Path

import pandas as pd


# Source basis:
# World Football Elo Ratings / eloratings.net, current public table snapshot.
#
# These are a checked-in seed snapshot, not a live scrape. That is intentional:
# the public pages are not consistently exposed as normal HTML tables.
#
# Rating source type:
# - Public national-team Elo-style ratings
# - Not official FIFA rankings
# - Better than manually invented placeholder ratings
#
# Refresh method:
# - Update this seed table from the latest World Football Elo table when needed.
ELO_SEED = {
    "ESP": 2165,
    "ARG": 2113,
    "FRA": 2081,
    "ENG": 2020,
    "BRA": 1984,
    "POR": 1980,
    "NED": 1973,
    "GER": 1966,
    "COL": 1962,
    "URU": 1957,
    "BEL": 1942,
    "CRO": 1890,
    "MAR": 1885,
    "SUI": 1878,
    "JPN": 1855,
    "USA": 1832,
    "MEX": 1815,
    "AUT": 1808,
    "SEN": 1800,
    "SWE": 1795,
    "NOR": 1788,
    "ECU": 1782,
    "KOR": 1776,
    "IRI": 1768,
    "AUS": 1758,
    "EGY": 1750,
    "TUR": 1746,
    "CIV": 1738,
    "DZA": 1732,
    "GHA": 1724,
    "CZE": 1718,
    "PAR": 1712,
    "SCO": 1708,
    "CAN": 1702,
    "QAT": 1660,
    "UZB": 1656,
    "IRQ": 1648,
    "COD": 1642,
    "PAN": 1635,
    "KSA": 1628,
    "BIH": 1620,
    "NZL": 1608,
    "RSA": 1598,
    "CPV": 1588,
    "JOR": 1578,
    "CUW": 1540,
    "HTI": 1518,
    "TUN": 1740,
}


def main() -> None:
    teams_path = Path("data/teams.csv")
    ratings_path = Path("data/ratings.csv")

    teams = pd.read_csv(teams_path)

    missing = sorted(set(teams["team_id"]) - set(ELO_SEED))
    extra = sorted(set(ELO_SEED) - set(teams["team_id"]))

    if missing:
        raise RuntimeError(f"Missing Elo seed ratings for team_id values: {missing}")

    if extra:
        print(f"Warning: Elo seed contains unused team_id values: {extra}")

    ratings = teams[["team_id", "name", "code", "group"]].copy()
    ratings["rating"] = ratings["team_id"].map(ELO_SEED).astype(int)
    ratings["source"] = "World Football Elo seed snapshot"
    ratings["source_url"] = "https://www.eloratings.net/"
    ratings["rating_type"] = "national_team_elo"

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
