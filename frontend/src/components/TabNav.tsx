export const TAB_IDS = [
  "champion",
  "fixtures",
  "field",
  "bracket",
  "groups",
  "qualification",
] as const;

export type TabId = (typeof TAB_IDS)[number];

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "champion", label: "Champion Odds" },
  { id: "fixtures", label: "Fixtures" },
  { id: "field", label: "R32 Field" },
  { id: "bracket", label: "Bracket" },
  { id: "groups", label: "Groups" },
  { id: "qualification", label: "Qualification Odds" },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="glass sticky top-0 z-30 -mx-4 mb-8 flex gap-1 overflow-x-auto rounded-none border-x-0 border-t-0 px-4 py-2 sm:-mx-6 sm:rounded-2xl sm:border sm:px-2 lg:-mx-8">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-accent/15 text-gold"
                : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
