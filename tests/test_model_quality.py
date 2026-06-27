import pandas as pd

from src.model_quality import (
    build_model_quality_payload,
    simulation_factor_soft,
)


def test_model_quality_standard_tier_with_full_sims() -> None:
    payload = build_model_quality_payload(
        completed_result_count=50,
        fixture_count=72,
        round_simulations=10_000,
        projection_tier="standard",
    )

    assert 0.7 <= payload["confidence_score"] <= 0.9
    assert payload["confidence_label"] in {"High", "Moderate"}
    assert payload["projection_tier"] == "standard"
    assert payload["components"]["simulation_factor"] == 1.0


def test_model_quality_fast_tier_ignores_sim_depth() -> None:
    low = build_model_quality_payload(
        completed_result_count=50,
        fixture_count=72,
        round_simulations=500,
        projection_tier="fast",
    )
    high = build_model_quality_payload(
        completed_result_count=50,
        fixture_count=72,
        round_simulations=10_000,
        projection_tier="fast",
    )

    assert low["confidence_score"] == high["confidence_score"]
    assert low["component_weights"]["simulation_depth"] == 0.0


def test_simulation_factor_soft_floor_at_500() -> None:
    assert simulation_factor_soft(500) == 0.55
    assert simulation_factor_soft(10_000) == 1.0
    assert simulation_factor_soft(250) == 0.275


def test_model_quality_500_sims_standard_beats_old_linear_penalty() -> None:
    payload = build_model_quality_payload(
        completed_result_count=50,
        fixture_count=72,
        round_simulations=500,
        projection_tier="standard",
    )

    assert payload["confidence_score"] > 0.65
