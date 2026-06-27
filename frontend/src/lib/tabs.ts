export const TAB_IDS = [
  "champion",
  "fixtures",
  "field",
  "bracket",
  "groups",
  "qualification",
  "scenario",
] as const;

export type TabId = (typeof TAB_IDS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  champion: "Champion odds",
  fixtures: "Fixtures",
  field: "Projected R32 field",
  bracket: "Knockout bracket",
  groups: "Group standings",
  qualification: "Qualification odds",
  scenario: "What-if scenarios",
};

/** Compact labels for the sticky tab bar on narrow viewports. */
export const TAB_NAV_LABELS: Record<TabId, string> = {
  champion: "Champion Odds",
  fixtures: "Fixtures",
  field: "R32 Field",
  bracket: "Knockout",
  groups: "Groups",
  qualification: "Qualify",
  scenario: "What-if",
};

export const TAB_NAV_SHORT_LABELS: Record<TabId, string> = {
  champion: "Champ",
  fixtures: "Fixtures",
  field: "R32",
  bracket: "KO",
  groups: "Groups",
  qualification: "Qual",
  scenario: "Scen",
};

export function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}
