import { movementMetricLabel } from "./movement";
import type { AppState, ModelQuality } from "../types";

const EMPTY_MODEL_QUALITY: ModelQuality = {
  confidence_score: 0,
  confidence_label: "Unknown",
  confidence_percent: 0,
  components: {
    simulation_factor: 0,
    group_stage_completeness: 0,
    backtest_calibration: 0,
  },
  backtest_reference: "2022",
  backtest_round_of_16_overlap: 0,
};

function resolveModelQuality(state: AppState): ModelQuality {
  return state.model_quality ?? EMPTY_MODEL_QUALITY;
}

export function resolveModelQualityForGuide(state: AppState): ModelQuality {
  return resolveModelQuality(state);
}

export interface GuideHeroStat {
  value: string;
  label: string;
}

export interface GuideExportSnapshot {
  monteCarloRuns: string;
  projectionConfidence: string;
  groupResults: string;
  groupCompletionPercent: string;
  refreshCadence: string;
  exportTimestamp: string;
  nextRefresh: string | null;
  ratingsSource: string;
  ratingsSourceUrl: string | null;
  teamCount: string;
  simDepthComponent: string;
  resultsComponent: string;
  backtestComponent: string;
  confidenceFormulaWeights: {
    sim: number;
    results: number;
    backtest: number;
  };
  modelFavorite: string | null;
  marketFavorite: string | null;
  meanAbsoluteGap: string | null;
  favoritesAgree: boolean | null;
  movementBaseline: string | null;
  biggestMover: string | null;
  liveMatchLabel: string | null;
  liveGroupLabel: string | null;
}

function formatUtcTimestamp(iso: string): string {
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }

  return parsed.toISOString().replace(".000", "").replace("T", " ").replace("Z", " UTC");
}

function formatRefreshHours(hours: number | undefined): string {
  if (!hours) {
    return "—";
  }

  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function buildGuideHeroStats(state: AppState): GuideHeroStat[] {
  const { metadata } = state;
  const modelQuality = resolveModelQuality(state);
  const sims = metadata.simulations.tournament;

  return [
    {
      value: sims > 0 ? sims.toLocaleString() : "—",
      label: "Monte Carlo runs",
    },
    {
      value:
        modelQuality.confidence_percent > 0
          ? `${modelQuality.confidence_percent.toFixed(1)}%`
          : "—",
      label: "Projection confidence",
    },
    {
      value:
        metadata.fixture_count > 0
          ? `${metadata.completed_result_count} / ${metadata.fixture_count}`
          : "—",
      label: "Group results",
    },
    {
      value: formatRefreshHours(metadata.refresh_interval_hours),
      label: "Refresh cadence",
    },
  ];
}

export function buildGuideExportSnapshot(state: AppState): GuideExportSnapshot {
  const { metadata, movement, market_comparison: marketComparison, live_context: liveContext } =
    state;
  const modelQuality = resolveModelQuality(state);

  const completeness =
    metadata.fixture_count > 0
      ? metadata.completed_result_count / metadata.fixture_count
      : 0;

  const weights = modelQuality.component_weights ?? {
    simulation_depth: 0.35,
    group_stage_completeness: 0.35,
    backtest_calibration: 0.30,
  };

  const { components } = modelQuality;
  const topMover = movement?.biggest_movers[0];
  const liveMatch = liveContext?.in_progress_matches[0] ?? liveContext?.next_match;

  let liveMatchLabel: string | null = null;

  if (liveMatch) {
    const score =
      liveMatch.home_score !== null && liveMatch.away_score !== null
        ? `${liveMatch.home_score}–${liveMatch.away_score}`
        : null;
    liveMatchLabel = score
      ? `${liveMatch.home_team} ${score} ${liveMatch.away_team}`
      : `${liveMatch.home_team} vs ${liveMatch.away_team}`;
  }

  let biggestMover: string | null = null;

  if (topMover) {
    const metric = movementMetricLabel(topMover.metric).toLowerCase();
    const sign = topMover.delta >= 0 ? "+" : "";
    biggestMover = `${topMover.team} — ${metric}, ${sign}${(topMover.delta * 100).toFixed(1)} percentage points`;
  }

  return {
    monteCarloRuns:
      metadata.simulations.tournament > 0
        ? metadata.simulations.tournament.toLocaleString()
        : "—",
    projectionConfidence:
      modelQuality.confidence_percent > 0
        ? `${modelQuality.confidence_percent.toFixed(1)}%`
        : "—",
    groupResults:
      metadata.fixture_count > 0
        ? `${metadata.completed_result_count} of ${metadata.fixture_count}`
        : "—",
    groupCompletionPercent:
      metadata.fixture_count > 0 ? `${Math.round(completeness * 100)}%` : "—",
    refreshCadence: metadata.refresh_interval_hours
      ? `approximately every ${formatRefreshHours(metadata.refresh_interval_hours)}`
      : "on the scheduled pipeline cadence",
    exportTimestamp: formatUtcTimestamp(metadata.generated_at),
    nextRefresh: metadata.next_refresh_at
      ? formatUtcTimestamp(metadata.next_refresh_at)
      : null,
    ratingsSource: metadata.ratings_source ?? "—",
    ratingsSourceUrl: metadata.ratings_source_url ?? null,
    teamCount: metadata.team_count > 0 ? String(metadata.team_count) : "—",
    simDepthComponent: `${Math.round(components.simulation_factor * 100)}%`,
    resultsComponent: `${Math.round(components.group_stage_completeness * 100)}%`,
    backtestComponent: `${Math.round(components.backtest_calibration * 100)}%`,
    confidenceFormulaWeights: {
      sim: Math.round(weights.simulation_depth * 100),
      results: Math.round(weights.group_stage_completeness * 100),
      backtest: Math.round(weights.backtest_calibration * 100),
    },
    modelFavorite: marketComparison?.summary?.model_favorite_team ?? null,
    marketFavorite: marketComparison?.summary?.market_favorite_team ?? null,
    meanAbsoluteGap:
      marketComparison?.summary?.mean_absolute_gap !== undefined
        ? `${(marketComparison.summary.mean_absolute_gap * 100).toFixed(1)} percentage points`
        : null,
    favoritesAgree: marketComparison?.summary?.favorites_agree ?? null,
    movementBaseline: movement?.baseline_generated_at
      ? formatUtcTimestamp(movement.baseline_generated_at)
      : null,
    biggestMover,
    liveMatchLabel,
    liveGroupLabel: liveMatch?.group ?? null,
  };
}
