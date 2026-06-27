from __future__ import annotations

import math
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.simulator import (
    RATING_POINTS_PER_EXPECTED_GOAL,
    get_match_goal_expectations,
    rating_to_expected_goal_diff,
)


# 2022 World Cup group-stage spot checks (pre-tournament FIFA-style strength proxy).
# Used to sanity-check that implied match margins are in a plausible range.
BENCHMARK_MATCHES = [
    ("ARG", "KSA", 1773, 1580, -1),  # upset: Saudi beat Argentina
    ("BRA", "SRB", 1830, 1540, 2),
    ("ESP", "CRC", 1670, 1460, 7),
    ("JPN", "GER", 1550, 1650, 1),  # upset: Japan beat Germany
    ("FRA", "AUS", 1750, 1530, 3),
    ("MEX", "ARG", 1640, 1773, 0),
]


def poisson_win_probability(home_lambda: float, away_lambda: float) -> float:
    max_goals = 10
    home_win = 0.0

    for home_goals in range(max_goals + 1):
        home_prob = math.exp(-home_lambda) * (home_lambda**home_goals) / math.factorial(
            home_goals
        )

        for away_goals in range(max_goals + 1):
            if home_goals <= away_goals:
                continue

            away_prob = math.exp(-away_lambda) * (away_lambda**away_goals) / math.factorial(
                away_goals
            )
            home_win += home_prob * away_prob

    return home_win


def main() -> None:
    print("Rating conversion calibration")
    print(f"RATING_POINTS_PER_EXPECTED_GOAL = {RATING_POINTS_PER_EXPECTED_GOAL}")
    print(
        f"100-point gap -> {rating_to_expected_goal_diff(100):.3f} expected goals"
    )
    print()

    print("2022 group-stage benchmark checks (sign of favorite edge):")
    print(f"{'match':<12} {'xG diff':>8} {'P(home win)':>12} {'actual margin':>14}")
    print("-" * 52)

    correct_direction = 0

    for home, away, home_rating, away_rating, actual_margin in BENCHMARK_MATCHES:
        lookup = {home: float(home_rating), away: float(away_rating)}
        home_lambda, away_lambda = get_match_goal_expectations(home, away, lookup)
        expected_diff = home_lambda - away_lambda
        home_win_prob = poisson_win_probability(home_lambda, away_lambda)

        predicted_margin_sign = 1 if expected_diff > 0.15 else -1 if expected_diff < -0.15 else 0
        actual_sign = 1 if actual_margin > 0 else -1 if actual_margin < 0 else 0

        if predicted_margin_sign == actual_sign or actual_sign == 0:
            correct_direction += 1

        print(
            f"{home+'-'+away:<12} {expected_diff:>8.2f} {home_win_prob:>12.1%} {actual_margin:>14}"
        )

    print()
    print(f"Directional accuracy: {correct_direction}/{len(BENCHMARK_MATCHES)}")
    print()
    print(
        "Note: this is a sanity check, not a full backtest. "
        "Adjust RATING_POINTS_PER_EXPECTED_GOAL in src/simulator.py if margins look systematically too flat or too steep."
    )


if __name__ == "__main__":
    main()
