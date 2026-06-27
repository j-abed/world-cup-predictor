from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from src.knockout import (
    advance_knockout_match,
    rating_knockout_advance_probability,
    simulate_penalty_shootout,
)
from src.simulator import build_rating_lookup


@pytest.fixture
def rating_lookup() -> dict[str, float]:
    ratings = pd.DataFrame(
        [
            {"team_id": "team_a", "rating": 1800.0},
            {"team_id": "team_b", "rating": 1600.0},
        ]
    )
    return build_rating_lookup(ratings)


def test_advance_knockout_match_always_returns_a_participant(
    rating_lookup: dict[str, float],
) -> None:
    rng = np.random.default_rng(0)

    for _ in range(200):
        winner = advance_knockout_match(
            team_a="team_a",
            team_b="team_b",
            rating_lookup=rating_lookup,
            rng=rng,
        )
        assert winner in {"team_a", "team_b"}


def test_rating_knockout_advance_probability_favors_stronger_team(
    rating_lookup: dict[str, float],
) -> None:
    probability = rating_knockout_advance_probability(
        "team_a", "team_b", rating_lookup
    )

    assert probability > 0.5


def test_simulate_penalty_shootout_favors_stronger_team_over_many_trials(
    rating_lookup: dict[str, float],
) -> None:
    rng = np.random.default_rng(1)
    wins = sum(
        simulate_penalty_shootout("team_a", "team_b", rating_lookup, rng)
        == "team_a"
        for _ in range(500)
    )

    assert wins > 250
