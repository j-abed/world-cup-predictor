# World Cup Predictor — Frontend

A client-side dashboard for the projected bracket, group standings, and
simulated championship odds. Vite + React + TypeScript + Tailwind CSS. No
backend server is required — the app reads a static JSON snapshot.

## Data contract

The app renders `public/data/app_state.json`, a copy of
`outputs/web/app_state.json` produced by the Python backend
(`src/web_exports.py`). It is **not** fetched from the backend at runtime —
it's a committed snapshot so the app runs standalone. See `src/types.ts` for
the full TypeScript shape of the contract.

## Run locally

```sh
cd frontend
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Refresh the data

Whenever group results, the bracket, or the simulated odds change, regenerate
the backend output and copy it into the frontend:

```sh
# from the repo root
uv run python scripts/update_world_cup_data.py --today --run-model --export-web

# from frontend/
npm run refresh-data
```

`npm run refresh-data` copies `../outputs/web/app_state.json` to
`public/data/app_state.json`. Restart `npm run dev` (or just reload the page)
to pick up the new snapshot.

## Build

```sh
npm run build
```

Output goes to `frontend/dist/` and can be served as static files from
anywhere (no server-side logic required).

## Project structure

```
src/
  App.tsx               Top-level layout and data loading
  types.ts               TypeScript types mirroring app_state.json
  lib/
    data.ts               Fetches and validates app_state.json
    bracket.ts             Orders bracket rounds so adjacent matches pair up
    team.ts                 Joins every section of app_state.json by team code
  components/
    Header.tsx              Hero, key stats, data caveats
    ChampionOdds.tsx          Champion-odds leaderboard (visual centerpiece)
    BracketView.tsx           Projected knockout bracket (visual centerpiece)
    GroupStandings.tsx        Group-by-group standings cards
    ThirdPlaceTable.tsx       Third-place ranking table
    QualificationOdds.tsx     Sortable/filterable qualification-odds table
    TeamDetail.tsx             Slide-over panel with a team's full profile
    ProbabilityBar.tsx        Reusable animated probability bar
    TeamBadge.tsx              Reusable team-code chip
```
