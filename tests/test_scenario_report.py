from src.scenario_report import (
    champion_odds_deltas,
    format_scenario_report,
    qualification_deltas_for_codes,
    team_codes_for_overrides,
)


def test_champion_odds_deltas_sorts_by_largest_move() -> None:
    baseline = {
        "odds": {
            "round": [
                {"code": "A", "team": "Alpha", "champion_prob": 0.10},
                {"code": "B", "team": "Beta", "champion_prob": 0.20},
            ]
        }
    }
    scenario = {
        "odds": {
            "round": [
                {"code": "A", "team": "Alpha", "champion_prob": 0.16},
                {"code": "B", "team": "Beta", "champion_prob": 0.18},
            ]
        }
    }

    deltas = champion_odds_deltas(baseline, scenario)

    assert deltas[0]["code"] == "A"
    assert deltas[0]["delta"] == 0.06


def test_format_scenario_report_includes_match_teams() -> None:
    baseline = {
        "odds": {
            "round": [
                {"code": "URU", "team": "Uruguay", "champion_prob": 0.04},
            ],
            "qualification": [
                {
                    "code": "URU",
                    "team": "Uruguay",
                    "group": "H",
                    "qualify_prob": 0.70,
                },
                {
                    "code": "CPV",
                    "team": "Cape Verde",
                    "group": "H",
                    "qualify_prob": 0.55,
                },
            ],
        }
    }
    scenario = {
        "metadata": {
            "scenario": {
                "label": "Uruguay 2-1 Cape Verde",
                "simulations": 1000,
                "overrides": [{"match_id": 1, "home_score": 2, "away_score": 1}],
            }
        },
        "fixtures": [
            {
                "match_id": 1,
                "home_code": "URU",
                "away_code": "CPV",
            }
        ],
        "odds": {
            "round": [
                {"code": "URU", "team": "Uruguay", "champion_prob": 0.05},
            ],
            "qualification": [
                {
                    "code": "URU",
                    "team": "Uruguay",
                    "group": "H",
                    "qualify_prob": 0.82,
                },
                {
                    "code": "CPV",
                    "team": "Cape Verde",
                    "group": "H",
                    "qualify_prob": 0.41,
                },
            ],
        },
    }

    report = format_scenario_report(scenario, baseline)

    assert "Uruguay 2-1 Cape Verde" in report
    assert "Uruguay" in report
    assert "Qualification odds for teams in this scenario" in report


def test_team_codes_for_overrides() -> None:
    fixtures = [
        {"match_id": 10, "home_code": "URU", "away_code": "CPV"},
    ]

    codes = team_codes_for_overrides(
        fixtures,
        [{"match_id": 10, "home_score": 2, "away_score": 1}],
    )

    assert codes == {"URU", "CPV"}
