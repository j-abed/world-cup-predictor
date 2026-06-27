from __future__ import annotations

YELLOW_CARD_PENALTY = 1
RED_CARD_PENALTY = 4


def fair_play_penalty(yellow_cards: int, red_cards: int) -> int:
    return yellow_cards * YELLOW_CARD_PENALTY + red_cards * RED_CARD_PENALTY


def conduct_score_from_cards(yellow_cards: int, red_cards: int) -> float:
    """Higher conduct scores are better for FIFA tiebreakers."""
    return float(-fair_play_penalty(yellow_cards, red_cards))
