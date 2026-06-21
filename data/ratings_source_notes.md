# Ratings Source Notes

data/ratings.csv is the canonical model input for team strength.

## Current preferred source

FIFA/Coca-Cola Men's World Ranking points.

FIFA states that the current men's world ranking is determined using an Elo model. The model uses the published ranking points as a strength proxy.

Updater command:

    uv run python scripts/update_ratings_from_fifa.py

## Fallback source

World Football Elo seed snapshot.

Fallback updater command:

    uv run python scripts/update_ratings_from_elo.py

## Important modeling note

The simulator uses rating differences, not absolute ratings.

Switching from the prior Elo seed to FIFA ranking points changes the point scale. After switching sources, the conversion in src/simulator.py may need recalibration:

    rating_to_expected_goal_diff(rating_diff)

## Why not betting odds yet?

Betting odds may be more predictive, but they require a reliable odds source/API, bookmaker normalization, overround removal, market timing rules, and licensing/usage checks. That is better handled as a separate source adapter later.
