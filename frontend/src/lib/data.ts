import type { AppState } from "../types";
import type { Backtest2022 } from "../types/backtest";
import {
  appStateUrl,
  backtestUrl,
  isRemoteDataUrl,
  scenarioAppStateUrl,
  withCacheBust,
} from "./dataUrls";
import { parseBacktest2022 } from "./backtestSchema";
import { AppStateLoadError } from "./errors";
import { parseAppState } from "./schema";

export { AppStateLoadError } from "./errors";

async function fetchJson(url: string): Promise<{ data: unknown; response: Response }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new AppStateLoadError(`${url} responded with ${response.status}.`);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AppStateLoadError(`${url} did not contain valid JSON.`);
  }

  return { data, response };
}

export async function loadAppState(options?: {
  cacheBust?: string;
}): Promise<AppState> {
  const baseUrl = appStateUrl();
  const url = withCacheBust(baseUrl, options?.cacheBust);

  let data: unknown;

  try {
    ({ data } = await fetchJson(url));
  } catch (error) {
    if (error instanceof AppStateLoadError) {
      if (isRemoteDataUrl(baseUrl)) {
        throw error;
      }

      throw new AppStateLoadError(
        `${error.message} Regenerate it with ` +
          "`uv run python scripts/update_world_cup_data.py --today --run-model --export-web` " +
          "and copy it into frontend/public/data/.",
      );
    }

    throw new AppStateLoadError(
      `Could not reach ${url}. Is the dev server running?`,
    );
  }

  try {
    return parseAppState(data);
  } catch {
    throw new AppStateLoadError(
      `${url} did not match the expected app state schema. ` +
        "Regenerate it with export_web_state.py and refresh frontend/public/data/.",
    );
  }
}

async function fetchOptionalJson(url: string): Promise<unknown | null> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (response.status === 404 || !response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function loadScenarioAppState(): Promise<AppState | null> {
  const data = await fetchOptionalJson(scenarioAppStateUrl());

  if (data === null) {
    return null;
  }

  try {
    return parseAppState(data);
  } catch {
    return null;
  }
}

export async function loadBacktest2022(): Promise<Backtest2022 | null> {
  const data = await fetchOptionalJson(backtestUrl());

  if (data === null) {
    return null;
  }

  try {
    return parseBacktest2022(data);
  } catch {
    return null;
  }
}
