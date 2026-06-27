import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BacktestView } from "./components/BacktestView";
import { BracketView } from "./components/BracketView";
import { ChampionOdds } from "./components/ChampionOdds";
import { FixturesView } from "./components/FixturesView";
import { GroupStandings } from "./components/GroupStandings";
import { Header } from "./components/Header";
import { ProjectedField } from "./components/ProjectedField";
import { MovementSummary } from "./components/MovementSummary";
import { QualificationOdds } from "./components/QualificationOdds";
import { ScenarioView } from "./components/ScenarioView";
import { TabNav } from "./components/TabNav";
import { TabErrorBoundary } from "./components/TabErrorBoundary";
import { TeamDetail } from "./components/TeamDetail";
import { ThirdPlaceTable } from "./components/ThirdPlaceTable";
import { AppStateLoadError, loadAppState, loadBacktest2022, loadScenarioAppState } from "./lib/data";
import { appStateUrl, isRemoteDataUrl } from "./lib/dataUrls";
import { buildDocumentTitle } from "./lib/documentMeta";
import { TAB_LABELS, type TabId } from "./lib/tabs";
import { buildTeamIndex } from "./lib/team";
import { readAppUrlState, writeAppUrlState } from "./lib/urlState";
import type { Backtest2022 } from "./types/backtest";
import type { AppState } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [scenarioState, setScenarioState] = useState<AppState | null>(null);
  const [backtestState, setBacktestState] = useState<Backtest2022 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(
    () => readAppUrlState().tab,
  );
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const urlHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadAppState()
      .then((state) => {
        if (cancelled) return;

        const index = buildTeamIndex(state);
        const { tab, team } = readAppUrlState();

        setAppState(state);
        setActiveTab(tab);
        setSelectedTeamCode(team && index.has(team) ? team : null);
        urlHydratedRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof AppStateLoadError
            ? err.message
            : "Something went wrong loading the prediction data.",
        );
      });

    loadScenarioAppState()
      .then((state) => {
        if (!cancelled) {
          setScenarioState(state);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScenarioState(null);
        }
      });

    loadBacktest2022()
      .then((state) => {
        if (!cancelled) {
          setBacktestState(state);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBacktestState(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const generatedAt = appState?.metadata.generated_at;
    const nextRefreshAt = appState?.metadata.next_refresh_at;

    if (!generatedAt || !nextRefreshAt || !isRemoteDataUrl(appStateUrl())) {
      return;
    }

    const refresh = () => {
      loadAppState({ cacheBust: generatedAt })
        .then(setAppState)
        .catch(() => {
          // Keep showing the last good snapshot if a background refresh fails.
        });
    };

    const nextRefreshMs = new Date(nextRefreshAt).getTime();
    const delay = Math.max(30_000, nextRefreshMs - Date.now() + 5_000);
    const timeoutId = window.setTimeout(refresh, delay);

    return () => window.clearTimeout(timeoutId);
  }, [appState?.metadata.generated_at, appState?.metadata.next_refresh_at]);

  const teamIndex = useMemo(
    () => (appState ? buildTeamIndex(appState) : null),
    [appState],
  );

  useEffect(() => {
    const onPopState = () => {
      const { tab, team } = readAppUrlState();
      setActiveTab(tab);
      setSelectedTeamCode(
        team && teamIndex?.has(team) ? team : null,
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [teamIndex]);

  useEffect(() => {
    if (!urlHydratedRef.current) return;
    writeAppUrlState(activeTab, selectedTeamCode);
  }, [activeTab, selectedTeamCode]);

  useEffect(() => {
    if (!appState || !teamIndex) return;

    const selectedTeam = selectedTeamCode
      ? teamIndex.get(selectedTeamCode) ?? null
      : null;

    document.title = buildDocumentTitle(
      activeTab,
      selectedTeam?.team ?? null,
    );
  }, [appState, teamIndex, activeTab, selectedTeamCode]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const handleSelectTeam = useCallback((code: string) => {
    setSelectedTeamCode(code);
  }, []);

  const handleCloseTeam = useCallback(() => {
    setSelectedTeamCode(null);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 max-w-md">
          <h1 className="text-lg font-semibold text-destructive">
            Couldn&apos;t load prediction data
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!appState || !teamIndex) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm">Loading projections…</p>
        </div>
      </div>
    );
  }

  const selectedTeam = selectedTeamCode
    ? teamIndex.get(selectedTeamCode) ?? null
    : null;

  const tabContent = (() => {
    switch (activeTab) {
      case "champion":
        return (
          <>
            <MovementSummary movement={appState.movement} />
            <ChampionOdds
              round={appState.odds.round}
              movement={appState.movement}
              pathDifficulty={appState.path_difficulty}
              onSelectTeam={handleSelectTeam}
            />
          </>
        );
      case "fixtures":
        return (
          <FixturesView
            fixtures={appState.fixtures}
            onSelectTeam={handleSelectTeam}
          />
        );
      case "field":
        return (
          <ProjectedField
            qualifiers={appState.projected_qualifiers}
            onSelectTeam={handleSelectTeam}
          />
        );
      case "bracket":
        return (
          <BracketView
            bracket={appState.bracket}
            roundOdds={appState.odds.round}
            onSelectTeam={handleSelectTeam}
          />
        );
      case "groups":
        return (
          <div className="flex flex-col gap-10">
            <GroupStandings
              standings={appState.standings}
              thirdPlace={appState.third_place}
              onSelectTeam={handleSelectTeam}
            />
            <ThirdPlaceTable
              thirdPlace={appState.third_place}
              onSelectTeam={handleSelectTeam}
            />
          </div>
        );
      case "qualification":
        return (
          <QualificationOdds
            qualification={appState.odds.qualification}
            onSelectTeam={handleSelectTeam}
          />
        );
      case "scenario":
        return (
          <ScenarioView
            baseline={appState}
            scenario={scenarioState}
            onSelectTeam={handleSelectTeam}
          />
        );
      case "backtest":
        return (
          <BacktestView
            backtest={backtestState}
            onSelectTeam={handleSelectTeam}
            knownTeamCodes={new Set(teamIndex.keys())}
          />
        );
      default: {
        const _exhaustive: never = activeTab;
        return _exhaustive;
      }
    }
  })();

  return (
    <div className="min-h-screen">
      <Header
        metadata={appState.metadata}
        coverage={appState.coverage}
        liveContext={appState.live_context}
        modelQuality={appState.model_quality}
        liveAccuracy={appState.live_accuracy}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <TabNav active={activeTab} onChange={handleTabChange} />

        <TabErrorBoundary key={activeTab} tabLabel={TAB_LABELS[activeTab]}>
          {tabContent}
        </TabErrorBoundary>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Projections are simulation outputs, not betting odds. See the data
        caveats panel above for methodology notes.
      </footer>

      <TeamDetail team={selectedTeam} onClose={handleCloseTeam} />
    </div>
  );
}
