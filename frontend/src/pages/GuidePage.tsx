import { useEffect, useMemo } from "react";
import type { AppState } from "../types";
import { GuideArticle } from "../components/guide/GuideArticle";
import { GuideHero } from "../components/guide/GuideHero";
import { GuideStartHere } from "../components/guide/GuideStartHere";
import { TableOfContents } from "../components/guide/TableOfContents";
import {
  buildGuideExportSnapshot,
  buildGuideHeroStats,
  buildGuideLiveExamples,
  buildGuidePathHighlight,
  resolveModelQualityForGuide,
} from "../lib/guideStats";
import type { GuideDisplayMode } from "../lib/guideRouting";
import { dashboardPath } from "../lib/guideRouting";

interface GuidePageProps {
  appState: AppState;
  mode: GuideDisplayMode;
}

export function GuidePage({ appState, mode }: GuidePageProps) {
  const heroStats = useMemo(() => buildGuideHeroStats(appState), [appState]);
  const snapshot = useMemo(() => buildGuideExportSnapshot(appState), [appState]);
  const live = useMemo(() => buildGuideLiveExamples(appState), [appState]);
  const pathHighlight = useMemo(
    () => buildGuidePathHighlight(appState),
    [appState],
  );
  const sims = appState.metadata.simulations.tournament;

  useEffect(() => {
    document.title = "How the World Cup Probability Engine Works";
  }, []);

  return (
    <div
      className={`guide-page${mode === "embedded" ? " guide-page--embedded" : " guide-page--standalone"}`}
    >
      {mode === "standalone" ? (
        <header className="guide-topbar">
          <a href={dashboardPath()} className="guide-topbar__back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2.5L4.5 7 9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to dashboard
          </a>
        </header>
      ) : null}

      <div className="guide-shell">
        <GuideHero stats={heroStats} lastUpdated={snapshot.exportTimestamp} />

        <p className="guide-disclaimer" role="note">
          This is not betting advice. The probabilities are simulated frequencies,
          not guarantees.
        </p>

        <GuideStartHere />

        <div className="guide-layout">
          <div className="guide-layout__main">
            <GuideArticle
              sims={sims}
              snapshot={snapshot}
              live={live}
              pathHighlight={pathHighlight}
              modelQuality={resolveModelQualityForGuide(appState)}
              dataCaveats={appState.metadata.data_caveats}
            />
          </div>

          <aside className="guide-layout__toc">
            <TableOfContents />
          </aside>
        </div>

        {mode === "embedded" ? (
          <p className="guide-footnote">
            <a href="/guide" className="guide-link">
              Open full-page guide →
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
