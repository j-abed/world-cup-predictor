from __future__ import annotations

import json
from datetime import date
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ESPN_SCOREBOARD_URL = (
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
)
ESPN_SUMMARY_URL = (
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary"
)

# ESPN abbreviations are usually close to our team codes, but keep this explicit
# so mismatches are easy to fix.
ESPN_CODE_TO_TEAM_ID = {
    "MEX": "MEX",
    "RSA": "RSA",
    "KOR": "KOR",
    "CZE": "CZE",
    "CAN": "CAN",
    "BIH": "BIH",
    "QAT": "QAT",
    "SUI": "SUI",
    "BRA": "BRA",
    "MAR": "MAR",
    "SCO": "SCO",
    "HAI": "HTI",
    "HTI": "HTI",
    "USA": "USA",
    "PAR": "PAR",
    "AUS": "AUS",
    "TUR": "TUR",
    "GER": "GER",
    "CUW": "CUW",
    "CIV": "CIV",
    "ECU": "ECU",
    "NED": "NED",
    "JPN": "JPN",
    "SWE": "SWE",
    "TUN": "TUN",
    "BEL": "BEL",
    "EGY": "EGY",
    "IRN": "IRI",
    "IRI": "IRI",
    "NZL": "NZL",
    "ESP": "ESP",
    "CPV": "CPV",
    "KSA": "KSA",
    "URU": "URU",
    "FRA": "FRA",
    "SEN": "SEN",
    "IRQ": "IRQ",
    "NOR": "NOR",
    "ARG": "ARG",
    "ALG": "DZA",
    "DZA": "DZA",
    "AUT": "AUT",
    "JOR": "JOR",
    "POR": "POR",
    "COD": "COD",
    "DRC": "COD",
    "UZB": "UZB",
    "COL": "COL",
    "ENG": "ENG",
    "CRO": "CRO",
    "GHA": "GHA",
    "PAN": "PAN",
}

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def fetch_json(url: str) -> dict:
    request = Request(url, headers=DEFAULT_HEADERS)
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_scoreboard(target_date: date) -> dict:
    params = urlencode({"dates": target_date.strftime("%Y%m%d")})
    return fetch_json(f"{ESPN_SCOREBOARD_URL}?{params}")


def fetch_event_summary(event_id: str) -> dict:
    params = urlencode({"event": event_id})
    return fetch_json(f"{ESPN_SUMMARY_URL}?{params}")


def get_competition(event: dict) -> dict | None:
    competitions = event.get("competitions") or []
    if not competitions:
        return None
    return competitions[0]


def is_completed_event(event: dict) -> bool:
    status = event.get("status") or {}
    status_type = status.get("type") or {}
    return bool(status_type.get("completed"))


def is_in_progress_event(event: dict) -> bool:
    status = event.get("status") or {}
    status_type = status.get("type") or {}

    if status_type.get("completed"):
        return False

    state = str(status_type.get("state", "")).lower()
    name = str(status_type.get("name", "")).lower()

    return state == "in" or "in_progress" in name or name == "status_in_progress"


def extract_team_id(competitor: dict) -> str | None:
    team = competitor.get("team") or {}

    candidates = [
        team.get("abbreviation"),
        team.get("shortDisplayName"),
        team.get("displayName"),
        team.get("name"),
    ]

    for candidate in candidates:
        if candidate is None:
            continue

        normalized = str(candidate).strip().upper()

        if normalized in ESPN_CODE_TO_TEAM_ID:
            return ESPN_CODE_TO_TEAM_ID[normalized]

    return None


def extract_card_counts_from_summary(summary: dict) -> dict[str, dict[str, int]]:
    """Return team_id -> {yellow, red} from ESPN boxscore statistics."""
    cards: dict[str, dict[str, int]] = {}
    boxscore = summary.get("boxscore") or {}

    for team_block in boxscore.get("teams") or []:
        competitor = team_block.get("team") or {}
        team_id = extract_team_id({"team": competitor})

        if team_id is None:
            continue

        yellow = 0
        red = 0

        for stat in team_block.get("statistics") or []:
            name = str(stat.get("name") or "")
            value = stat.get("value")

            if value is None:
                display = stat.get("displayValue")
                try:
                    value = int(display) if display is not None else 0
                except (TypeError, ValueError):
                    value = 0

            if name == "yellowCards":
                yellow = int(value)
            elif name == "redCards":
                red = int(value)

        cards[team_id] = {"yellow": yellow, "red": red}

    return cards
