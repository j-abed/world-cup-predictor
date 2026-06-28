from __future__ import annotations

import json
from pathlib import Path

import pytest

from src.model_quality import build_model_quality_payload


def _resolve_app_state_path(repo_root: Path) -> Path:
    candidates = (
        repo_root / "frontend/public/data/app_state.json",
        repo_root / "outputs/web/app_state.json",
    )

    for path in candidates:
        if path.exists():
            return path

    pytest.skip("No app_state.json found — run export_web_state.py first")


@pytest.fixture
def app_state_payload(repo_root: Path) -> dict:
    path = _resolve_app_state_path(repo_root)
    return json.loads(path.read_text(encoding="utf-8"))


def test_metadata_counts_match_payload(app_state_payload: dict) -> None:
    metadata = app_state_payload["metadata"]
    fixtures = app_state_payload["fixtures"]
    standings = app_state_payload["standings"]

    completed = sum(
        1
        for match in fixtures
        if str(match.get("status", "")).lower() == "complete"
    )

    assert metadata["fixture_count"] == len(fixtures)
    assert metadata["completed_result_count"] == completed
    assert metadata["team_count"] == len(app_state_payload["odds"]["round"])
    assert len(standings) == metadata["team_count"]


def test_model_quality_matches_metadata(app_state_payload: dict) -> None:
    metadata = app_state_payload["metadata"]
    model_quality = app_state_payload["model_quality"]
    components = model_quality["components"]

    expected_completeness = (
        metadata["completed_result_count"] / metadata["fixture_count"]
        if metadata["fixture_count"]
        else 0.0
    )

    assert components["group_stage_completeness"] == pytest.approx(
        round(expected_completeness, 4),
    )

    round_sims = metadata["simulations"]["round"]

    expected = build_model_quality_payload(
        completed_result_count=metadata["completed_result_count"],
        fixture_count=metadata["fixture_count"],
        round_simulations=round_sims,
    )

    assert model_quality["confidence_score"] == pytest.approx(
        expected["confidence_score"],
        abs=0.0002,
    )
    assert model_quality["confidence_percent"] == expected["confidence_percent"]
    assert model_quality["confidence_label"] == expected["confidence_label"]


def test_round_odds_labels_align_with_probabilities(app_state_payload: dict) -> None:
    for team in app_state_payload["odds"]["round"]:
        champion_prob = team["champion_prob"]
        label = team["champion_prob_label"].strip().replace("%", "")
        parsed = float(label) / 100

        assert parsed == pytest.approx(champion_prob, abs=0.002)


def test_qualification_first_prob_labels(app_state_payload: dict) -> None:
    for team in app_state_payload["odds"]["qualification"]:
        label = team["first_prob_label"].strip().replace("%", "")
        parsed = float(label) / 100

        assert parsed == pytest.approx(team["first_prob"], abs=0.002)


def test_path_difficulty_covers_all_teams(app_state_payload: dict) -> None:
    codes = {team["code"] for team in app_state_payload["odds"]["round"]}
    path_codes = {entry["code"] for entry in app_state_payload.get("path_difficulty", [])}

    assert path_codes == codes


def test_most_likely_bracket_is_exported_on_refresh(app_state_payload: dict) -> None:
    metadata = app_state_payload["metadata"]
    round_sims = metadata["simulations"]["round"]

    assert metadata.get("projected_bracket_simulations") == round_sims

    knockout_rounds = (
        "round_of_16",
        "quarterfinals",
        "semifinals",
        "final",
    )

    for round_key in knockout_rounds:
        for match in app_state_payload["bracket"][round_key]:
            projected_winner = match.get("projected_winner")
            assert projected_winner is not None
            assert projected_winner["code"] not in (None, "", "TBD")
            assert match["home"]["code"] not in (None, "", "TBD")
            assert match["away"]["code"] not in (None, "", "TBD")


def test_bracket_teams_are_known_or_tbd(app_state_payload: dict) -> None:
    codes = {team["code"] for team in app_state_payload["odds"]["round"]} | {"TBD"}

    for round_key in (
        "round_of_32",
        "round_of_16",
        "quarterfinals",
        "semifinals",
        "final",
    ):
        for match in app_state_payload["bracket"][round_key]:
            for slot in (match["home"], match["away"]):
                if slot["code"]:
                    assert slot["code"] in codes
