# Data Status

This project uses checked-in CSV files as model inputs.

## Core tournament data

- `data/teams.csv` contains the 48-team field.
- `data/fixtures.csv` contains the group-stage fixture list.
- `data/results.csv` contains completed match results.
- `data/bracket_slots.csv` contains the knockout bracket skeleton.
- `data/third_place_permutations.csv` contains the official 495-case third-place assignment table.
- `data/fair_play.csv` contains conduct/fair-play scores. Current values are placeholders unless updated with card data.

## Ratings data

- `data/ratings.csv` is the canonical team-strength input used by the simulator.
- The preferred updater is:

    uv run python scripts/update_ratings_from_fifa.py

- The current preferred rating source is a checked-in FIFA/Coca-Cola Men's World Ranking points snapshot.
- FIFA ranking points are an official source and FIFA states that the men's ranking is determined using an Elo model.
- The current updater is not a live scrape. It uses a checked-in dictionary so the model remains reproducible.
- The fallback updater is:

    uv run python scripts/update_ratings_from_elo.py

## Modeling notes

Completed match results directly affect:

- group standings
- third-place ranking
- projected Round of 32 field
- official third-place permutation assignment
- qualification probabilities
- round/champion probabilities

Completed match results do not automatically update team ratings unless `data/ratings.csv` is regenerated.

### Rating → goals calibration

FIFA ranking points use a different scale than the prior Elo seed. Group-stage goal expectations use:

    expected_goal_diff = rating_diff / RATING_POINTS_PER_EXPECTED_GOAL

Default constant: `285.0` in `src/simulator.py` (≈ 100 rating points → 0.35 expected goals).

Recalibrate with:

    uv run python scripts/calibrate_rating_conversion.py

Sanity-checks against 2022 group-stage results are embedded in that script; it is not a full historical backtest.

## Known limitations

- Fair-play/conduct scores are placeholders until card data is added.
- Ratings are currently refreshed manually, not from a live API.
- Betting-market odds are not yet integrated.
