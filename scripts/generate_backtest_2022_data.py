from __future__ import annotations

import csv
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

OUTPUT_DIR = REPO_ROOT / "data" / "backtest" / "2022"

# FIFA/Coca-Cola Men's World Ranking points (31 Oct 2022 snapshot).
RATINGS: dict[str, float] = {
    "BRA": 1842.64,
    "BEL": 1816.71,
    "ARG": 1775.88,
    "FRA": 1764.85,
    "ENG": 1728.47,
    "NED": 1694.51,
    "ESP": 1693.73,
    "POR": 1678.09,
    "DEN": 1665.47,
    "GER": 1650.21,
    "CRO": 1643.43,
    "MAR": 1635.08,
    "SUI": 1620.62,
    "SEN": 1584.38,
    "MEX": 1572.27,
    "USA": 1549.53,
    "POL": 1548.56,
    "WAL": 1540.09,
    "IRN": 1537.72,
    "SRB": 1530.41,
    "KOR": 1529.55,
    "JPN": 1520.09,
    "ECU": 1519.30,
    "AUT": 1513.28,
    "TUN": 1507.54,
    "AUS": 1489.68,
    "CAN": 1473.82,
    "CRC": 1469.00,
    "CMR": 1414.66,
    "GHA": 1397.79,
    "QAT": 1393.22,
    "KSA": 1359.61,
    "URU": 1357.21,
}

TEAMS = [
    ("NED", "Netherlands", "NED", "A"),
    ("SEN", "Senegal", "SEN", "A"),
    ("ECU", "Ecuador", "ECU", "A"),
    ("QAT", "Qatar", "QAT", "A"),
    ("ENG", "England", "ENG", "B"),
    ("USA", "United States", "USA", "B"),
    ("IRN", "Iran", "IRN", "B"),
    ("WAL", "Wales", "WAL", "B"),
    ("ARG", "Argentina", "ARG", "C"),
    ("POL", "Poland", "POL", "C"),
    ("MEX", "Mexico", "MEX", "C"),
    ("KSA", "Saudi Arabia", "KSA", "C"),
    ("FRA", "France", "FRA", "D"),
    ("AUS", "Australia", "AUS", "D"),
    ("TUN", "Tunisia", "TUN", "D"),
    ("DEN", "Denmark", "DEN", "D"),
    ("JPN", "Japan", "JPN", "E"),
    ("ESP", "Spain", "ESP", "E"),
    ("GER", "Germany", "GER", "E"),
    ("CRC", "Costa Rica", "CRC", "E"),
    ("MAR", "Morocco", "MAR", "F"),
    ("CRO", "Croatia", "CRO", "F"),
    ("BEL", "Belgium", "BEL", "F"),
    ("CAN", "Canada", "CAN", "F"),
    ("BRA", "Brazil", "BRA", "G"),
    ("SUI", "Switzerland", "SUI", "G"),
    ("CMR", "Cameroon", "CMR", "G"),
    ("SRB", "Serbia", "SRB", "G"),
    ("POR", "Portugal", "POR", "H"),
    ("KOR", "South Korea", "KOR", "H"),
    ("URU", "Uruguay", "URU", "H"),
    ("GHA", "Ghana", "GHA", "H"),
]

# (match_id, group, home, away, home_score, away_score)
GROUP_MATCHES = [
    (1, "A", "QAT", "ECU", 0, 2),
    (2, "A", "SEN", "NED", 0, 2),
    (3, "A", "QAT", "SEN", 1, 3),
    (4, "A", "NED", "ECU", 1, 1),
    (5, "A", "ECU", "SEN", 1, 2),
    (6, "A", "NED", "QAT", 2, 0),
    (7, "B", "ENG", "IRN", 6, 2),
    (8, "B", "USA", "WAL", 1, 1),
    (9, "B", "WAL", "IRN", 0, 2),
    (10, "B", "ENG", "USA", 0, 0),
    (11, "B", "WAL", "ENG", 0, 3),
    (12, "B", "IRN", "USA", 0, 1),
    (13, "C", "ARG", "KSA", 1, 2),
    (14, "C", "MEX", "POL", 0, 0),
    (15, "C", "POL", "KSA", 2, 0),
    (16, "C", "ARG", "MEX", 2, 0),
    (17, "C", "POL", "ARG", 0, 2),
    (18, "C", "KSA", "MEX", 1, 2),
    (19, "D", "DEN", "TUN", 0, 0),
    (20, "D", "FRA", "AUS", 4, 1),
    (21, "D", "TUN", "AUS", 0, 1),
    (22, "D", "FRA", "DEN", 2, 1),
    (23, "D", "AUS", "DEN", 0, 0),
    (24, "D", "TUN", "FRA", 1, 0),
    (25, "E", "GER", "JPN", 1, 2),
    (26, "E", "ESP", "CRC", 7, 0),
    (27, "E", "JPN", "CRC", 0, 1),
    (28, "E", "ESP", "GER", 1, 1),
    (29, "E", "JPN", "ESP", 0, 2),
    (30, "E", "CRC", "GER", 2, 4),
    (31, "F", "MAR", "CRO", 0, 0),
    (32, "F", "BEL", "CAN", 1, 0),
    (33, "F", "BEL", "MAR", 0, 2),
    (34, "F", "CRO", "CAN", 4, 1),
    (35, "F", "CAN", "MAR", 1, 2),
    (36, "F", "CRO", "BEL", 0, 0),
    (37, "G", "SUI", "CMR", 1, 0),
    (38, "G", "BRA", "SRB", 2, 0),
    (39, "G", "CMR", "SRB", 3, 3),
    (40, "G", "BRA", "SUI", 1, 0),
    (41, "G", "CMR", "BRA", 1, 0),
    (42, "G", "SRB", "SUI", 2, 3),
    (43, "H", "URU", "KOR", 0, 0),
    (44, "H", "POR", "GHA", 3, 2),
    (45, "H", "KOR", "GHA", 2, 3),
    (46, "H", "POR", "URU", 2, 0),
    (47, "H", "GHA", "URU", 0, 2),
    (48, "H", "KOR", "POR", 2, 1),
]

KNOCKOUT_MATCHES = [
    (49, "Round of 16", "1A", "2B", 3, 1),
    (50, "Round of 16", "1C", "2D", 2, 1),
    (51, "Round of 16", "1E", "2F", 1, 1),
    (52, "Round of 16", "1G", "2H", 4, 1),
    (53, "Round of 16", "1B", "2A", 3, 0),
    (54, "Round of 16", "1D", "2C", 3, 1),
    (55, "Round of 16", "1F", "2E", 0, 0),
    (56, "Round of 16", "1H", "2G", 6, 1),
    (57, "Quarterfinal", "Winner Match 49", "Winner Match 50", 2, 2),
    (58, "Quarterfinal", "Winner Match 51", "Winner Match 52", 1, 1),
    (59, "Quarterfinal", "Winner Match 53", "Winner Match 54", 1, 1),
    (60, "Quarterfinal", "Winner Match 55", "Winner Match 56", 1, 0),
    (61, "Semifinal", "Winner Match 57", "Winner Match 58", 3, 0),
    (62, "Semifinal", "Winner Match 59", "Winner Match 60", 2, 0),
    (64, "Final", "Winner Match 61", "Winner Match 62", 3, 3),
]

BRACKET_SLOTS = [
    ("R16-49", "Round of 16", 49, "1st Group A", "2nd Group B", 57),
    ("R16-50", "Round of 16", 50, "1st Group C", "2nd Group D", 57),
    ("R16-51", "Round of 16", 51, "1st Group E", "2nd Group F", 58),
    ("R16-52", "Round of 16", 52, "1st Group G", "2nd Group H", 58),
    ("R16-53", "Round of 16", 53, "1st Group B", "2nd Group A", 59),
    ("R16-54", "Round of 16", 54, "1st Group D", "2nd Group C", 59),
    ("R16-55", "Round of 16", 55, "1st Group F", "2nd Group E", 60),
    ("R16-56", "Round of 16", 56, "1st Group H", "2nd Group G", 60),
    ("QF-57", "Quarterfinal", 57, "Winner Match 49", "Winner Match 50", 61),
    ("QF-58", "Quarterfinal", 58, "Winner Match 51", "Winner Match 52", 61),
    ("QF-59", "Quarterfinal", 59, "Winner Match 53", "Winner Match 54", 62),
    ("QF-60", "Quarterfinal", 60, "Winner Match 55", "Winner Match 56", 62),
    ("SF-61", "Semifinal", 61, "Winner Match 57", "Winner Match 58", 64),
    ("SF-62", "Semifinal", 62, "Winner Match 59", "Winner Match 60", 64),
    ("F-64", "Final", 64, "Winner Match 61", "Winner Match 62", ""),
]


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    write_csv(
        OUTPUT_DIR / "teams.csv",
        ["team_id", "name", "code", "group"],
        [
            {"team_id": team_id, "name": name, "code": code, "group": group}
            for team_id, name, code, group in TEAMS
        ],
    )

    fixture_rows = []
    for match_id, group, home, away, _, _ in GROUP_MATCHES:
        fixture_rows.append(
            {
                "match_id": match_id,
                "stage": "Group",
                "group": group,
                "home_team": home,
                "away_team": away,
                "kickoff": f"2022-11-{20 + (match_id % 10):02d}T12:00:00+03:00",
            }
        )

    for match_id, stage, home, away, _, _ in KNOCKOUT_MATCHES:
        fixture_rows.append(
            {
                "match_id": match_id,
                "stage": stage,
                "group": "",
                "home_team": home,
                "away_team": away,
                "kickoff": f"2022-12-{3 + (match_id % 15):02d}T16:00:00+03:00",
            }
        )

    write_csv(
        OUTPUT_DIR / "fixtures.csv",
        ["match_id", "stage", "group", "home_team", "away_team", "kickoff"],
        fixture_rows,
    )

    result_rows = []
    for match_id, _, home, away, home_score, away_score in GROUP_MATCHES:
        result_rows.append(
            {
                "match_id": match_id,
                "home_score": home_score,
                "away_score": away_score,
                "status": "Complete",
            }
        )

    for match_id, _, home, away, home_score, away_score in KNOCKOUT_MATCHES:
        result_rows.append(
            {
                "match_id": match_id,
                "home_score": home_score,
                "away_score": away_score,
                "status": "Complete",
            }
        )

    write_csv(
        OUTPUT_DIR / "results.csv",
        ["match_id", "home_score", "away_score", "status"],
        result_rows,
    )

    write_csv(
        OUTPUT_DIR / "ratings.csv",
        [
            "team_id",
            "rating",
            "source",
            "source_url",
            "rating_type",
            "name",
            "code",
            "group",
        ],
        [
            {
                "team_id": team_id,
                "rating": RATINGS[code],
                "source": "FIFA/Coca-Cola Men's World Ranking points snapshot",
                "source_url": "https://inside.fifa.com/fifa-world-ranking/men",
                "rating_type": "fifa_world_ranking_points",
                "name": name,
                "code": code,
                "group": group,
            }
            for team_id, name, code, group in TEAMS
        ],
    )

    write_csv(
        OUTPUT_DIR / "bracket_slots.csv",
        [
            "slot_id",
            "round",
            "match_id",
            "home_source",
            "away_source",
            "winner_advances_to",
        ],
        [
            {
                "slot_id": slot_id,
                "round": round_name,
                "match_id": match_id,
                "home_source": home_source,
                "away_source": away_source,
                "winner_advances_to": winner_advances_to,
            }
            for slot_id, round_name, match_id, home_source, away_source, winner_advances_to in BRACKET_SLOTS
        ],
    )

    print(f"Wrote 2022 backtest data to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
