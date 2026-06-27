# Data Status

This project uses checked-in CSV files as model inputs.

## Core tournament data

- `data/teams.csv` contains the 48-team field.
- `data/fixtures.csv` contains the group-stage fixture list.
- `data/results.csv` contains completed match results.
- `data/bracket_slots.csv` contains the knockout bracket skeleton.
- `data/third_place_permutations.csv` contains the official 495-case third-place assignment table.
- `data/fair_play.csv` contains conduct/fair-play scores (yellow/red cards aggregated from ESPN when synced).

## Ratings data

- `data/ratings.csv` is the canonical team-strength input used by the simulator.
- The preferred manual updater is:

    uv run python scripts/update_ratings_from_fifa.py

- The current preferred rating source is a checked-in FIFA/Coca-Cola Men's World Ranking points snapshot.
- Post-match updates (optional, used in the refresh pipeline):

    uv run python scripts/update_ratings_from_results.py

- The fallback manual updater is:

    uv run python scripts/update_ratings_from_elo.py

## Modeling notes

Completed match results directly affect:

- group standings
- third-place ranking
- projected Round of 32 field
- official third-place permutation assignment
- qualification probabilities
- round/champion probabilities

Completed match results do not automatically update team ratings unless the refresh pipeline runs with `--update-ratings` or you run `scripts/update_ratings_from_results.py`.

On first run, existing completed matches are recorded in `data/ratings_applied_matches.csv` without retroactive changes. Only newly completed fixtures after that receive Elo-style updates (`K=40`, divisor `400` on the FIFA-point scale).

### Rating → goals calibration

FIFA ranking points use a different scale than the prior Elo seed. Group-stage goal expectations use:

    expected_goal_diff = rating_diff / RATING_POINTS_PER_EXPECTED_GOAL

Default constant: `285.0` in `src/simulator.py` (≈ 100 rating points → 0.35 expected goals).

Recalibrate with:

    uv run python scripts/calibrate_rating_conversion.py

### Knockout resolution model

Group-stage matches can end in draws. Knockout matches in `src/knockout.py` use:

1. Regulation Poisson score (same as group stage)
2. Extra time with `EXTRA_TIME_GOAL_FACTOR = 0.35` of regulation scoring rates
3. Penalty shootout with rating-based advance probability if still tied

### Fair-play / conduct scores

`data/fair_play.csv` columns: `team_id`, `yellow_cards`, `red_cards`, `conduct_score`, `source`.

Rebuild from ESPN match summaries:

    uv run python scripts/update_fair_play_from_espn.py

Conduct score is `-1` per yellow and `-4` per direct red (higher is better for tiebreakers).

## Known limitations

- ESPN card sync depends on summary API availability for each completed match.
- Betting-market odds are not yet integrated.
