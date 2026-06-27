from __future__ import annotations

MARKET_ODDS_PATH = "data/market_odds.csv"

# The Odds API outright winner names → FIFA codes used in teams.csv
ODDS_NAME_TO_CODE: dict[str, str] = {
    "Argentina": "ARG",
    "Brazil": "BRA",
    "France": "FRA",
    "England": "ENG",
    "Spain": "ESP",
    "Germany": "GER",
    "Portugal": "POR",
    "Netherlands": "NED",
    "Belgium": "BEL",
    "Italy": "ITA",
    "Croatia": "CRO",
    "Uruguay": "URU",
    "Colombia": "COL",
    "Mexico": "MEX",
    "USA": "USA",
    "United States": "USA",
    "Canada": "CAN",
    "Japan": "JPN",
    "South Korea": "KOR",
    "Korea Republic": "KOR",
    "Morocco": "MAR",
    "Switzerland": "SUI",
    "Denmark": "DEN",
    "Austria": "AUT",
    "Turkey": "TUR",
    "Türkiye": "TUR",
    "Ecuador": "ECU",
    "Senegal": "SEN",
    "Australia": "AUS",
    "Paraguay": "PAR",
    "Ukraine": "UKR",
    "Scotland": "SCO",
    "Norway": "NOR",
    "Sweden": "SWE",
    "Poland": "POL",
    "Serbia": "SRB",
    "Ghana": "GHA",
    "Cameroon": "CMR",
    "Egypt": "EGY",
    "Iran": "IRI",
    "Qatar": "QAT",
    "Saudi Arabia": "KSA",
    "Tunisia": "TUN",
    "Algeria": "DZA",
    "Ivory Coast": "CIV",
    "Côte d'Ivoire": "CIV",
    "Costa Rica": "CRC",
    "Panama": "PAN",
    "Wales": "WAL",
    "Chile": "CHI",
    "Peru": "PER",
    "New Zealand": "NZL",
    "Uzbekistan": "UZB",
    "Jordan": "JOR",
    "Iraq": "IRQ",
    "South Africa": "RSA",
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    "Haiti": "HTI",
    "Curacao": "CUW",
    "Curaçao": "CUW",
    "Cape Verde": "CPV",
    "DR Congo": "COD",
    "Democratic Republic of the Congo": "COD",
    "Bosnia and Herzegovina": "BIH",
    "Bolivia": "BOL",
}

SPORT_KEYS = (
    "soccer_fifa_world_cup_winner",
    "soccer_fifa_world_cup",
)


def normalize_team_code(name: str) -> str | None:
    cleaned = str(name).strip()

    if cleaned in ODDS_NAME_TO_CODE:
        return ODDS_NAME_TO_CODE[cleaned]

    upper = cleaned.upper()

    if len(upper) == 3 and upper.isalpha():
        return upper

    return None
