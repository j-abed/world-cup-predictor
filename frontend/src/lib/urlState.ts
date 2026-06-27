import { TAB_IDS, type TabId } from "../components/TabNav";

export const DEFAULT_TAB: TabId = "champion";

export interface AppUrlState {
  tab: TabId;
  team: string | null;
}

function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}

export function parseTab(value: string | null): TabId {
  if (value && isTabId(value)) return value;
  return DEFAULT_TAB;
}

export function readAppUrlState(search?: string): AppUrlState {
  const rawSearch =
    search ?? (typeof window !== "undefined" ? window.location.search : "");

  const params = new URLSearchParams(rawSearch);
  const team = params.get("team");

  return {
    tab: parseTab(params.get("tab")),
    team: team ? team.toUpperCase() : null,
  };
}

export function buildAppSearchParams(tab: TabId, team: string | null): string {
  const params = new URLSearchParams();

  if (tab !== DEFAULT_TAB) {
    params.set("tab", tab);
  }

  if (team) {
    params.set("team", team);
  }

  return params.toString();
}

export function appUrlStatesEqual(a: AppUrlState, b: AppUrlState): boolean {
  return a.tab === b.tab && a.team === b.team;
}

export function writeAppUrlState(
  tab: TabId,
  team: string | null,
  options?: { replace?: boolean },
): void {
  if (typeof window === "undefined") return;

  const next: AppUrlState = { tab, team };
  const current = readAppUrlState();

  if (appUrlStatesEqual(current, next)) {
    return;
  }

  const search = buildAppSearchParams(tab, team);
  const url = `${window.location.pathname}${search ? `?${search}` : ""}`;

  if (options?.replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}
