from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.knockout import simulate_tournament_round_probabilities
from src.reporting import calculate_all_group_standings
from src.simulator import (
    build_rating_lookup,
    prepare_groups,
    simulate_all_groups_once,
)
from src.tiebreakers import load_ranking_fallback

BACKTEST_2022_DIR = Path("data/backtest/2022")

ACTUAL_ROUND_TEAMS: dict[str, list[str]] = {
    "round_of_16": [
        "NED",
        "SEN",
        "ENG",
        "USA",
        "ARG",
        "AUS",
        "FRA",
        "POL",
        "JPN",
        "CRO",
        "BRA",
        "KOR",
        "MAR",
        "ESP",
        "POR",
        "SUI",
    ],
    "quarterfinal": ["NED", "ARG", "CRO", "BRA", "ENG", "FRA", "MAR", "POR"],
    "semifinal": ["ARG", "CRO", "FRA", "MAR"],
    "final": ["ARG", "FRA"],
}

ACTUAL_CHAMPION = "ARG"

PREDICTION_ROUND_COLUMNS = {
    "round_of_16": "r32_prob",
    "quarterfinal": "r16_prob",
    "semifinal": "qf_prob",
    "final": "sf_prob",
    "champion": "champion_prob",
}


@dataclass(frozen=True)
class BacktestDataset:
    teams: pd.DataFrame
    fixtures: pd.DataFrame
    results: pd.DataFrame
    ratings: pd.DataFrame
    bracket_slots: pd.DataFrame


def load_backtest_dataset(data_dir: Path = BACKTEST_2022_DIR) -> BacktestDataset:
    return BacktestDataset(
        teams=pd.read_csv(data_dir / "teams.csv"),
        fixtures=pd.read_csv(data_dir / "fixtures.csv"),
        results=pd.read_csv(data_dir / "results.csv"),
        ratings=pd.read_csv(data_dir / "ratings.csv"),
        bracket_slots=pd.read_csv(data_dir / "bracket_slots.csv"),
    )


def empty_results() -> pd.DataFrame:
    return pd.DataFrame(columns=["match_id", "home_score", "away_score", "status"])


def simulate_2022_qualification_probabilities(
    dataset: BacktestDataset,
    *,
    simulations: int,
    seed: int,
) -> pd.DataFrame:
    import numpy as np

    from collections import defaultdict

    rng = np.random.default_rng(seed)
    prepared_groups = prepare_groups(
        teams=dataset.teams,
        fixtures=dataset.fixtures,
        results=empty_results(),
    )
    rating_lookup = build_rating_lookup(dataset.ratings)
    ranking_fallback = load_ranking_fallback(BACKTEST_2022_DIR / "ratings.csv")

    qualification_counts: dict[str, int] = defaultdict(int)

    for _ in range(simulations):
        group_results = simulate_all_groups_once(
            prepared_groups=prepared_groups,
            rating_lookup=rating_lookup,
            rng=rng,
            conduct_scores={},
            ranking_fallback=ranking_fallback,
        )

        for rows in group_results.values():
            for row in rows:
                if row["group_rank"] <= 2:
                    qualification_counts[row["team_id"]] += 1

    output_rows = []

    for _, team in dataset.teams.iterrows():
        team_id = team["team_id"]
        qualify_prob = qualification_counts[team_id] / simulations

        output_rows.append(
            {
                "team_id": team_id,
                "team": team["name"],
                "code": team["code"],
                "group": team["group"],
                "qualify_prob": qualify_prob,
            }
        )

    return pd.DataFrame(output_rows).sort_values(
        "qualify_prob",
        ascending=False,
    )


def run_pre_tournament_predictions(
    dataset: BacktestDataset,
    *,
    simulations: int,
    seed: int,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    qualification = simulate_2022_qualification_probabilities(
        dataset,
        simulations=simulations,
        seed=seed,
    )

    round_probs = simulate_tournament_round_probabilities(
        teams=dataset.teams,
        fixtures=dataset.fixtures,
        results=empty_results(),
        ratings=dataset.ratings,
        simulations=simulations,
        seed=seed,
        bracket_slots_path=str(BACKTEST_2022_DIR / "bracket_slots.csv"),
        tournament="2022",
    )

    return qualification, round_probs


def champion_rank(round_probs: pd.DataFrame, champion_code: str) -> int:
    ranked = round_probs.sort_values("champion_prob", ascending=False).reset_index(
        drop=True,
    )
    matches = ranked[ranked["code"] == champion_code]

    if matches.empty:
        return len(ranked) + 1

    return int(matches.index[0]) + 1


def build_team_comparisons(
    qualification: pd.DataFrame,
    round_probs: pd.DataFrame,
) -> list[dict[str, Any]]:
    actual_r16 = set(ACTUAL_ROUND_TEAMS["round_of_16"])
    qual_by_code = qualification.set_index("code")
    round_by_code = round_probs.set_index("code")

    rows: list[dict[str, Any]] = []

    for _, team in round_probs.sort_values("champion_prob", ascending=False).iterrows():
        code = str(team["code"])
        actual_made_r16 = code in actual_r16

        rows.append(
            {
                "team_id": team["team_id"],
                "team": team["team"],
                "code": code,
                "group": team["group"],
                "qualify_prob": float(qual_by_code.loc[code, "qualify_prob"]),
                "champion_prob": float(team["champion_prob"]),
                "actual_made_round_of_16": actual_made_r16,
                "actual_champion": code == ACTUAL_CHAMPION,
            }
        )

    return rows


def build_round_metrics(round_probs: pd.DataFrame) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []

    for round_name, column in PREDICTION_ROUND_COLUMNS.items():
        actual_codes = set(ACTUAL_ROUND_TEAMS.get(round_name, [ACTUAL_CHAMPION]))
        predicted = round_probs.sort_values(column, ascending=False)

        if round_name == "champion":
            top_n = 1
            predicted_codes = {str(predicted.iloc[0]["code"])}
            actual_codes = {ACTUAL_CHAMPION}
        else:
            top_n = len(actual_codes)
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

    return metrics


def build_notable_upsets() -> list[dict[str, str]]:
    return [
        {
            "match": "Argentina 1–2 Saudi Arabia",
            "note": "Opening-day upset; model still had Argentina as a pre-tournament co-favorite.",
        },
        {
            "match": "Germany 1–2 Japan",
            "note": "Another early favorite loss; group-stage variance is hard to eliminate.",
        },
        {
            "match": "Morocco to semifinals",
            "note": "Historic run; long-shot knockout path beat many rating-based projections.",
        },
        {
            "match": "Argentina won the final on penalties",
            "note": "Actual champion ranked highly pre-tournament, but the final itself was a coin flip.",
        },
    ]


def build_backtest_payload(
    *,
    simulations: int,
    seed: int,
    data_dir: Path = BACKTEST_2022_DIR,
) -> dict[str, Any]:
    dataset = load_backtest_dataset(data_dir)
    qualification, round_probs = run_pre_tournament_predictions(
        dataset,
        simulations=simulations,
        seed=seed,
    )

    champion_rank_position = champion_rank(round_probs, ACTUAL_CHAMPION)
    champion_row = round_probs[round_probs["code"] == ACTUAL_CHAMPION].iloc[0]

    standings_by_group = calculate_all_group_standings(
        teams=dataset.teams,
        fixtures=dataset.fixtures,
        results=dataset.results,
    )
    standings_rows = []

    for group, standings in standings_by_group.items():
        group_rows = standings.copy()
        group_rows.insert(0, "group_code", group)
        standings_rows.append(group_rows)

    standings_df = pd.concat(standings_rows, ignore_index=True)

    return {
        "metadata": {
            "tournament": "2022 FIFA World Cup",
            "label": "Pre-tournament model vs actual outcomes",
            "simulations": simulations,
            "seed": seed,
            "ratings_as_of": "2022-10-31",
            "ratings_source": "FIFA/Coca-Cola Men's World Ranking points snapshot",
            "methodology": (
                "Runs the current simulator on 2022 teams, fixtures, and pre-tournament "
                "ratings with no group-stage results. Knockout format uses the 16-team "
                "Round of 16 bracket from Qatar 2022."
            ),
        },
        "summary": {
            "actual_champion": ACTUAL_CHAMPION,
            "actual_champion_team": champion_row["team"],
            "predicted_champion_rank": champion_rank_position,
            "predicted_champion_probability": float(champion_row["champion_prob"]),
            "team_count": int(len(dataset.teams)),
        },
        "round_metrics": build_round_metrics(round_probs),
        "teams": build_team_comparisons(qualification, round_probs),
        "notable_upsets": build_notable_upsets(),
        "actual_round_teams": ACTUAL_ROUND_TEAMS,
        "standings": standings_df.to_dict(orient="records"),
    }
