import type { ReactNode } from "react";
import type {
  GroupCoverage,
  GroupStanding,
  LiveAccuracy,
  LiveContext,
  Metadata,
  ModelQuality,
} from "../../types";
import type { TabId } from "../../lib/tabs";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { MatchdayStatus } from "../MatchdayStatus";
import { TabNav } from "../TabNav";
import { InsightRail } from "../champion/InsightRail";
import type { InsightContext } from "../../lib/insightContext";
import {
  KPI_HINTS,
  projectionConfidenceHint,
} from "../../lib/dashboardHints";
import { HoverHint } from "../HoverHint";
import { CommandSidebar } from "./CommandSidebar";

interface PredictorDashboardProps {
  metadata: Metadata;
  coverage: GroupCoverage[];
  standings: GroupStanding[];
  liveContext?: LiveContext;
  modelQuality?: ModelQuality;
  liveAccuracy?: LiveAccuracy;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSelectTeam?: (code: string) => void;
  insightContext?: InsightContext | null;
  children: ReactNode;
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

function formatUtcClock(iso: string): string {
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes} UTC`;
}

function maxGroupMatchday(standings: GroupStanding[]): number {
  if (standings.length === 0) {
    return 0;
  }

  return standings.reduce((max, row) => Math.max(max, row.played), 0);
}

function PitchBackground() {
  return (
    <div className="pitch-background" aria-hidden>
      <div className="pitch-background__grid" />
      <div className="pitch-background__stripes" />
      <div className="pitch-background__field">
        <div className="pitch-background__halfway" />
        <div className="pitch-background__center-circle" />
        <div className="pitch-background__center-dot" />
        <div className="pitch-background__penalty pitch-background__penalty--left" />
        <div className="pitch-background__penalty pitch-background__penalty--right" />
        <div className="pitch-background__penalty-arc pitch-background__penalty-arc--left" />
        <div className="pitch-background__penalty-arc pitch-background__penalty-arc--right" />
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="live-badge" role="status" aria-live="polite">
      <span className="live-badge__dot" aria-hidden />
      <span className="live-badge__text">Live projections</span>
    </div>
  );
}

interface HeroStatusProps {
  matchday: number;
  completedResults: number;
  fixtureCount: number;
  updatedAt: string;
}

function HeroStatusLine({
  matchday,
  completedResults,
  fixtureCount,
  updatedAt,
}: HeroStatusProps) {
  const matchdayLabel = matchday > 0 ? `Matchday ${matchday}` : "Matchday —";

  return (
    <p className="hero-status-line" aria-label="Model status">
      <span>Updated {updatedAt}</span>
      <span className="hero-status-line__sep" aria-hidden>
        ·
      </span>
      <span>{matchdayLabel}</span>
      <span className="hero-status-line__sep" aria-hidden>
        ·
      </span>
      <span>
        {completedResults}/{fixtureCount} results
      </span>
    </p>
  );
}

interface HeroHeaderProps {
  simulations: number;
  refreshIntervalHours: number;
}

function HeroHeader({
  simulations,
  refreshIntervalHours,
}: HeroHeaderProps) {
  return (
    <div className="hero-header hero-header--compact">
      <p className="hero-header__eyebrow">The 2026 World Cup</p>
      <h1 className="hero-header__engine">PROBABILITY ENGINE</h1>
      <p className="hero-header__tagline">
        {simulations.toLocaleString()} Monte Carlo runs · refreshed every{" "}
        {refreshIntervalHours} {refreshIntervalHours === 1 ? "hour" : "hours"}
      </p>
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}

function KpiTile({ label, value, accent = false, hint }: KpiTileProps) {
  return (
    <div className="kpi-tile">
      {hint ? (
        <HoverHint
          label={label}
          hint={hint}
          compact
          align="start"
          className="kpi-tile__hint"
        />
      ) : (
        <p className="kpi-tile__label">{label}</p>
      )}
      <p
        className={`kpi-tile__value${accent ? " kpi-tile__value--gold" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export function PredictorDashboard({
  metadata,
  coverage,
  standings,
  liveContext = EMPTY_LIVE_CONTEXT,
  modelQuality = EMPTY_MODEL_QUALITY,
  liveAccuracy,
  activeTab,
  onTabChange,
  onSelectTeam,
  insightContext = null,
  children,
}: PredictorDashboardProps) {
  const simulations = metadata.simulations.tournament;
  const refreshHours = metadata.refresh_interval_hours ?? 2;
  const matchday = maxGroupMatchday(standings);
  const confidencePercent = modelQuality.confidence_percent;
  const daysToFinal =
    liveContext.days_to_final > 0 ? String(liveContext.days_to_final) : "—";
  const showInsightRail = activeTab === "champion" && insightContext !== null;

  // Sidebar is only visible at ≥1024px; TabNav is only visible below 1024px.
  // We hide the non-visible nav from the AT and tab order to prevent duplication.
  const isDesktopNav = useMediaQuery("(min-width: 1024px)");

  return (
    <div
      className={`predictor-command-center${showInsightRail ? " predictor-command-center--with-rail" : ""}`}
    >
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <PitchBackground />

      <div className="cockpit-shell">
        <CommandSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          visuallyHidden={!isDesktopNav}
        />

        <div className="cockpit-main">
          <header className="command-shell-header command-shell-header--compact">
            <div className="hero-module hero-module--compact">
              <div className="hero-module__bar">
                <LiveBadge />
                <HeroStatusLine
                  matchday={matchday}
                  completedResults={metadata.completed_result_count}
                  fixtureCount={metadata.fixture_count}
                  updatedAt={formatUtcClock(metadata.generated_at)}
                />
              </div>

              <HeroHeader
                simulations={simulations}
                refreshIntervalHours={refreshHours}
              />

              <div className="kpi-grid kpi-grid--compact">
                <KpiTile
                  label="Simulations"
                  value={simulations.toLocaleString()}
                  hint={KPI_HINTS.simulations}
                />
                <KpiTile
                  label="Proj. confidence"
                  value={
                    confidencePercent > 0
                      ? `${Number(confidencePercent).toFixed(1)}%`
                      : "—"
                  }
                  accent={confidencePercent > 0}
                  hint={
                    confidencePercent > 0
                      ? projectionConfidenceHint(modelQuality)
                      : KPI_HINTS.projectionConfidenceFallback
                  }
                />
                <KpiTile
                  label="Days to final"
                  value={daysToFinal}
                  hint={KPI_HINTS.daysToFinal}
                />
              </div>
            </div>

            <MatchdayStatus
              liveContext={liveContext}
              metadata={metadata}
              coverage={coverage}
            />

            {liveAccuracy?.available && liveAccuracy.summary ? (
              <p className="command-meta-strip">{liveAccuracy.summary}</p>
            ) : null}

            {metadata.ratings_source ? (
              <div className="command-meta-strip command-meta-strip--compact">
                <span>
                  Ratings:{" "}
                  {metadata.ratings_source_url ? (
                    <a
                      href={metadata.ratings_source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-border underline-offset-2 hover:text-gold"
                    >
                      {metadata.ratings_source}
                    </a>
                  ) : (
                    metadata.ratings_source
                  )}
                </span>
              </div>
            ) : null}

            <details className="command-caveats command-caveats--compact">
                <summary className="flex cursor-pointer list-none items-center justify-between text-muted-foreground transition hover:text-foreground">
                  <span>Data caveats &amp; methodology notes</span>
                  <span className="text-muted-foreground/60" aria-hidden>▾</span>
                </summary>
                <p className="mt-2 text-xs">
                  <a
                    href="/guide"
                    className="guide-link guide-link--inline"
                  >
                    How the World Cup Probability Engine Works →
                  </a>
                </p>
                {metadata.data_caveats.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {metadata.data_caveats.map((caveat) => (
                      <li key={caveat} className="flex gap-2">
                        <span className="text-muted-foreground/50">•</span>
                        <span>{caveat}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </details>
          </header>

          <div
            className={`cockpit-workspace${showInsightRail ? " cockpit-workspace--with-rail" : ""}`}
          >
            <TabNav
              active={activeTab}
              onChange={onTabChange}
              className="cockpit-tabs-mobile"
              visuallyHidden={isDesktopNav}
            />
            <main id="main-content" className="command-main command-main--cockpit">
              <div className="command-content-tight">
                <div key={activeTab} className="animate-fade-up">
                  {children}
                </div>
              </div>
            </main>

            {showInsightRail && insightContext ? (
              <aside className="cockpit-rail-right">
                <InsightRail
                  variant="cockpit"
                  movement={insightContext.movement}
                  pathSteps={insightContext.pathSteps}
                  focusTeam={insightContext.focusTeam}
                  focusCode={insightContext.focusCode}
                  onSelectTeam={onSelectTeam}
                />
              </aside>
            ) : null}
          </div>

          <footer className="command-footer command-footer--cockpit">
            <div className="command-footer__inner">
              <p className="command-footer__disclaimer">
                Projections are simulation outputs, not betting odds. See
                methodology notes above.
              </p>
              <p className="command-footer__credit">
                Made with{" "}
                <svg
                  width="12"
                  height="11"
                  viewBox="0 0 12 11"
                  fill="currentColor"
                  aria-hidden
                  className="command-footer__heart"
                >
                  <path d="M6 10.25C5.5 10.25 1 7.15 1 3.75a2.75 2.75 0 0 1 5-1.57A2.75 2.75 0 0 1 11 3.75c0 3.4-4.5 6.5-5 6.5Z" />
                </svg>{" "}
                in NYC
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
