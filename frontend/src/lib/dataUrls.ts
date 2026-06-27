/**
 * Data snapshot URLs. Override with Vite env vars to load JSON from a CDN
 * instead of the committed files in public/data/.
 */
const DEFAULT_APP_STATE_URL = "/data/app_state.json";
const DEFAULT_SCENARIO_URL = "/data/scenario_app_state.json";
const DEFAULT_BACKTEST_URL = "/data/backtest_2022.json";

export function appStateUrl(): string {
  return import.meta.env.VITE_APP_STATE_URL || DEFAULT_APP_STATE_URL;
}

export function scenarioAppStateUrl(): string {
  return import.meta.env.VITE_SCENARIO_APP_STATE_URL || DEFAULT_SCENARIO_URL;
}

export function backtestUrl(): string {
  return import.meta.env.VITE_BACKTEST_URL || DEFAULT_BACKTEST_URL;
}

/** Append a cache-busting query when loading from a remote origin. */
export function withCacheBust(url: string, token?: string): string {
  if (!token || url.startsWith("/")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(token)}`;
}

export function isRemoteDataUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
