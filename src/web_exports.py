from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from src.simulator import format_probability


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


def build_metadata(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    ratings: pd.DataFrame,
    group_simulations: int,
    tournament_simulations: int,
    round_simulations: int,
) -> dict[str, Any]:
    completed_results = results[results["status"].astype(str).str.lower() == "complete"]

    ratings_source = None
    ratings_source_url = None
    rating_type = None

    if not ratings.empty:
        ratings_source = ratings.iloc[0].get("source")
        ratings_source_url = ratings.iloc[0].get("source_url")
        rating_type = ratings.iloc[0].get("rating_type")

    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
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
        "data_caveats": [
            "ESPN result sync uses a public scoreboard endpoint and should be treated as best-effort.",
            "FIFA ranking points are currently refreshed from a checked-in snapshot, not a live FIFA API.",
            "Fair-play/conduct scores are placeholders unless data/fair_play.csv is updated.",
            "Knockout odds are simulation outputs, not betting market odds.",
        ],
    }


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
    group_d_probabilities: pd.DataFrame,
    tournament_probabilities: pd.DataFrame,
    round_probabilities: pd.DataFrame,
    output_dir: str = "outputs/web",
    group_simulations: int = 10_000,
    tournament_simulations: int = 10_000,
    round_simulations: int = 10_000,
) -> dict[str, Path]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    standings_rows = []

    for group, standings in standings_by_group.items():
        group_rows = standings.copy()
        group_rows.insert(0, "group_code", group)
        standings_rows.append(group_rows)

    standings = pd.concat(standings_rows, ignore_index=True)

    group_d_with_labels = add_probability_labels(
        group_d_probabilities,
        [
            "finish_1_prob",
            "finish_2_prob",
            "finish_3_prob",
            "finish_4_prob",
            "top_2_prob",
            "top_3_prob",
        ],
    )

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
    )

    standings_payload = dataframe_records(standings)
    third_place_payload = dataframe_records(third_place_table)
    projected_qualifiers_payload = dataframe_records(projected_qualifiers)
    bracket_payload = build_bracket_payload(bracket)

    odds_payload = {
        "group_d": dataframe_records(group_d_with_labels),
        "qualification": dataframe_records(tournament_with_labels),
        "round": dataframe_records(round_with_labels),
    }

    app_state = {
        "metadata": metadata,
        "coverage": dataframe_records(coverage),
        "standings": standings_payload,
        "third_place": third_place_payload,
        "projected_qualifiers": projected_qualifiers_payload,
        "bracket": bracket_payload,
        "odds": odds_payload,
    }

    outputs = {
        "app_state": output_path / "app_state.json",
        "metadata": output_path / "metadata.json",
        "standings": output_path / "standings.json",
        "third_place": output_path / "third_place.json",
        "projected_qualifiers": output_path / "projected_qualifiers.json",
        "bracket": output_path / "bracket.json",
        "odds": output_path / "odds.json",
    }

    write_json(outputs["app_state"], app_state)
    write_json(outputs["metadata"], metadata)
    write_json(outputs["standings"], standings_payload)
    write_json(outputs["third_place"], third_place_payload)
    write_json(outputs["projected_qualifiers"], projected_qualifiers_payload)
    write_json(outputs["bracket"], bracket_payload)
    write_json(outputs["odds"], odds_payload)

    return outputs
