import pandas as pd

from src.market_comparison import build_market_comparison_payload


def test_market_comparison_unavailable_when_no_odds() -> None:
    payload = build_market_comparison_payload(
        round_probabilities=pd.DataFrame(
            {
                "code": ["ESP", "BRA"],
                "team": ["Spain", "Brazil"],
                "champion_prob": [0.25, 0.20],
            }
        ),
        market_odds=pd.DataFrame(),
    )

    assert payload["available"] is False
    assert payload["teams"] == []
    assert payload["summary"] is None


def test_market_comparison_delta_and_summary() -> None:
    round_probabilities = pd.DataFrame(
        {
            "code": ["ESP", "BRA", "FRA"],
            "team": ["Spain", "Brazil", "France"],
            "champion_prob": [0.30, 0.22, 0.18],
        }
    )
    market_odds = pd.DataFrame(
        {
            "code": ["ESP", "BRA", "FRA"],
            "team": ["Spain", "Brazil", "France"],
            "decimal_odds": [4.0, 5.0, 6.0],
            "implied_prob": [0.25, 0.20, 0.166667],
            "source": "seed_snapshot",
            "as_of": "2026-06-27T12:00:00+00:00",
        }
    )

    payload = build_market_comparison_payload(round_probabilities, market_odds)

    assert payload["available"] is True
    assert payload["summary"]["model_favorite_code"] == "ESP"
    assert payload["summary"]["market_favorite_code"] == "ESP"
    assert payload["summary"]["favorites_agree"] is True
    assert payload["summary"]["compared_team_count"] == 3

    esp = next(row for row in payload["teams"] if row["code"] == "ESP")
    assert esp["delta"] == round(0.30 - 0.25, 6)
    assert esp["decimal_odds"] == 4.0

    assert payload["teams"][0]["code"] == "ESP"
    assert abs(payload["teams"][0]["delta"]) >= abs(payload["teams"][-1]["delta"])
