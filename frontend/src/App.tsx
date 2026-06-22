import { useEffect, useMemo, useState } from "react";
import { BracketView } from "./components/BracketView";
import { ChampionOdds } from "./components/ChampionOdds";
import { GroupStandings } from "./components/GroupStandings";
import { Header } from "./components/Header";
import { QualificationOdds } from "./components/QualificationOdds";
import { TeamDetail } from "./components/TeamDetail";
import { ThirdPlaceTable } from "./components/ThirdPlaceTable";
import { AppStateLoadError, loadAppState } from "./lib/data";
import { buildTeamIndex } from "./lib/team";
import type { AppState } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pitch-950 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-crimson-500/40 bg-crimson-500/10 p-6">
          <h1 className="font-display text-lg font-semibold text-crimson-400">
            Couldn&apos;t load prediction data
          </h1>
          <p className="mt-2 text-sm text-pitch-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!appState || !teamIndex) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pitch-950">
        <div className="flex flex-col items-center gap-3 text-pitch-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pitch-700 border-t-gold-400" />
          <p className="text-sm">Loading projections…</p>
        </div>
      </div>
    );
  }

  const selectedTeam = selectedTeamCode
    ? teamIndex.get(selectedTeamCode) ?? null
    : null;

  return (
    <div className="min-h-screen bg-pitch-950">
      <Header metadata={appState.metadata} />

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ChampionOdds
          round={appState.odds.round}
          onSelectTeam={setSelectedTeamCode}
        />

        <BracketView
          bracket={appState.bracket}
          onSelectTeam={setSelectedTeamCode}
        />

        <GroupStandings
          standings={appState.standings}
          thirdPlace={appState.third_place}
          onSelectTeam={setSelectedTeamCode}
        />

        <ThirdPlaceTable
          thirdPlace={appState.third_place}
          onSelectTeam={setSelectedTeamCode}
        />

        <QualificationOdds
          qualification={appState.odds.qualification}
          onSelectTeam={setSelectedTeamCode}
        />
      </main>

      <footer className="border-t border-pitch-800 px-4 py-6 text-center text-xs text-pitch-500">
        Projections are simulation outputs, not betting odds. See the data
        caveats panel above for methodology notes.
      </footer>

      <TeamDetail team={selectedTeam} onClose={() => setSelectedTeamCode(null)} />
    </div>
  );
}
