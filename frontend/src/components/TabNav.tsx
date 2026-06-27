import {
  TAB_IDS,
  TAB_NAV_LABELS,
  TAB_NAV_SHORT_LABELS,
  type TabId,
} from "../lib/tabs";

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="glass sticky top-0 z-30 -mx-4 mb-8 flex gap-0.5 overflow-x-auto rounded-none border-x-0 border-t-0 px-2 py-2 sm:-mx-6 sm:gap-1 sm:rounded-2xl sm:border sm:px-2 lg:-mx-8">
      {TAB_IDS.map((id) => {
        const isActive = id === active;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={TAB_NAV_LABELS[id]}
            title={TAB_NAV_LABELS[id]}
            className={`shrink-0 rounded-xl px-2 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isActive
                ? "bg-accent/15 text-gold"
                : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">{TAB_NAV_SHORT_LABELS[id]}</span>
            <span className="hidden sm:inline">{TAB_NAV_LABELS[id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
