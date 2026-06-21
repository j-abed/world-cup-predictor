from __future__ import annotations

from pathlib import Path

import pandas as pd


def export_all_group_standings(
    standings_by_group: dict[str, pd.DataFrame],
    output_dir: str = "outputs",
) -> None:
    rows = []

    for group, standings in standings_by_group.items():
        export_df = standings.copy()
        export_df.insert(0, "group_code", group)
        rows.append(export_df)

    all_standings = pd.concat(rows, ignore_index=True)

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    all_standings.to_csv(Path(output_dir) / "group_standings.csv", index=False)


def export_dataframe(
    dataframe: pd.DataFrame,
    filename: str,
    output_dir: str = "outputs",
) -> None:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(Path(output_dir) / filename, index=False)
