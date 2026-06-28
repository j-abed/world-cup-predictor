import type { ModelQuality } from "../types";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function projectionConfidenceSummary(modelQuality: ModelQuality): string {
  const { confidence_label } = modelQuality;
  const projectionTier = modelQuality.projection_tier;
  const tierNote =
    projectionTier === "fast"
      ? " Fast refresh tier — sim depth not included in this score."
      : "";

  return `${confidence_label} projection confidence.${tierNote} Not prediction accuracy.`;
}

export function projectionConfidenceTooltip(modelQuality: ModelQuality): string {
  const { components } = modelQuality;
  const weights = modelQuality.component_weights ?? {
    simulation_depth: 0.2,
    group_stage_completeness: 0.4,
    backtest_calibration: 0.4,
  };
  const roundSimulations = modelQuality.round_simulations;
  const targetSimulations = modelQuality.target_simulations;

  const lines = [
    "How much to trust this projection run — not match pick accuracy.",
    "",
    `Sim depth (${Math.round(weights.simulation_depth * 100)}% weight): ${pct(components.simulation_factor)}${
      roundSimulations && targetSimulations
        ? ` — ${roundSimulations.toLocaleString()} / ${targetSimulations.toLocaleString()} runs`
        : ""
    }`,
    `Results in (${Math.round(weights.group_stage_completeness * 100)}% weight): ${pct(components.group_stage_completeness)}`,
    `2022 calibration (${Math.round(weights.backtest_calibration * 100)}% weight): ${pct(components.backtest_calibration)}`,
  ];

  if (modelQuality.projection_tier === "fast") {
    lines.push("", "Fast tier: sim depth excluded from score.");
  }

  return lines.join("\n");
}

export function projectionConfidenceFactors(modelQuality: ModelQuality): Array<{
  label: string;
  value: string;
}> {
  const { components } = modelQuality;

  return [
    { label: "Sim depth", value: pct(components.simulation_factor) },
    { label: "Results in", value: pct(components.group_stage_completeness) },
    { label: "2022 cal.", value: pct(components.backtest_calibration) },
  ];
}
