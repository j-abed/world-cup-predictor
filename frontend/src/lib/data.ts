import type { AppState } from "../types";
import type { Backtest2022 } from "../types/backtest";
import { parseBacktest2022 } from "./backtestSchema";
import { AppStateLoadError } from "./errors";
import { parseAppState } from "./schema";

const DATA_URL = "/data/app_state.json";
const SCENARIO_DATA_URL = "/data/scenario_app_state.json";
const BACKTEST_DATA_URL = "/data/backtest_2022.json";

export { AppStateLoadError } from "./errors";

export async function loadAppState(): Promise<AppState> {
  let response: Response;

  try {
    response = await fetch(DATA_URL);
  } catch {
    throw new AppStateLoadError(
      `Could not reach ${DATA_URL}. Is the dev server running?`,
    );
  }

  if (!response.ok) {
    throw new AppStateLoadError(
      `${DATA_URL} responded with ${response.status}. Regenerate it with ` +
        "`uv run python scripts/update_world_cup_data.py --today --run-model --export-web` " +
        "and copy it into frontend/public/data/.",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AppStateLoadError(`${DATA_URL} did not contain valid JSON.`);
  }

  try {
    return parseAppState(data);
  } catch {
    throw new AppStateLoadError(
      `${DATA_URL} did not match the expected app state schema. ` +
        "Regenerate it with export_web_state.py and refresh frontend/public/data/.",
    );
  }
}

export async function loadScenarioAppState(): Promise<AppState | null> {
  let response: Response;

  try {
    response = await fetch(SCENARIO_DATA_URL);
  } catch {
    return null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return null;
  }

  try {
    return parseAppState(data);
  } catch {
    return null;
  }
}

export async function loadBacktest2022(): Promise<Backtest2022 | null> {
  let response: Response;

  try {
    response = await fetch(BACKTEST_DATA_URL);
  } catch {
    return null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return null;
  }

  try {
    return parseBacktest2022(data);
  } catch {
    return null;
  }
}
