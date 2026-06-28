from __future__ import annotations

import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.espn_client import (
    extract_team_id,
    fetch_scoreboard,
    get_competition,
    is_completed_event,
    is_in_progress_event,
)

FIXTURES_PATH = Path("data/fixtures.csv")
RESULTS_PATH = Path("data/results.csv")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync completed FIFA World Cup results from ESPN scoreboard JSON."
    )
    parser.add_argument(
        "--date",
        help="Single date to sync in YYYY-MM-DD format. Defaults to today.",
    )
    parser.add_argument(
        "--start-date",
        help="Start date for range sync in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--end-date",
        help="End date for range sync in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be updated without writing data/results.csv.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing results if ESPN has a completed score.",
    )
    return parser.parse_args()


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def iter_dates(args: argparse.Namespace) -> list[date]:
    if args.start_date or args.end_date:
        if not args.start_date or not args.end_date:
            raise SystemExit("Use both --start-date and --end-date for range sync.")

        start = parse_date(args.start_date)
        end = parse_date(args.end_date)

        if end < start:
            raise SystemExit("--end-date must be on or after --start-date.")

        days = []
        current = start

        while current <= end:
            days.append(current)
            current += timedelta(days=1)

        return days

    if args.date:
        return [parse_date(args.date)]

    return [date.today()]


def extract_completed_results(payload: dict) -> list[dict]:
    rows = []

    for event in payload.get("events", []):
        if not is_completed_event(event):
            continue

        competition = get_competition(event)

        if competition is None:
            continue

        competitors = competition.get("competitors") or []

        if len(competitors) != 2:
            continue

        home = next(
            (competitor for competitor in competitors if competitor.get("homeAway") == "home"),
            None,
        )
        away = next(
            (competitor for competitor in competitors if competitor.get("homeAway") == "away"),
            None,
        )

        if home is None or away is None:
            continue

        home_team = extract_team_id(home)
        away_team = extract_team_id(away)

        if home_team is None or away_team is None:
            print(
                "Skipping completed ESPN event because team code mapping failed: "
                f"{event.get('name')}"
            )
            continue

        rows.append(
            {
                "home_team": home_team,
                "away_team": away_team,
                "home_score": int(home.get("score")),
                "away_score": int(away.get("score")),
                "event_name": event.get("name"),
                "event_date": event.get("date"),
            }
        )

    return rows


def extract_in_progress_results(payload: dict) -> list[dict]:
    rows = []

    for event in payload.get("events", []):
        if not is_in_progress_event(event):
            continue

        competition = get_competition(event)

        if competition is None:
            continue

        competitors = competition.get("competitors") or []

        if len(competitors) != 2:
            continue

        home = next(
            (competitor for competitor in competitors if competitor.get("homeAway") == "home"),
            None,
        )
        away = next(
            (competitor for competitor in competitors if competitor.get("homeAway") == "away"),
            None,
        )

        if home is None or away is None:
            continue

        home_team = extract_team_id(home)
        away_team = extract_team_id(away)

        if home_team is None or away_team is None:
            continue

        rows.append(
            {
                "home_team": home_team,
                "away_team": away_team,
                "home_score": int(home.get("score") or 0),
                "away_score": int(away.get("score") or 0),
                "event_name": event.get("name"),
                "event_date": event.get("date"),
            }
        )

    return rows


def find_fixture_match(fixtures: pd.DataFrame, result: dict) -> pd.Series | None:
    # Prefer exact home/away match.
    exact = fixtures[
        (fixtures["stage"] == "Group")
        & (fixtures["home_team"] == result["home_team"])
        & (fixtures["away_team"] == result["away_team"])
    ]

    if len(exact) == 1:
        return exact.iloc[0]

    # Fallback: if source reverses home/away, still detect the fixture,
    # but keep fixture home/away orientation when writing the score.
    reversed_match = fixtures[
        (fixtures["stage"] == "Group")
        & (fixtures["home_team"] == result["away_team"])
        & (fixtures["away_team"] == result["home_team"])
    ]

    if len(reversed_match) == 1:
        fixture = reversed_match.iloc[0].copy()
        result["home_team"], result["away_team"] = result["away_team"], result["home_team"]
        result["home_score"], result["away_score"] = result["away_score"], result["home_score"]
        return fixture

    return None


def upsert_results(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    synced_results: list[dict],
    force: bool,
) -> tuple[pd.DataFrame, list[str]]:
    messages = []
    output = results.copy()

    for synced in synced_results:
        fixture = find_fixture_match(fixtures, synced)

        if fixture is None:
            messages.append(
                "No fixture match found for "
                f"{synced['home_team']} vs {synced['away_team']} "
                f"({synced.get('event_name')})"
            )
            continue

        match_id = int(fixture["match_id"])
        existing = output[output["match_id"] == match_id]

        new_row = {
            "match_id": match_id,
            "home_score": int(synced["home_score"]),
            "away_score": int(synced["away_score"]),
            "status": "Complete",
        }

        if not existing.empty and not force:
            current = existing.iloc[0]
            if str(current["status"]).lower() == "complete":
                messages.append(
                    f"Skipping existing match_id {match_id}: "
                    f"{fixture['home_team']} {int(current['home_score'])}-"
                    f"{int(current['away_score'])} {fixture['away_team']} "
                    "(use --force to overwrite)"
                )
                continue

        if not existing.empty:
            output = output[output["match_id"] != match_id].copy()

        output = pd.concat([output, pd.DataFrame([new_row])], ignore_index=True)

        messages.append(
            f"Saved match_id {match_id}: "
            f"{fixture['home_team']} {new_row['home_score']}-"
            f"{new_row['away_score']} {fixture['away_team']}"
        )

    output = output.sort_values("match_id").reset_index(drop=True)

    return output, messages


def upsert_in_progress_results(
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    live_results: list[dict],
) -> tuple[pd.DataFrame, list[str]]:
    messages = []
    output = results.copy()

    for live in live_results:
        fixture = find_fixture_match(fixtures, live)

        if fixture is None:
            messages.append(
                "No fixture match found for live ESPN event "
                f"{live['home_team']} vs {live['away_team']} "
                f"({live.get('event_name')})"
            )
            continue

        match_id = int(fixture["match_id"])
        existing = output[output["match_id"] == match_id]

        if not existing.empty:
            current = existing.iloc[0]

            if str(current["status"]).lower() == "complete":
                continue

        new_row = {
            "match_id": match_id,
            "home_score": int(live["home_score"]),
            "away_score": int(live["away_score"]),
            "status": "In Progress",
        }

        if not existing.empty:
            output = output[output["match_id"] != match_id].copy()

        output = pd.concat([output, pd.DataFrame([new_row])], ignore_index=True)

        messages.append(
            f"Marked match_id {match_id} in progress: "
            f"{fixture['home_team']} {new_row['home_score']}-"
            f"{new_row['away_score']} {fixture['away_team']}"
        )

    output = output.sort_values("match_id").reset_index(drop=True)

    return output, messages


def dedupe_results(results: pd.DataFrame) -> pd.DataFrame:
    if results.empty:
        return results

    return (
        results.sort_values("match_id")
        .drop_duplicates(subset=["match_id"], keep="last")
        .reset_index(drop=True)
    )


def main() -> None:
    args = parse_args()

    fixtures = pd.read_csv(FIXTURES_PATH)
    results = pd.read_csv(RESULTS_PATH)

    all_synced_results = []
    all_live_results = []

    for target_date in iter_dates(args):
        payload = fetch_scoreboard(target_date)
        synced_results = extract_completed_results(payload)
        live_results = extract_in_progress_results(payload)
        print(f"{target_date}: found {len(synced_results)} completed ESPN events")
        print(f"{target_date}: found {len(live_results)} in-progress ESPN events")
        all_synced_results.extend(synced_results)
        all_live_results.extend(live_results)

    updated_results, messages = upsert_results(
        fixtures=fixtures,
        results=results,
        synced_results=all_synced_results,
        force=args.force,
    )

    updated_results, live_messages = upsert_in_progress_results(
        fixtures=fixtures,
        results=updated_results,
        live_results=all_live_results,
    )
    messages.extend(live_messages)

    for message in messages:
        print(message)

    if args.dry_run:
        print("Dry run only. No files written.")
        return

    updated_results = dedupe_results(updated_results)
    updated_results.to_csv(RESULTS_PATH, index=False)
    print(f"Wrote {RESULTS_PATH}")


if __name__ == "__main__":
    main()
