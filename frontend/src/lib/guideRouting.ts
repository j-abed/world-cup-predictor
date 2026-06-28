const GUIDE_PATHS = new Set(["/guide", "/methodology", "/probability-engine"]);

export type GuideDisplayMode = "standalone" | "embedded";

export function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function isStandaloneGuidePath(pathname?: string): boolean {
  if (typeof window === "undefined" && pathname === undefined) {
    return false;
  }

  const path = normalizePathname(pathname ?? window.location.pathname);
  return GUIDE_PATHS.has(path);
}

export function guideStandalonePath(): string {
  return "/guide";
}

export function dashboardPath(tab?: string, team?: string | null): string {
  const params = new URLSearchParams();

  if (tab && tab !== "champion") {
    params.set("tab", tab);
  }

  if (team) {
    params.set("team", team);
  }

  const search = params.toString();
  return search ? `/?${search}` : "/";
}
