# World Cup Predictor

Monte Carlo simulator and static React dashboard for the **2026 FIFA World Cup** (48 teams, 12 groups). Includes a **2022 historical backtest** and **what-if scenario** mode.

There is no runtime backend. Python generates JSON snapshots; the frontend reads them from `frontend/public/data/`.

## Architecture

```
data/*.csv  →  Python model (src/)  →  outputs/web/*.json  →  frontend/public/data/
                                              ↓
                                    React dashboard (Vite)
```

| Layer | Role |
|-------|------|
| **CSV inputs** | Teams, fixtures, results, ratings, bracket, third-place permutations |
| **Python model** | Standings, tiebreakers, simulations, knockout bracket resolution |
| **JSON exports** | Pre-computed snapshots consumed by the dashboard |
| **React app** | Tabbed UI; validates JSON with Zod on load |

## Dashboard tabs

| Tab | URL param | Data source |
|-----|-----------|-------------|
| Champion odds | `?tab=champion` | `app_state.json` |
| Fixtures | `?tab=fixtures` | `app_state.json` |
| Projected R32 field | `?tab=field` | `app_state.json` |
| Knockout bracket | `?tab=bracket` | `app_state.json` |
| Group standings | `?tab=groups` | `app_state.json` |
| Qualification odds | `?tab=qualification` | `app_state.json` |
| What-if scenarios | `?tab=scenario` | `scenario_app_state.json` (optional) |
| 2022 backtest | `?tab=backtest` | `backtest_2022.json` |

Deep-link a team: `?tab=bracket&team=BRA`

Frontend details: [`frontend/README.md`](frontend/README.md).

## Repository layout

```
data/                  Tournament CSV inputs (+ backtest/2022/ for Qatar replay)
src/                   Core model (simulator, knockout, tiebreakers, exports)
scripts/               CLI helpers (sync, refresh, scenarios, backtest)
outputs/               Generated reports and web JSON (gitignored)
frontend/              Vite + React dashboard
tests/                 pytest suite
.github/workflows/     Refresh, deploy, scenario, CI alert automation
```

### Python modules (`src/`)

| Module | Purpose |
|--------|---------|
| `simulator.py` | Group-stage Monte Carlo, rating → goals |
| `knockout.py` | Knockout bracket sim (ET + penalties); supports `tournament="2022"` |
| `tiebreakers.py` | FIFA group tiebreakers, third-place ranking |
| `bracket.py` | R32 field projection from standings |
| `tournament.py` | Qualification probability orchestration |
| `scenario.py` | What-if overrides on fixture results |
| `backtest_2022.py` | Pre-tournament replay vs actual 2022 outcomes |
| `web_exports.py` | `app_state.json` contract for the frontend |
| `espn_client.py` | ESPN results / card sync |

## Setup

```bash
uv sync
cd frontend && npm install
```

## Run the model

```bash
uv run python main.py
```

CSV/HTML reports land in `outputs/` (gitignored).

## Refresh data and export for the web app

```bash
uv run python scripts/update_world_cup_data.py \
  --today \
  --update-ratings \
  --update-fair-play \
  --run-model \
  --export-web

cd frontend && npm run refresh-data
```

Or use the all-in-one local deploy script:

```bash
./refresh_and_deploy.sh
```

That syncs ESPN results, updates ratings and fair-play data, runs the model, copies JSON into the frontend, and deploys to Vercel via the CLI.

## Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/update_world_cup_data.py` | Orchestrator: ESPN sync → optional ratings/fair-play → model → web export |
| `scripts/sync_results_from_espn.py` | Pull completed scores into `data/results.csv` |
| `scripts/export_web_state.py` | Write `outputs/web/app_state.json` (+ split files) |
| `scripts/run_scenario.py` | What-if sim → `scenario_app_state.json` |
| `scripts/generate_backtest_2022_data.py` | Build `data/backtest/2022/*.csv` |
| `scripts/export_backtest_2022.py` | Pre-tournament 2022 replay → `backtest_2022.json` |
| `scripts/update_ratings_from_fifa.py` | Refresh `data/ratings.csv` from FIFA points snapshot |
| `scripts/update_ratings_from_results.py` | Post-match Elo-style rating updates |
| `scripts/update_fair_play_from_espn.py` | Rebuild `data/fair_play.csv` from card data |
| `scripts/calibrate_rating_conversion.py` | Tune rating → expected goals constant |
| `scripts/add_result.py` | Manually append one result row |
| `refresh_and_deploy.sh` | Full local refresh + Vercel CLI deploy |
| `scripts/publish_web_data.sh` | Upload `app_state.json` to S3/R2 (optional CDN publish) |

Common flags for `update_world_cup_data.py`: `--today`, `--date YYYY-MM-DD`, `--start-date` / `--end-date`, `--force`, `--dry-run`, `--skip-sync`, `--run-model`, `--export-web`, `--update-ratings`, `--update-fair-play`.

## JSON on CDN (optional)

By default the dashboard reads committed snapshots from `frontend/public/data/`. For faster data refresh without a full frontend redeploy:

1. **Host** `app_state.json` on a public bucket (Cloudflare R2, S3, etc.).
2. **Point the frontend** at the remote URL via Vercel env:
   - `VITE_APP_STATE_URL` = `https://your-cdn.example.com/app_state.json`
3. **Publish after export** (local or CI):

```bash
export WEB_DATA_S3_URI=s3://your-bucket/world-cup-predictor
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_ENDPOINT_URL=https://...   # R2 only
./scripts/publish_web_data.sh
```

When `VITE_APP_STATE_URL` is set, the app auto-refreshes after each scheduled `next_refresh_at` without reloading the page.

Optional GitHub secrets for automated publish in `refresh-data.yml`:

- `WEB_DATA_S3_URI`
- `WEB_DATA_ACCESS_KEY_ID`
- `WEB_DATA_SECRET_ACCESS_KEY`
- `WEB_DATA_AWS_REGION`
- `WEB_DATA_AWS_ENDPOINT_URL` (R2)

See `frontend/.env.example` for all `VITE_*` data URL overrides.

## What-if scenarios

Override fixture results and rerun Monte Carlo odds without touching live data:

```bash
uv run python scripts/run_scenario.py \
  --override MATCH_ID:HOME:AWAY \
  --simulations 5000 \
  --copy-to-frontend
```

Example (`66456904` is a **match ID**, not a simulation count):

```bash
uv run python scripts/run_scenario.py \
  --override 66456904:3:0 \
  --copy-to-frontend
```

The **What-if** tab compares `scenario_app_state.json` against the baseline when both are deployed. GitHub Actions can run scenarios manually via `.github/workflows/scenario.yml`.

## 2022 historical backtest

Replay Qatar 2022 with pre-tournament FIFA ratings and no group results:

```bash
uv run python scripts/generate_backtest_2022_data.py
uv run python scripts/export_backtest_2022.py --simulations 5000 --copy-to-frontend
```

The **2022** tab reads `frontend/public/data/backtest_2022.json`. Uses a 16-team Round of 16 knockout path (`tournament="2022"` in `knockout.py`).

## Tests

```bash
uv sync --group dev
uv run pytest

# Full verify before shipping
uv run pytest && cd frontend && npm run lint && npm run build
```

## Automation

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `refresh-data.yml` | Every 2h (Jun 11–Jul 20, 2026 UTC) + manual | Sync ESPN → ratings → fair-play → model → export → pytest → commit |
| `deploy-frontend.yml` | Push to `main` (frontend/data paths) | Build and deploy to Vercel |
| `scenario.yml` | Manual dispatch | Run a what-if scenario and commit `scenario_app_state.json` |
| `ci-failure-alert.yml` | Failed refresh/deploy/scenario runs | Open or comment on a `ci-failure` GitHub issue |

Manual refresh trigger:

```bash
gh workflow run refresh-data.yml && gh run watch
```

## Deploy

### Vercel Git auto-deploy (recommended)

1. Open [vercel.com/new](https://vercel.com/new) → **Import** this repo
2. Set **Root Directory** to `frontend`
3. **Framework Preset:** Vite
4. Optional env var for social preview URLs: `VITE_SITE_URL` = production URL
5. Every push to `main` auto-deploys (including data commits from GitHub Actions)

CLI deploy from `frontend/`:

```bash
cd frontend && npx vercel --prod
```

### GitHub Actions deploy (alternative)

Configure repository secrets once; pushes touching `frontend/` or `data/` deploy via `deploy-frontend.yml`:

```bash
./scripts/setup_github_vercel_secrets.sh --trigger-deploy
```

Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. See script help for `--dry-run` and manual token options.

## Documentation

| Doc | Contents |
|-----|----------|
| [`PLAN.md`](PLAN.md) | Phased roadmap and burn-down checklist |
| [`DATA_STATUS.md`](DATA_STATUS.md) | CSV inputs, ratings, knockout model, limitations |
| [`data/ratings_source_notes.md`](data/ratings_source_notes.md) | FIFA vs Elo rating sources |
| [`frontend/README.md`](frontend/README.md) | Frontend dev, JSON contract, component map |

## Capabilities (model)

- FIFA-style group tiebreakers and third-place ranking
- Official 495-case third-place → R32 assignment table
- Monte Carlo qualification and knockout-round probabilities
- Extra time and penalty shootout modeling in knockouts
- Post-match rating updates and ESPN fair-play card sync
- CSV/HTML reports and web-ready JSON exports
