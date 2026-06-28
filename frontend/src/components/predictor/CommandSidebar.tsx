import type { ReactNode } from "react";
import type { TabId } from "../../lib/tabs";

interface NavItem {
  id: TabId;
  label: string;
  icon: ReactNode;
  /** When set the item renders as an anchor tag navigating here instead of switching tabs. */
  href?: string;
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconMarkets() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 12V8l3-4 3 2 4-5 2 3v8H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function IconFixtures() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconField() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconKnockout() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4h4v3H2V4Zm4 5h4v3H6V9Zm4-5h4v3h-4V4Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconGroups() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconQualify() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMethodology() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 2.5h10v11H3V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBacktest() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5v4l2.5 1.5M8 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { id: "champion", label: "Dashboard", icon: <IconDashboard /> },
  { id: "markets", label: "Markets", icon: <IconMarkets /> },
  { id: "fixtures", label: "Fixtures", icon: <IconFixtures /> },
  { id: "field", label: "R32 Field", icon: <IconField /> },
  { id: "bracket", label: "Knockout", icon: <IconKnockout /> },
  { id: "groups", label: "Groups", icon: <IconGroups /> },
  { id: "qualification", label: "Qualify", icon: <IconQualify /> },
  { id: "methodology", label: "Guide", icon: <IconMethodology />, href: "/guide" },
  { id: "backtest", label: "2022", icon: <IconBacktest /> },
];

interface CommandSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /** True when the sidebar is hidden by CSS (mobile) — removes from tab order + AT. */
  visuallyHidden?: boolean;
}

export function CommandSidebar({
  activeTab,
  onTabChange,
  visuallyHidden = false,
}: CommandSidebarProps) {
  return (
    <nav
      className="command-sidebar"
      aria-label="Main navigation"
      aria-hidden={visuallyHidden || undefined}
    >
      <div className="command-sidebar__brand" aria-hidden={visuallyHidden || undefined}>
        <div className="command-sidebar__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="command-sidebar__brand-text">
          <span className="command-sidebar__brand-line">World Cup</span>
          <span className="command-sidebar__brand-year">2026</span>
        </div>
      </div>

      <div className="command-sidebar__nav">
        <ul className="command-sidebar__list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeTab;

            const linkClass = `command-sidebar__link${isActive ? " command-sidebar__link--active" : ""}`;

            return (
              <li key={item.id}>
                {item.href ? (
                  <a
                    href={item.href}
                    tabIndex={visuallyHidden ? -1 : undefined}
                    className={linkClass}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="command-sidebar__link-icon">{item.icon}</span>
                    <span className="command-sidebar__link-label">{item.label}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    tabIndex={visuallyHidden ? -1 : undefined}
                    onClick={() => onTabChange(item.id)}
                    className={linkClass}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="command-sidebar__link-icon">{item.icon}</span>
                    <span className="command-sidebar__link-label">{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
