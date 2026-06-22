import type {
  AppState,
  GroupDProbability,
  GroupStanding,
  ProjectedQualifier,
  QualificationOdds,
  RoundOdds,
  ThirdPlaceEntry,
} from "../types";

export interface TeamProfile {
  code: string;
  team: string;
  group: string | null;
  standing?: GroupStanding;
  thirdPlace?: ThirdPlaceEntry;
  qualifier?: ProjectedQualifier;
  qualificationOdds?: QualificationOdds;
  roundOdds?: RoundOdds;
  groupDOdds?: GroupDProbability;
}

/**
 * Joins every section of app_state.json on team `code` so the UI can show a
 * single team profile regardless of which card/row/bracket-slot was clicked.
 */
export function buildTeamIndex(appState: AppState): Map<string, TeamProfile> {
  const index = new Map<string, TeamProfile>();

  const ensure = (code: string, team: string, group: string | null): TeamProfile => {
    const existing = index.get(code);
    if (existing) return existing;
    const profile: TeamProfile = { code, team, group };
    index.set(code, profile);
    return profile;
  };

  for (const standing of appState.standings) {
    ensure(standing.code, standing.team, standing.group).standing = standing;
  }

  for (const entry of appState.third_place) {
    ensure(entry.code, entry.team, entry.group).thirdPlace = entry;
  }

  for (const qualifier of appState.projected_qualifiers) {
    ensure(qualifier.code, qualifier.team, qualifier.group).qualifier = qualifier;
  }

  for (const odds of appState.odds.qualification) {
    ensure(odds.code, odds.team, odds.group).qualificationOdds = odds;
  }

  for (const odds of appState.odds.round) {
    ensure(odds.code, odds.team, odds.group).roundOdds = odds;
  }

  for (const odds of appState.odds.group_d) {
    const profile = ensure(odds.code, odds.team, "D");
    profile.groupDOdds = odds;
  }

  return index;
}
