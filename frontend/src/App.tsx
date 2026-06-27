import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BracketView } from "./components/BracketView";
import { ChampionOdds } from "./components/ChampionOdds";
import { FixturesView } from "./components/FixturesView";
import { GroupStandings } from "./components/GroupStandings";
import { Header } from "./components/Header";
import { ProjectedField } from "./components/ProjectedField";
import { QualificationOdds } from "./components/QualificationOdds";
import { TabNav, type TabId } from "./components/TabNav";
import { TeamDetail } from "./components/TeamDetail";
import { ThirdPlaceTable } from "./components/ThirdPlaceTable";
import { AppStateLoadError, loadAppState } from "./lib/data";
import { buildTeamIndex } from "./lib/team";
import { buildDocumentTitle } from "./lib/documentMeta";
import { readAppUrlState, writeAppUrlState } from "./lib/urlState";
import type { AppState } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
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
        if (!cancelled) setAppState(state);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof AppStateLoadError
            ? err.message
            : "Something went wrong loading the prediction data.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const teamIndex = useMemo(
    () => (appState ? buildTeamIndex(appState) : null),
    [appState],
  );

  useEffect(() => {
    if (!teamIndex) return;

    const { tab, team } = readAppUrlState();
    setActiveTab(tab);
    setSelectedTeamCode(team && teamIndex.has(team) ? team : null);
    urlHydratedRef.current = true;
  }, [teamIndex]);

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

  return (
    <div className="min-h-screen">
      <Header metadata={appState.metadata} coverage={appState.coverage} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <TabNav active={activeTab} onChange={handleTabChange} />

        {activeTab === "champion" && (
          <ChampionOdds
            round={appState.odds.round}
            onSelectTeam={handleSelectTeam}
          />
        )}

        {activeTab === "fixtures" && (
          <FixturesView
            fixtures={appState.fixtures}
            onSelectTeam={handleSelectTeam}
          />
        )}

        {activeTab === "field" && (
          <ProjectedField
            qualifiers={appState.projected_qualifiers}
            onSelectTeam={handleSelectTeam}
          />
        )}

        {activeTab === "bracket" && (
          <BracketView
            bracket={appState.bracket}
            roundOdds={appState.odds.round}
            onSelectTeam={handleSelectTeam}
          />
        )}

        {activeTab === "groups" && (
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
        )}

        {activeTab === "qualification" && (
          <QualificationOdds
            qualification={appState.odds.qualification}
            onSelectTeam={handleSelectTeam}
          />
        )}
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Projections are simulation outputs, not betting odds. See the data
        caveats panel above for methodology notes.
      </footer>

      <TeamDetail team={selectedTeam} onClose={handleCloseTeam} />
    </div>
  );
}
