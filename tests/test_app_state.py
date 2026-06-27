from __future__ import annotations

import json
from pathlib import Path

import pytest


@pytest.fixture
def app_state_path(repo_root: Path) -> Path:
    candidates = (
        repo_root / "frontend/public/data/app_state.json",
        repo_root / "outputs/web/app_state.json",
    )

    for path in candidates:
        if path.exists():
            return path

    pytest.skip("Run scripts/export_web_state.py to generate app_state.json")


def test_app_state_json_has_core_sections(app_state_path: Path) -> None:
    payload = json.loads(app_state_path.read_text(encoding="utf-8"))

    for key in (
        "metadata",
        "coverage",
        "fixtures",
        "standings",
        "third_place",
        "projected_qualifiers",
        "bracket",
        "odds",
        "live_context",
        "model_quality",
        "path_difficulty",
        "live_accuracy",
    ):
        assert key in payload, f"missing top-level key: {key}"

    assert payload["metadata"]["team_count"] == 48
    assert "next_refresh_at" in payload["metadata"]
    assert len(payload["fixtures"]) > 0
    assert len(payload["odds"]["round"]) == 48
    assert isinstance(payload["metadata"]["data_caveats"], list)
    assert len(payload["path_difficulty"]) == 3
