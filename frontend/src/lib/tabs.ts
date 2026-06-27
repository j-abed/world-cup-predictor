export const TAB_IDS = [
  "champion",
  "fixtures",
  "field",
  "bracket",
  "groups",
  "qualification",
] as const;

export type TabId = (typeof TAB_IDS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  champion: "Champion odds",
  fixtures: "Fixtures",
  field: "Projected R32 field",
  bracket: "Knockout bracket",
  groups: "Group standings",
  qualification: "Qualification odds",
};

export function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}
