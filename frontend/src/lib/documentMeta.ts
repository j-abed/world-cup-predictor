import type { TabId } from "./tabs";

const SITE_NAME = "World Cup Predictor";
const DEFAULT_DESCRIPTION =
  "Projected 2026 World Cup bracket, championship odds, group standings, and fixtures — updated from live results and Monte Carlo simulations.";

const TAB_TITLES: Record<TabId, string> = {
  champion: "Champion Odds",
  fixtures: "Fixtures & Results",
  field: "Projected R32 Field",
  bracket: "Knockout Bracket",
  groups: "Group Standings",
  qualification: "Qualification Odds",
  scenario: "What-if Scenarios",
};

export function buildDocumentTitle(tab: TabId, teamName?: string | null): string {
  const tabTitle = TAB_TITLES[tab];

  if (teamName) {
    return `${teamName} — ${tabTitle} | ${SITE_NAME}`;
  }

  return `${tabTitle} | ${SITE_NAME}`;
}

export { DEFAULT_DESCRIPTION, SITE_NAME };
