import type { Movement, MovementMetric } from "../types";

export function formatProbabilityDelta(delta: number): string {
  const points = delta * 100;
  const formatted = `${points >= 0 ? "+" : ""}${points.toFixed(1)} pp`;
  return formatted;
}

export function movementMetricLabel(metric: MovementMetric): string {
  switch (metric) {
    case "champion_prob":
      return "Champion";
    case "final_prob":
      return "Final";
    case "qualify_prob":
      return "Qualify";
    default: {
      const exhaustive: never = metric;
      return exhaustive;
    }
  }
}

export function championChangeByCode(
  movement: Movement | null | undefined,
): Map<string, Movement["top_champion_changes"][number]> {
  const map = new Map<string, Movement["top_champion_changes"][number]>();

  if (!movement?.has_baseline) {
    return map;
  }

  for (const row of movement.top_champion_changes) {
    map.set(row.code, row);
  }

  return map;
}
