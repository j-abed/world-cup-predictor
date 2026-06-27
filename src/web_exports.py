from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from src.live_accuracy import build_live_accuracy_payload
from src.market_comparison import build_market_comparison_payload, load_market_odds
from src.model_quality import build_model_quality_payload
from src.path_difficulty import build_path_difficulty_payload
from src.simulator import format_probability
from src.tiebreakers import FAIR_PLAY_PATH
from src.tournament_context import (
    build_live_context,
    build_refresh_metadata,
    load_tournament_schedule,
    parse_iso_datetime,
)
from src.movement import (
    build_movement_payload,
    extract_team_snapshots,
    resolve_baseline_snapshot,
    write_movement_snapshot,
)


ROUND_LABELS = {
    "R32": "Round of 32",
    "R16": "Round of 16",
    "QF": "Quarterfinals",
    "SF": "Semifinals",
    "F": "Final",
}


def dataframe_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    clean = dataframe.copy()

    clean = clean.where(pd.notnull(clean), None)

    return clean.to_dict(orient="records")


def add_probability_labels(
    dataframe: pd.DataFrame,
    probability_columns: list[str],
) -> pd.DataFrame:
    output = dataframe.copy()

    for column in probability_columns:
        if column in output.columns:
            output[f"{column}_label"] = output[column].map(format_probability)

    return output


def bracket_round_key(slot_id: str) -> str:
    prefix = str(slot_id).split("-", maxsplit=1)[0]
    return prefix


def safe_int(value: Any) -> int | None:
    if value is None:
        return None

    if pd.isna(value):
        return None

    value_as_string = str(value).strip()

    if value_as_string == "":
        return None

    return int(float(value_as_string))


def clean_value(value: Any) -> Any:
    if value is None:
        return None

    if pd.isna(value):
        return None

    if isinstance(value, str) and value.strip() == "":
        return None

    return value


def match_team_payload(
    row: pd.Series,
    side: str,
) -> dict[str, Any]:
    return {
        "source": clean_value(row.get(f"{side}_source")),
        "team": clean_value(row.get(f"{side}_team")),
        "code": clean_value(row.get(f"{side}_code")),
    }


def build_bracket_payload(bracket: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    payload: dict[str, list[dict[str, Any]]] = {
        "round_of_32": [],
        "round_of_16": [],
        "quarterfinals": [],
        "semifinals": [],
        "final": [],
    }

    round_key_to_payload_key = {
        "R32": "round_of_32",
        "R16": "round_of_16",
        "QF": "quarterfinals",
        "SF": "semifinals",
        "F": "final",
    }

    for _, row in bracket.iterrows():
        round_key = bracket_round_key(row["slot_id"])
        payload_key = round_key_to_payload_key.get(round_key)

        if payload_key is None:
            continue

        payload[payload_key].append(
            {
                "slot_id": row.get("slot_id"),
                "round": ROUND_LABELS.get(round_key, round_key),
                "match_id": safe_int(row.get("match_id")),
                "home": match_team_payload(row, "home"),
                "away": match_team_payload(row, "away"),
                "winner_advances_to": safe_int(row.get("winner_advances_to")),
            }
        )

    return payload


def build_fixtures_payload(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    teams: pd.DataFrame,
) -> list[dict[str, Any]]:
    team_lookup = {
        str(row["team_id"]): {
            "team": str(row["name"]),
            "code": str(row["code"]),
        }
        for _, row in teams.iterrows()
    }

    results_by_match = results.set_index("match_id", drop=False)

    rows: list[dict[str, Any]] = []

    for _, fixture in fixtures.iterrows():
        match_id = int(fixture["match_id"])
        home_id = str(fixture["home_team"])
        away_id = str(fixture["away_team"])

        if match_id in results_by_match.index:
            result = results_by_match.loc[match_id]
            if isinstance(result, pd.DataFrame):
                result = result.iloc[0]

            status = str(result["status"])
            home_score = safe_int(result.get("home_score"))
            away_score = safe_int(result.get("away_score"))
        else:
            status = "Scheduled"
            home_score = None
            away_score = None

        if status.lower() == "in progress":
            # Keep live scores visible even when nullable in CSV.
            home_score = 0 if home_score is None else home_score
            away_score = 0 if away_score is None else away_score

        home = team_lookup[home_id]
        away = team_lookup[away_id]

        rows.append(
            {
                "match_id": match_id,
                "group": str(fixture["group"]),
                "kickoff": str(fixture["kickoff"]),
                "home_team_id": home_id,
                "home_team": home["team"],
                "home_code": home["code"],
                "away_team_id": away_id,
                "away_team": away["team"],
                "away_code": away["code"],
                "status": status,
                "home_score": home_score,
                "away_score": away_score,
            }
        )

    rows.sort(key=lambda row: row["kickoff"])
    return rows


def build_data_caveats(ratings: pd.DataFrame) -> list[str]:
    caveats = [
        "ESPN result sync uses a public scoreboard endpoint and should be treated as best-effort.",
        "Knockout odds are simulation outputs, not betting market odds.",
        "Knockout draws are resolved with extra time, then penalties (see DATA_STATUS.md).",
    ]

    ratings_source = None
    if not ratings.empty:
        ratings_source = str(ratings.iloc[0].get("source") or "")

    if ratings_source == "post_match_elo_updates":
        caveats.append(
            "Ratings include Elo-style post-match updates for newly completed fixtures."
        )
    else:
        caveats.append(
            "Ratings start from a checked-in FIFA snapshot; enable --update-ratings in the refresh pipeline to move them after matches."
        )

    if FAIR_PLAY_PATH.exists():
        fair_play = pd.read_csv(FAIR_PLAY_PATH)
        sources = set(fair_play.get("source", pd.Series(dtype=str)).astype(str))
        if sources == {"placeholder"} or not sources:
            caveats.append(
                "Fair-play/conduct scores are placeholders until ESPN card sync runs."
            )
        else:
            caveats.append(
                "Fair-play conduct scores are aggregated from ESPN yellow/red card data."
            )
    else:
        caveats.append("Fair-play/conduct scores are unavailable.")

    return caveats


def build_metadata(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    group_simulations: int,
    tournament_simulations: int,
    round_simulations: int,
    *,
    generated_at: datetime | None = None,
    scenario: dict[str, Any] | None = None,
    projection_tier: str = "standard",
) -> dict[str, Any]:
    completed_results = results[results["status"].astype(str).str.lower() == "complete"]
    export_time = generated_at or datetime.now()

    ratings_source = None
    ratings_source_url = None
    rating_type = None

    if not ratings.empty:
        ratings_source = ratings.iloc[0].get("source")
        ratings_source_url = ratings.iloc[0].get("source_url")
        rating_type = ratings.iloc[0].get("rating_type")

    schedule = load_tournament_schedule()

    metadata = {
        "generated_at": export_time.isoformat(timespec="seconds"),
        "team_count": int(len(teams)),
        "fixture_count": int(len(fixtures)),
        "completed_result_count": int(len(completed_results)),
        "ratings_source": ratings_source,
        "ratings_source_url": ratings_source_url,
        "rating_type": rating_type,
        "simulations": {
            "group": group_simulations,
            "tournament": tournament_simulations,
            "round": round_simulations,
        },
        "projection_tier": projection_tier,
        "data_caveats": build_data_caveats(ratings),
        **build_refresh_metadata(export_time, schedule),
    }

    if scenario is not None:
        metadata["scenario"] = scenario

    return metadata


def build_app_state_payload(
    *,
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    coverage: pd.DataFrame,
    standings_by_group: dict[str, pd.DataFrame],
    third_place_table: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    bracket: pd.DataFrame,
    group_finish_probabilities: dict[str, pd.DataFrame],
    tournament_probabilities: pd.DataFrame,
    round_probabilities: pd.DataFrame,
    group_simulations: int = 10_000,
    tournament_simulations: int = 10_000,
    round_simulations: int = 10_000,
    projection_tier: str = "standard",
    scenario: dict[str, Any] | None = None,
    movement: dict[str, Any] | None = None,
    live_context: dict[str, Any] | None = None,
    model_quality: dict[str, Any] | None = None,
    path_difficulty: list[dict[str, Any]] | None = None,
    live_accuracy: dict[str, Any] | None = None,
    market_comparison: dict[str, Any] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    standings_rows = []

    for group, standings in standings_by_group.items():
        group_rows = standings.copy()
        group_rows.insert(0, "group_code", group)
        standings_rows.append(group_rows)

    standings = pd.concat(standings_rows, ignore_index=True)

    group_finish_payload: dict[str, list[dict[str, Any]]] = {}

    for group, probabilities in sorted(group_finish_probabilities.items()):
        with_labels = add_probability_labels(
            probabilities,
            [
                "finish_1_prob",
                "finish_2_prob",
                "finish_3_prob",
                "finish_4_prob",
                "top_2_prob",
                "top_3_prob",
            ],
        )
        group_finish_payload[group] = dataframe_records(with_labels)

    tournament_with_labels = add_probability_labels(
        tournament_probabilities,
        [
            "qualify_prob",
            "first_prob",
            "second_prob",
            "third_qualify_prob",
        ],
    )

    round_with_labels = add_probability_labels(
        round_probabilities,
        [
            "r32_prob",
            "r16_prob",
            "qf_prob",
            "sf_prob",
            "final_prob",
            "champion_prob",
        ],
    )

    metadata = build_metadata(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        group_simulations=group_simulations,
        tournament_simulations=tournament_simulations,
        round_simulations=round_simulations,
        generated_at=generated_at,
        scenario=scenario,
        projection_tier=projection_tier,
    )

    fixtures_payload = build_fixtures_payload(
        fixtures=fixtures,
        results=results,
        teams=teams,
    )

    export_time = generated_at or parse_iso_datetime(str(metadata["generated_at"]))

    if live_context is None:
        live_context = build_live_context(
            fixtures_payload,
            generated_at=export_time,
            final_kickoff=str(metadata["tournament_final_kickoff"]),
        )

    if model_quality is None:
        model_quality = build_model_quality_payload(
            completed_result_count=int(metadata["completed_result_count"]),
            fixture_count=int(metadata["fixture_count"]),
            round_simulations=round_simulations,
            projection_tier=metadata.get("projection_tier", projection_tier),
        )

    if path_difficulty is None:
        path_difficulty = build_path_difficulty_payload(
            bracket=bracket,
            round_probabilities=round_probabilities,
            ratings=ratings,
        )

    if live_accuracy is None:
        live_accuracy = build_live_accuracy_payload(
            round_probabilities=round_probabilities,
            fixtures=fixtures,
            results=results,
            teams=teams,
        )

    if market_comparison is None:
        market_comparison = build_market_comparison_payload(
            round_probabilities=round_probabilities,
            market_odds=load_market_odds(),
        )

    payload: dict[str, Any] = {
        "metadata": metadata,
        "coverage": dataframe_records(coverage),
        "fixtures": fixtures_payload,
        "standings": dataframe_records(standings),
        "third_place": dataframe_records(third_place_table),
        "projected_qualifiers": dataframe_records(projected_qualifiers),
        "bracket": build_bracket_payload(bracket),
        "odds": {
            "group_finish": group_finish_payload,
            "qualification": dataframe_records(tournament_with_labels),
            "round": dataframe_records(round_with_labels),
        },
        "live_context": live_context,
        "model_quality": model_quality,
        "path_difficulty": path_difficulty,
        "live_accuracy": live_accuracy,
        "market_comparison": market_comparison,
    }

    if movement is not None:
        payload["movement"] = movement

    return payload


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def export_web_state(
    *,
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    coverage: pd.DataFrame,
    standings_by_group: dict[str, pd.DataFrame],
    third_place_table: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    bracket: pd.DataFrame,
    group_finish_probabilities: dict[str, pd.DataFrame],
    tournament_probabilities: pd.DataFrame,
    round_probabilities: pd.DataFrame,
    output_dir: str = "outputs/web",
    group_simulations: int = 10_000,
    tournament_simulations: int = 10_000,
    round_simulations: int = 10_000,
    projection_tier: str = "standard",
    baseline_app_state_path: str | Path | None = None,
) -> dict[str, Path]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    snapshot_path = output_path / "movement_snapshot.json"
    baseline_path = (
        Path(baseline_app_state_path) if baseline_app_state_path is not None else None
    )
    previous_snapshot = resolve_baseline_snapshot(
        snapshot_path=snapshot_path,
        baseline_app_state_path=baseline_path,
    )

    current_team_snapshots = extract_team_snapshots(
        round_probabilities=round_probabilities,
        tournament_probabilities=tournament_probabilities,
    )
    movement = build_movement_payload(current_team_snapshots, previous_snapshot)

    export_time = datetime.now()

    app_state = build_app_state_payload(
        teams=teams,
        fixtures=fixtures,
        results=results,
        ratings=ratings,
        coverage=coverage,
        standings_by_group=standings_by_group,
        third_place_table=third_place_table,
        projected_qualifiers=projected_qualifiers,
        bracket=bracket,
        group_finish_probabilities=group_finish_probabilities,
        tournament_probabilities=tournament_probabilities,
        round_probabilities=round_probabilities,
        group_simulations=group_simulations,
        tournament_simulations=tournament_simulations,
        round_simulations=round_simulations,
        projection_tier=projection_tier,
        movement=movement,
        generated_at=export_time,
    )

    metadata = app_state["metadata"]
    fixtures_payload = app_state["fixtures"]
    standings_payload = app_state["standings"]
    third_place_payload = app_state["third_place"]
    projected_qualifiers_payload = app_state["projected_qualifiers"]
    bracket_payload = app_state["bracket"]
    odds_payload = app_state["odds"]

    outputs = {
        "app_state": output_path / "app_state.json",
        "metadata": output_path / "metadata.json",
        "fixtures": output_path / "fixtures.json",
        "standings": output_path / "standings.json",
        "third_place": output_path / "third_place.json",
        "projected_qualifiers": output_path / "projected_qualifiers.json",
        "bracket": output_path / "bracket.json",
        "odds": output_path / "odds.json",
    }

    write_json(outputs["app_state"], app_state)
    write_json(outputs["metadata"], metadata)
    write_json(outputs["fixtures"], fixtures_payload)
    write_json(outputs["standings"], standings_payload)
    write_json(outputs["third_place"], third_place_payload)
    write_json(outputs["projected_qualifiers"], projected_qualifiers_payload)
    write_json(outputs["bracket"], bracket_payload)
    write_json(outputs["odds"], odds_payload)

    write_movement_snapshot(
        snapshot_path,
        generated_at=str(metadata["generated_at"]),
        teams=current_team_snapshots,
    )

    return outputs
