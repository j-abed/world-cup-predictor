import { useEffect, useMemo } from "react";
import type { AppState } from "../types";
import { GuideArticle } from "../components/guide/GuideArticle";
import { GuideHero } from "../components/guide/GuideHero";
import { TableOfContents } from "../components/guide/TableOfContents";
import {
  buildGuideExportSnapshot,
  buildGuideHeroStats,
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
            ← Back to dashboard
          </a>
        </header>
      ) : null}

      <div className="guide-shell">
        <GuideHero stats={heroStats} />

        <p className="guide-disclaimer" role="note">
          This is not betting advice. The probabilities are simulated frequencies,
          not guarantees.
        </p>

        <div className="guide-layout">
          <aside className="guide-layout__toc">
            <TableOfContents />
          </aside>

          <div className="guide-layout__main">
            <GuideArticle
              sims={sims}
              snapshot={snapshot}
              modelQuality={resolveModelQualityForGuide(appState)}
              dataCaveats={appState.metadata.data_caveats}
            />
          </div>
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
