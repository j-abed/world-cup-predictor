import { useEffect, useRef } from "react";
import {
  TAB_IDS,
  TAB_NAV_LABELS,
  TAB_NAV_SHORT_LABELS,
  type TabId,
} from "../lib/tabs";

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  className?: string;
  /** True when the strip is hidden by CSS (desktop) — removes from tab order + AT. */
  visuallyHidden?: boolean;
}

export function TabNav({
  active,
  onChange,
  className = "",
  visuallyHidden = false,
}: TabNavProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visuallyHidden) return;
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active, visuallyHidden]);

  return (
    <nav
      className={`command-tabs sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 ${className}`}
      aria-label="Dashboard sections"
      aria-hidden={visuallyHidden || undefined}
    >
      <div className="command-tabs__track">
        {TAB_IDS.map((id) => {
          const isActive = id === active;

          return (
            <button
              key={id}
              ref={isActive ? activeRef : null}
              type="button"
              tabIndex={visuallyHidden ? -1 : undefined}
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={TAB_NAV_LABELS[id]}
              title={TAB_NAV_LABELS[id]}
              className={`command-tabs__tab${isActive ? " command-tabs__tab--active" : ""}`}
            >
              <span className="command-tabs__label-sm sm:hidden">
                {TAB_NAV_SHORT_LABELS[id]}
              </span>
              <span className="command-tabs__label-lg hidden sm:inline">
                {TAB_NAV_LABELS[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
