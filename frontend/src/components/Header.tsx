import type {
  GroupCoverage,
  LiveAccuracy,
  LiveContext,
  Metadata,
  ModelQuality,
} from "../types";
import { projectionConfidenceTooltip } from "../lib/projectionConfidence";
import { CoverageBanner } from "./CoverageBanner";
import { LiveMatchBanner } from "./LiveMatchBanner";
import { NextRefreshStat } from "./NextRefreshStat";
import { UpdatedAtStat } from "./UpdatedAtStat";

interface HeaderProps {
  metadata: Metadata;
  coverage: GroupCoverage[];
  liveContext?: LiveContext;
  modelQuality?: ModelQuality;
  liveAccuracy?: LiveAccuracy;
}

const EMPTY_LIVE_CONTEXT: LiveContext = {
  days_to_final: 0,
  final_kickoff: "",
  in_progress_matches: [],
  next_match: null,
};

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

export function Header({
  metadata,
  coverage,
  liveContext = EMPTY_LIVE_CONTEXT,
  modelQuality = EMPTY_MODEL_QUALITY,
  liveAccuracy,
}: HeaderProps) {
  const totalSimulations =
    metadata.simulations.tournament + metadata.simulations.round;

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div
        className="pitch-markings pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              World Cup 2026
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              World Cup Predictor
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              A live-updating projected bracket and championship odds,
              simulated from current group results and team ratings.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-6 lg:w-auto">
            <UpdatedAtStat generatedAt={metadata.generated_at} />
            {metadata.next_refresh_at ? (
              <NextRefreshStat nextRefreshAt={metadata.next_refresh_at} />
            ) : null}
            {liveContext.days_to_final > 0 || liveContext.final_kickoff ? (
              <Stat
                label="Days to final"
                value={String(liveContext.days_to_final)}
              />
            ) : null}
            {modelQuality.confidence_percent > 0 ? (
              <Stat
                label="Projection confidence"
                value={`${modelQuality.confidence_percent}%`}
                title={projectionConfidenceTooltip(modelQuality)}
              />
            ) : null}
            <Stat
              label="Results in"
              value={`${metadata.completed_result_count} / ${metadata.fixture_count}`}
            />
            <Stat
              label="Simulations run"
              value={totalSimulations.toLocaleString()}
            />
          </dl>
        </div>

        <LiveMatchBanner liveContext={liveContext} />
        <CoverageBanner metadata={metadata} coverage={coverage} />

        {modelQuality.confidence_percent > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Model confidence: {modelQuality.confidence_label} (
            {modelQuality.confidence_percent}%) — blends simulation depth,{" "}
            {Math.round(modelQuality.components.group_stage_completeness * 100)}%
            group-stage coverage, and 2022 calibration.
          </p>
        ) : null}

        {liveAccuracy?.available && liveAccuracy.summary ? (
          <p className="mt-4 text-xs text-muted-foreground">{liveAccuracy.summary}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {metadata.ratings_source && (
            <span>
              Ratings:{" "}
              {metadata.ratings_source_url ? (
                <a
                  href={metadata.ratings_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border underline-offset-2 hover:text-accent"
                >
                  {metadata.ratings_source}
                </a>
              ) : (
                metadata.ratings_source
              )}
            </span>
          )}
        </div>

        {metadata.data_caveats.length > 0 && (
          <details className="group glass mt-5 rounded-xl open:border-accent/30">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <span>Data caveats &amp; methodology notes</span>
              <span className="text-muted-foreground/60 transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <ul className="space-y-1.5 px-4 pb-4 text-xs text-muted-foreground">
              {metadata.data_caveats.map((caveat) => (
                <li key={caveat} className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  <span>{caveat}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-0.5 font-display text-base font-semibold text-foreground"
        title={title}
      >
        {value}
      </dd>
    </div>
  );
}
