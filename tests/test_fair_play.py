from __future__ import annotations

import pandas as pd

from src.fair_play import conduct_score_from_cards, fair_play_penalty


def test_fair_play_penalty_weights_cards() -> None:
    assert fair_play_penalty(yellow_cards=2, red_cards=0) == 2
    assert fair_play_penalty(yellow_cards=1, red_cards=1) == 5


def test_conduct_score_prefers_cleaner_discipline_record() -> None:
    cleaner = conduct_score_from_cards(yellow_cards=0, red_cards=0)
    dirtier = conduct_score_from_cards(yellow_cards=3, red_cards=1)

    assert cleaner > dirtier
