import pandas as pd

from src.model_quality import build_model_quality_payload


def test_model_quality_blends_simulation_completeness_and_backtest() -> None:
    payload = build_model_quality_payload(
        completed_result_count=50,
        fixture_count=72,
        round_simulations=10_000,
    )

    assert 0.0 < payload["confidence_score"] <= 1.0
    assert payload["confidence_label"] in {"High", "Moderate", "Low"}
    assert payload["backtest_reference"] == "2022"
