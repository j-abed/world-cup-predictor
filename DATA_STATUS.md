# Data Status

This project uses checked-in CSV files as model inputs and committed JSON snapshots for the dashboard.

## Core tournament data (2026)

| File | Description |
|------|-------------|
| `data/teams.csv` | 48-team field with group assignments |
| `data/fixtures.csv` | Group-stage and knockout fixture list |
| `data/results.csv` | Completed match results (ESPN sync or manual) |
| `data/ratings.csv` | Canonical team-strength input |
| `data/bracket_slots.csv` | Knockout bracket skeleton (R32 → final) |
| `data/third_place_permutations.csv` | Official 495-case third-place → R32 table |
| `data/fair_play.csv` | Conduct scores (yellow/red cards from ESPN when synced) |
| `data/market_odds.csv` | Outright winner odds for model vs market comparison |
| `data/ratings_applied_matches.csv` | Tracks which results already updated ratings |

## 2022 backtest pack

Separate dataset under `data/backtest/2022/` for the historical replay (32 teams, groups A–H, 16-team knockout):

| File | Description |
|------|-------------|
| `teams.csv`, `fixtures.csv`, `results.csv` | Qatar 2022 field and actual outcomes |
| `ratings.csv` | FIFA points snapshot as of 2022-10-31 |
| `bracket_slots.csv` | 2022 R16 bracket (match IDs 49–64) |

Regenerate with `scripts/generate_backtest_2022_data.py`.

## Web JSON snapshots

| File | Producer | Purpose |
|------|----------|---------|
| `outputs/web/app_state.json` | `scripts/export_web_state.py` | Live 2026 dashboard baseline |
| `outputs/web/backtest_2022.json` | `scripts/export_backtest_2022.py` | 2022 backtest tab |
| `frontend/public/data/*.json` | Copied from `outputs/web/` or export `--copy-to-frontend` | Committed snapshots for static hosting |

Scenario output (`scenario_app_state.json`) uses the same shape as `app_state.json` with optional `metadata.scenario` overrides.

### Run-over-run movement (`movement`)

Exported in `app_state.json` when `export_web_state` runs:

| Field | Description |
|-------|-------------|
| `has_baseline` | Whether a prior snapshot was available |
| `baseline_generated_at` | Timestamp of the comparison snapshot |
| `biggest_movers` | Teams with largest absolute change across champion/final/qualify probs |
| `top_champion_changes` | Top 3 current title favorites with champion-prob delta |

Baseline resolution order: `outputs/web/movement_snapshot.json` → `--baseline-path` (default: committed frontend app state) → existing `outputs/web/app_state.json`.

After each export, `movement_snapshot.json` is rewritten for the next local run.
## Ratings data

- **Preferred updater:** `uv run python scripts/update_ratings_from_fifa.py`
- **Source:** checked-in FIFA/Coca-Cola Men's World Ranking points snapshot
- **Post-match updates** (refresh pipeline): `uv run python scripts/update_ratings_from_results.py`
- **Fallback manual seed:** `uv run python scripts/update_ratings_from_elo.py`

See [`data/ratings_source_notes.md`](data/ratings_source_notes.md) for source rationale.

## What completed results affect

- Group standings and third-place ranking
- Projected Round of 32 field and third-place permutation assignment
- Qualification and knockout-round probabilities in exports

Completed results **do not** update team ratings unless the refresh pipeline runs with `--update-ratings` or you run `update_ratings_from_results.py` directly.

On first run, existing completed matches are recorded in `ratings_applied_matches.csv` without retroactive changes. Only newly completed fixtures after that receive Elo-style updates (`K=40`, divisor `400` on the FIFA-point scale).

## Rating → goals calibration

FIFA ranking points use a different scale than the prior Elo seed. Group-stage goal expectations:

```
expected_goal_diff = rating_diff / RATING_POINTS_PER_EXPECTED_GOAL
```

Default: `285.0` in `src/simulator.py` (≈ 100 rating points → 0.35 expected goals).

Recalibrate: `uv run python scripts/calibrate_rating_conversion.py`

## Knockout resolution model

Group-stage matches can end in draws. Knockout matches in `src/knockout.py`:

1. Regulation Poisson score (same as group stage)
2. Extra time with `EXTRA_TIME_GOAL_FACTOR = 0.35` of regulation scoring rates
3. Penalty shootout with rating-based advance probability if still tied

The 2022 backtest uses `tournament="2022"` (top two per group → R16, no third-place permutations).

## Fair-play / conduct scores

`data/fair_play.csv` columns: `team_id`, `yellow_cards`, `red_cards`, `conduct_score`, `source`.

Rebuild from ESPN match summaries:

```bash
uv run python scripts/update_fair_play_from_espn.py
```

Conduct score: `-1` per yellow, `-4` per direct red (higher is better for tiebreakers).

## Market odds

`data/market_odds.csv` columns: `code`, `team`, `decimal_odds`, `implied_prob`, `source`, `as_of`.

Refresh from [The Odds API](https://the-odds-api.com/) when `ODDS_API_KEY` is set; otherwise the refresh pipeline keeps the checked-in CSV (or writes a seed snapshot on first run).

```bash
uv run python scripts/update_market_odds.py
```

Exported in `app_state.json` as `market_comparison` for the **Markets vs model** tab.

## Known limitations

- ESPN card sync depends on summary API availability per completed match.
- Market odds are outright-winner snapshots only (not live in-play prices).
- What-if scenarios require a separate export/deploy of `scenario_app_state.json`.
- The 2022 backtest replays the **current** simulator logic on 2022 data — not a frozen 2022-era model.

## Planned dashboard metrics (Phase 6)

Not yet in `app_state.json`. See `PLAN.md` Phase 6 for the export contract and build order.

| Metric | Captured today? | Notes |
|--------|-----------------|-------|
| Model confidence / accuracy | No | Backtest overlap exists offline only |
| Path difficulty (top 3) | No | Derivable from bracket + ratings |
| Days to final | No | Need final kickoff constant or knockout fixtures |
| Live / next match | Partial | Fixtures have kickoff; status is Complete/Scheduled only |
| Biggest movers | Yes | `movement.biggest_movers` vs prior export or committed app state |
| Top 3 % change | Yes | `movement.top_champion_changes` on champion tab podium |
| Time until next run | Yes | `metadata.next_refresh_at` aligned to 2h UTC cron |

All Phase 6 fields export from `scripts/export_web_state.py`. See `data/tournament_schedule.json` for final kickoff and refresh interval.

### Model confidence formula

`confidence_score = 0.35 × simulation_factor + 0.35 × group_stage_completeness + 0.30 × backtest_calibration`

- **simulation_factor** — `round_simulations / 10_000` (capped at 1)
- **group_stage_completeness** — completed group results / total fixtures
- **backtest_calibration** — blend of 2022 R16 overlap (12/16) and champion-in-top-5 prior

Implemented in `src/model_quality.py`.

### Live accuracy

`live_accuracy` mirrors the 2022 backtest round-overlap logic. Returns `available: false` until knockout-stage results appear in fixtures/results CSVs.