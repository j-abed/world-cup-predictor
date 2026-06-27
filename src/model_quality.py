from __future__ import annotations

from typing import Any, Literal

ProjectionTier = Literal["standard", "fast"]

# Calibration priors from the 2022 backtest export (pre-tournament replay).
BACKTEST_R16_OVERLAP = 12 / 16
BACKTEST_CHAMPION_IN_TOP_5 = 1.0
DEFAULT_TARGET_SIMULATIONS = 10_000
MIN_OPERATIONAL_SIMULATIONS = 500


def confidence_label(score: float) -> str:
    if score >= 0.75:
        return "High"
    if score >= 0.5:
        return "Moderate"
    return "Low"


def simulation_factor_soft(
    round_simulations: int,
    *,
    target_simulations: int = DEFAULT_TARGET_SIMULATIONS,
) -> float:
    """Map sim count to [0, 1] with a practical floor — 500 runs is usable, not 5%."""
    if round_simulations <= 0:
        return 0.0
    if round_simulations >= target_simulations:
        return 1.0

    floor = 0.55
    if round_simulations >= MIN_OPERATIONAL_SIMULATIONS:
        span = target_simulations - MIN_OPERATIONAL_SIMULATIONS
        progress = (round_simulations - MIN_OPERATIONAL_SIMULATIONS) / span
        return floor + (1.0 - floor) * progress

    return floor * (round_simulations / MIN_OPERATIONAL_SIMULATIONS)


def component_weights(projection_tier: ProjectionTier) -> dict[str, float]:
    if projection_tier == "fast":
        return {
            "simulation_depth": 0.0,
            "group_stage_completeness": 0.45,
            "backtest_calibration": 0.55,
        }

    return {
        "simulation_depth": 0.20,
        "group_stage_completeness": 0.40,
        "backtest_calibration": 0.40,
    }


def build_model_quality_payload(
    *,
    completed_result_count: int,
    fixture_count: int,
    round_simulations: int,
    target_simulations: int = DEFAULT_TARGET_SIMULATIONS,
    projection_tier: ProjectionTier = "standard",
) -> dict[str, Any]:
    sim_factor = simulation_factor_soft(
        round_simulations,
        target_simulations=target_simulations,
    )
    completeness = (
        completed_result_count / fixture_count if fixture_count > 0 else 0.0
    )
    calibration_factor = (
        0.6 * BACKTEST_R16_OVERLAP + 0.4 * BACKTEST_CHAMPION_IN_TOP_5
    )
    weights = component_weights(projection_tier)

    confidence_score = round(
        weights["simulation_depth"] * sim_factor
        + weights["group_stage_completeness"] * completeness
        + weights["backtest_calibration"] * calibration_factor,
        4,
    )

    return {
        "confidence_score": confidence_score,
        "confidence_label": confidence_label(confidence_score),
        "confidence_percent": round(confidence_score * 100, 1),
        "projection_tier": projection_tier,
        "components": {
            "simulation_factor": round(sim_factor, 4),
            "group_stage_completeness": round(completeness, 4),
            "backtest_calibration": round(calibration_factor, 4),
        },
        "component_weights": {key: round(value, 2) for key, value in weights.items()},
        "round_simulations": round_simulations,
        "target_simulations": target_simulations,
        "backtest_reference": "2022",
        "backtest_round_of_16_overlap": round(BACKTEST_R16_OVERLAP, 4),
    }
