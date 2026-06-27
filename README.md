# World Cup Predictor

A Python Monte Carlo simulator and static React dashboard for the 2026 FIFA World Cup (48 teams, 12 groups).

## Architecture

```
data/*.csv  →  Python model  →  outputs/web/app_state.json  →  React dashboard
```

There is no runtime backend. The frontend reads a pre-generated JSON snapshot from `frontend/public/data/app_state.json`.

## Capabilities

- Loads teams, fixtures, results, and ratings from CSV files
- Calculates current standings for all 12 groups with FIFA-style tiebreakers
- Ranks third-place teams and projects the 32-team knockout field
- Assigns third-place teams to Round of 32 slots using the **official 495-case permutation table** (`data/third_place_permutations.csv`)
- Runs Monte Carlo simulations for qualification and knockout-round probabilities
- Exports CSV/HTML reports and web-ready JSON

## Setup

```bash
uv sync
cd frontend && npm install
```

## Run the model

```bash
uv run python main.py
```

Outputs land in `outputs/` (gitignored).

## Refresh data and export for the web app

```bash
uv run python scripts/update_world_cup_data.py --today --run-model --export-web
cd frontend && npm run refresh-data
```

Or use the all-in-one deploy script:

```bash
./refresh_and_deploy.sh
```

That script syncs ESPN results, runs the model, copies JSON into the frontend, and deploys to Vercel.

## Frontend

See `frontend/README.md` for dev server setup. Quick start:

```bash
cd frontend
npm run dev
```

## Tests

```bash
uv sync --group dev
uv run pytest
```

## Automation

GitHub Actions workflow `.github/workflows/refresh-data.yml` syncs ESPN results, reruns the model, and commits updated data during the tournament (Jun 11 – Jul 20, 2026). Connect the repo to Vercel for auto-deploy on push.

## Data notes

See `DATA_STATUS.md` for ratings sources, fair-play placeholders, and modeling limitations.

## Improvement plan

See `PLAN.md` for the phased roadmap.
