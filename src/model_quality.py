from __future__ import annotations

from typing import Any


# Calibration priors from the 2022 backtest export (pre-tournament replay).
BACKTEST_R16_OVERLAP = 12 / 16
BACKTEST_CHAMPION_IN_TOP_5 = 1.0


def confidence_label(score: float) -> str:
    if score >= 0.75:
        return "High"
    if score >= 0.5:
        return "Moderate"
    return "Low"


def build_model_quality_payload(
    *,
    completed_result_count: int,
    fixture_count: int,
    round_simulations: int,
    target_simulations: int = 10_000,
) -> dict[str, Any]:
    simulation_factor = min(round_simulations / target_simulations, 1.0)
    completeness = (
        completed_result_count / fixture_count if fixture_count > 0 else 0.0
    )
    calibration_factor = (
        0.6 * BACKTEST_R16_OVERLAP + 0.4 * BACKTEST_CHAMPION_IN_TOP_5
    )

    confidence_score = round(
        0.35 * simulation_factor + 0.35 * completeness + 0.30 * calibration_factor,
        4,
    )

    return {
        "confidence_score": confidence_score,
        "confidence_label": confidence_label(confidence_score),
        "confidence_percent": round(confidence_score * 100, 1),
        "components": {
            "simulation_factor": round(simulation_factor, 4),
            "group_stage_completeness": round(completeness, 4),
            "backtest_calibration": round(calibration_factor, 4),
        },
        "backtest_reference": "2022",
        "backtest_round_of_16_overlap": round(BACKTEST_R16_OVERLAP, 4),
    }
