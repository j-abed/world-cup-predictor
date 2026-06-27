# World Cup Predictor — Frontend

Client-side dashboard for projected bracket, group standings, qualification odds, what-if scenarios, and the 2022 backtest. **Vite + React + TypeScript + Tailwind CSS.** No backend at runtime.

## Data files

All snapshots live in `public/data/` and are fetched at page load. Tournament refreshes commit updated JSON and redeploy via Vercel.

Optional remote URLs via `VITE_*` env vars are documented in `archive/cdn/README.md` if you enable CDN publish later.

| File | Required | Consumed by |
|------|----------|-------------|
| `app_state.json` | Yes | All main tabs (champion, fixtures, field, bracket, groups, qualification) |
| `scenario_app_state.json` | No | What-if tab — hidden gracefully if missing |
| `backtest_2022.json` | No | 2022 tab — hidden gracefully if missing |

`app_state.json` is produced by `scripts/export_web_state.py` → `outputs/web/app_state.json`. Copy into the frontend with:

```bash
npm run refresh-data   # from frontend/
```

Scenario and backtest JSON are copied manually or via `--copy-to-frontend` on their export scripts (see root `README.md`).

## Data contract

Types mirror the Python export in `src/types.ts`. Runtime validation uses Zod in `src/lib/schema.ts` (app state) and `src/lib/backtestSchema.ts` (2022 backtest).

Keep TypeScript types in sync when `src/web_exports.py` changes.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (typically `http://localhost:5173`).

## Refresh baseline data

From repo root:

```bash
uv run python scripts/update_world_cup_data.py --today --run-model --export-web
cd frontend && npm run refresh-data
```

Reload the browser to pick up changes.

## Build and lint

```bash
npm run lint
npm run build      # output → dist/
npm run preview    # serve production build locally
```

## URL state

Tabs and team selection sync to the query string:

- `?tab=bracket` — active tab (`src/lib/tabs.ts` for valid values)
- `?team=BRA` — opens team detail slide-over

Defaults to champion odds with no team selected. Implemented in `src/lib/urlState.ts`.

## Tabs

| ID | Label | Component |
|----|-------|-----------|
| `champion` | Champion odds | `ChampionOdds.tsx` |
| `markets` | Model vs betting markets | `MarketsView.tsx` |
| `fixtures` | Fixtures | `FixturesView.tsx` |
| `field` | Projected R32 field | `ProjectedField.tsx` |
| `bracket` | Knockout bracket | `BracketView.tsx` |
| `groups` | Group standings | `GroupStandings.tsx`, `ThirdPlaceTable.tsx` |
| `qualification` | Qualification odds | `QualificationOdds.tsx` |
| `scenario` | What-if scenarios | `ScenarioView.tsx` |
| `backtest` | 2022 backtest | `BacktestView.tsx` |

Tab labels for mobile/desktop: `TAB_NAV_LABELS` / `TAB_NAV_SHORT_LABELS` in `src/lib/tabs.ts`.

## Project structure

```
src/
  App.tsx                 Layout, tab routing, data loading, URL state
  main.tsx                Entry point
  types.ts                app_state.json TypeScript types
  types/backtest.ts       backtest_2022.json types
  lib/
    data.ts               Fetch + validate JSON snapshots
    schema.ts             Zod schema for app state
    backtestSchema.ts     Zod schema for 2022 backtest
    tabs.ts               Tab IDs and display labels
    urlState.ts           ?tab= and ?team= sync
    documentMeta.ts       Dynamic document.title
    team.ts               Join app_state sections by team code
    bracket.ts            Order bracket rounds for display
    flags.ts              FIFA code → flag-icons code
  components/
    Header.tsx            Hero, coverage stats, data caveats
    TabNav.tsx            Sticky tab bar
    TabErrorBoundary.tsx  Per-tab error recovery
    CoverageBanner.tsx    Match progress banner
    ChampionOdds.tsx      Championship probability leaderboard
    BracketView.tsx       Knockout bracket with round probabilities
    GroupStandings.tsx    Group standings grid
    ThirdPlaceTable.tsx   Third-place ranking
    QualificationOdds.tsx Sortable qualification table
    FixturesView.tsx      Schedule and results
    ProjectedField.tsx    32-team projected knockout field
    ScenarioView.tsx      Baseline vs scenario champion deltas
    BacktestView.tsx      2022 model vs actual comparison
    TeamDetail.tsx        Team slide-over panel
    ProbabilityBar.tsx    Reusable probability bar
    TeamBadge.tsx         Flag + code chip
    UpdatedAtStat.tsx     Relative “updated … ago” timestamp
```

## Country flags

`TeamBadge` uses [flag-icons](https://github.com/lipis/flag-icons) from a **static copy** in `public/vendor/flag-icons/` (not a bundled CSS import — avoids inlining ~450KB of unused flags).

Refresh the vendor copy after a version bump:

```bash
npm install flag-icons@latest
rm -rf public/vendor/flag-icons
mkdir -p public/vendor/flag-icons/css public/vendor/flag-icons/flags
cp node_modules/flag-icons/css/flag-icons.min.css public/vendor/flag-icons/css/
cp -r node_modules/flag-icons/flags/1x1 public/vendor/flag-icons/flags/
```

Team-code mapping: `src/lib/flags.ts` (UK home nations use `gb-eng`, `gb-sct`, etc.).

## Deploy

Production deploys via Vercel on push to `main`. See root `README.md` for Vercel Git vs GitHub Actions setup.

Optional env: `VITE_SITE_URL` for correct Open Graph URLs in `index.html`.
