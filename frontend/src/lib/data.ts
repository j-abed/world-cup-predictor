import type { AppState } from "../types";

const DATA_URL = "/data/app_state.json";

export class AppStateLoadError extends Error {}

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

  return (await response.json()) as AppState;
}
