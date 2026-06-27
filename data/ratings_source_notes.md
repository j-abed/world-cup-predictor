# Ratings Source Notes

`data/ratings.csv` is the canonical model input for team strength.

## Current preferred source

**FIFA/Coca-Cola Men's World Ranking points.**

FIFA publishes ranking points derived from an Elo-style model. This project uses those points as a strength proxy.

```bash
uv run python scripts/update_ratings_from_fifa.py
```

## Post-match updates

During the tournament, the refresh pipeline can apply incremental Elo-style updates on the FIFA-point scale:

```bash
uv run python scripts/update_ratings_from_results.py
```

Tracked in `data/ratings_applied_matches.csv` so each completed match is only applied once.

## Fallback source

World Football Elo seed snapshot (manual/offline use):

```bash
uv run python scripts/update_ratings_from_elo.py
```

## Modeling note

The simulator uses **rating differences**, not absolute ratings.

Switching from Elo seed to FIFA points changes the scale. After a source change, recalibrate the conversion in `src/simulator.py`:

```python
rating_to_expected_goal_diff(rating_diff)
```

Run `uv run python scripts/calibrate_rating_conversion.py` to tune `RATING_POINTS_PER_EXPECTED_GOAL`.

## Why not betting odds yet?

Betting odds may be more predictive, but integration needs a reliable odds API, bookmaker normalization, overround removal, market timing rules, and licensing review. Planned as a separate adapter (see `PLAN.md` Phase 5).
