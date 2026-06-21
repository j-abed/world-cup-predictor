# Data Status

## Match and fixture data

The app currently uses checked-in CSV files under `data/`:

- `teams.csv`
- `fixtures.csv`
- `results.csv`
- `ratings.csv`
- `bracket_slots.csv`

These files are manually maintained. The app does not currently fetch live scores, fixtures, injuries, odds, or squad data.

## Ratings

`data/ratings.csv` uses a checked-in World Football Elo-style seed snapshot.

This is intended to replace the original manually invented placeholder ratings with a more realistic national-team strength baseline.

Current rating limitations:

- Not an official FIFA ranking table
- Not a live scrape
- Not betting-market implied odds
- Not adjusted automatically for injuries, lineups, rest, travel, or current tournament form
- Should be refreshed manually when the rating source is updated

## Prediction model

The current model uses:

1. Completed match results from `data/results.csv`
2. Elo-style team ratings from `data/ratings.csv`
3. A Poisson scoring model for remaining matches
4. A rating-weighted tiebreaker for drawn knockout matches
5. A generic sequential knockout bracket for round-by-round simulation

## Known limitations

The engine is mechanically complete but not yet fully tournament-accurate.

Outstanding accuracy work:

1. Replace the generic knockout bracket with the official full Round of 32 bracket mapping
2. Add the official third-place permutation mapping
3. Implement full FIFA group-stage tiebreakers
4. Improve the rating model with market odds or a blended rating source
5. Add an automated data update path for results and fixtures
