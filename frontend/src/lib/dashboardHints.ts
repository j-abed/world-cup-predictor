import type { ModelQuality } from "../types";
import { projectionConfidenceTooltip } from "./projectionConfidence";

export const KPI_HINTS = {
  simulations:
    "Independent Monte Carlo replays of the full tournament. Each run uses the same ratings and fixtures but random match scores.",
  daysToFinal:
    "Calendar days until the scheduled final kickoff. Updates as the knockout bracket progresses.",
  projectionConfidenceFallback:
    "How much to trust this export run — based on simulation depth, results completeness, and 2022 calibration. Not match-pick accuracy.",
} as const;

export function projectionConfidenceHint(modelQuality: ModelQuality): string {
  return projectionConfidenceTooltip(modelQuality);
}

export const TITLE_BOARD_COLUMN_HINTS = {
  Conf: "Simulated chance of advancing from the group stage (reaching the Round of 32).",
  "Title %": "Simulated probability of winning the tournament outright.",
  "Δ Run": "Change in title probability since the previous export snapshot.",
  "Final %": "Simulated probability of reaching the final.",
  "Semi %": "Simulated probability of reaching the semifinals.",
  "Path Diff":
    "Average strength of likely opponents on the projected knockout path. Higher label = tougher draw.",
  Vol: "Round-to-round drop volatility — how sharply survival odds fall across stages. Higher = bumpier projected path.",
  Run: "Direction of title-odds movement vs the last refresh (up, down, or flat).",
} as const;

export type TitleBoardColumn = keyof typeof TITLE_BOARD_COLUMN_HINTS;

export const INSIGHT_RAIL_HINTS = {
  biggestMovers:
    "Teams whose championship, final, or qualification probabilities moved the most since the prior export. Highlights which results shifted the model.",
  pathToFinal:
    "Projected knockout opponents for the focused team, with simulated reach probabilities at each stage.",
} as const;
