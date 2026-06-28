import type { AppState } from "../types";
import { buildPathToFinal } from "./pathToFinal";

export interface InsightContext {
  movement: AppState["movement"];
  pathSteps: ReturnType<typeof buildPathToFinal>;
  focusTeam: string;
  focusCode: string;
}

export function buildInsightContext(
  appState: AppState,
  selectedTeamCode: string | null,
): InsightContext {
  const ranked = [...appState.odds.round].sort(
    (a, b) => b.champion_prob - a.champion_prob,
  );

  const focusCode =
    selectedTeamCode && ranked.some((team) => team.code === selectedTeamCode)
      ? selectedTeamCode
      : (ranked[0]?.code ?? "");

  const focusTeam =
    ranked.find((team) => team.code === focusCode)?.team ?? "—";

  const pathSteps = focusCode
    ? buildPathToFinal(
        focusCode,
        appState.bracket,
        appState.odds.round,
        appState.odds.qualification,
      )
    : [];

  return {
    movement: appState.movement,
    pathSteps,
    focusTeam,
    focusCode,
  };
}
