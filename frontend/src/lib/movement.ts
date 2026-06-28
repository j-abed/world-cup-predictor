import type { Movement, MovementMetric, TopChampionChange } from "../types";

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
): Map<string, TopChampionChange> {
  const map = new Map<string, TopChampionChange>();

  if (!movement?.has_baseline) {
    return map;
  }

  const rows =
    movement.champion_changes?.length
      ? movement.champion_changes
      : movement.top_champion_changes;

  for (const row of rows) {
    map.set(row.code, row);
  }

  return map;
}

/** Two-point series for run-over-run title odds sparkline (previous → current). */
export function championTrendSeries(
  change: TopChampionChange | undefined,
): number[] | null {
  if (!change) {
    return null;
  }

  return [change.previous, change.current];
}
