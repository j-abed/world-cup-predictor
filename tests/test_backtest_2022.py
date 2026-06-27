from pathlib import Path

import pandas as pd

from src.backtest_2022 import (
    ACTUAL_CHAMPION,
    build_backtest_payload,
    load_backtest_dataset,
)


def test_load_backtest_dataset_has_32_teams(repo_root: Path) -> None:
    dataset = load_backtest_dataset(repo_root / "data/backtest/2022")

    assert len(dataset.teams) == 32
    assert len(dataset.fixtures[dataset.fixtures["stage"] == "Group"]) == 48


def test_backtest_payload_marks_argentina_champion(repo_root: Path) -> None:
    payload = build_backtest_payload(
        simulations=200,
        seed=42,
        data_dir=repo_root / "data/backtest/2022",
    )

    assert payload["summary"]["actual_champion"] == ACTUAL_CHAMPION
    assert payload["summary"]["predicted_champion_rank"] >= 1
    assert len(payload["teams"]) == 32
