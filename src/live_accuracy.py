from __future__ import annotations

from typing import Any

import pandas as pd

ROUND_COLUMNS = {
    "round_of_32": "r32_prob",
    "round_of_16": "r16_prob",
    "quarterfinal": "qf_prob",
    "semifinal": "sf_prob",
    "final": "final_prob",
}


def _actual_teams_for_round(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    *,
    stage: str,
) -> set[str]:
    completed = results[results["status"].astype(str).str.lower() == "complete"].copy()

    if completed.empty:
        return set()

    merged = completed.merge(fixtures, on="match_id", how="inner")

    stage_matches = merged[merged["stage"].astype(str).str.lower() == stage.lower()]

    if stage_matches.empty:
        return set()

    teams: set[str] = set()

    for _, row in stage_matches.iterrows():
        home_score = int(row["home_score"])
        away_score = int(row["away_score"])

        if home_score == away_score:
            continue

        winner = row["home_team"] if home_score > away_score else row["away_team"]
        teams.add(str(winner))

    return teams


def build_live_accuracy_payload(
    round_probabilities: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    teams: pd.DataFrame,
) -> dict[str, Any]:
    code_by_team_id = {
        str(row["team_id"]): str(row["code"]) for _, row in teams.iterrows()
    }

    metrics: list[dict[str, Any]] = []

    for round_name, column in ROUND_COLUMNS.items():
        actual_team_ids = _actual_teams_for_round(
            fixtures,
            results,
            stage=round_name.replace("_", " "),
        )

        if not actual_team_ids:
            continue

        actual_codes = {
            code_by_team_id[team_id]
            for team_id in actual_team_ids
            if team_id in code_by_team_id
        }

        if not actual_codes:
            continue

        top_n = len(actual_codes)
        predicted = round_probabilities.sort_values(column, ascending=False)
        predicted_codes = set(predicted.head(top_n)["code"].astype(str))
        overlap = len(predicted_codes & actual_codes)

        metrics.append(
            {
                "round": round_name,
                "predicted_top_n": top_n,
                "actual_teams_in_top_n": overlap,
                "top_n": top_n,
            }
        )

    if not metrics:
        return {
            "available": False,
            "round_metrics": [],
            "summary": None,
        }

    latest = metrics[-1]

    return {
        "available": True,
        "round_metrics": metrics,
        "summary": (
            f"Model placed {latest['actual_teams_in_top_n']}/{latest['top_n']} "
            f"{latest['round'].replace('_', ' ')} teams in the top {latest['top_n']} "
            f"by reach probability."
        ),
    }
