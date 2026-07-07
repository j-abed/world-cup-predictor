"""Sync completed knockout-round results from ESPN into data/knockout_results.csv.

Maps ESPN events to bracket slot match_ids by matching resolved team codes,
propagating winners through the bracket so later rounds resolve correctly.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pandas as pd

from src.bracket import build_projected_round_of_32
from src.espn_client import (
    extract_team_id,
    fetch_scoreboard,
    get_competition,
    is_completed_event,
)
from src.reporting import (
    calculate_all_group_standings,
    calculate_current_projected_qualifiers,
    calculate_current_third_place_table,
)

KNOCKOUT_RESULTS_PATH = Path("data/knockout_results.csv")
KNOCKOUT_START_DATE = date(2026, 6, 28)

KNOCKOUT_RESULTS_COLUMNS = [
    "match_id",
    "home_code",
    "away_code",
    "home_score",
    "away_score",
    "winner_code",
    "loser_code",
    "winner_team_id",
    "loser_team_id",
    "espn_event_id",
    "date",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync completed knockout results from ESPN."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results without writing knockout_results.csv.",
    )
    return parser.parse_args()


def fetch_espn_knockout_events(start: date, end: date) -> list[dict]:
    """Fetch all completed ESPN events between start and end (inclusive)."""
    events = []
    d = start
    while d <= end:
        payload = fetch_scoreboard(d)
        for e in payload.get("events", []):
            if not is_completed_event(e):
                continue
            comp = get_competition(e)
            if comp is None:
                continue
            competitors = comp.get("competitors") or []
            if len(competitors) != 2:
                continue
            home = next((c for c in competitors if c.get("homeAway") == "home"), None)
            away = next((c for c in competitors if c.get("homeAway") == "away"), None)
            if home is None or away is None:
                continue

            home_code = extract_team_id(home)
            away_code = extract_team_id(away)
            if home_code is None or away_code is None:
                continue

            # Use the winner flag (handles AET and penalties correctly).
            if home.get("winner"):
                winner_code, loser_code = home_code, away_code
            elif away.get("winner"):
                winner_code, loser_code = away_code, home_code
            else:
                # Fallback: higher score wins (regular time only).
                h_score = int(home.get("score") or 0)
                a_score = int(away.get("score") or 0)
                if h_score >= a_score:
                    winner_code, loser_code = home_code, away_code
                else:
                    winner_code, loser_code = away_code, home_code

            events.append({
                "home_code": home_code,
                "away_code": away_code,
                "home_score": int(home.get("score") or 0),
                "away_score": int(away.get("score") or 0),
                "winner_code": winner_code,
                "loser_code": loser_code,
                "espn_event_id": str(e.get("id", "")),
                "date": d.isoformat(),
            })
        d += timedelta(days=1)
    return events


def build_slot_team_map(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
) -> dict[int, tuple[str, str]]:
    """Return {match_id: (home_code, away_code)} for R32 slots."""
    r32 = build_projected_round_of_32(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
    )
    return {
        int(row["match_id"]): (str(row["home_code"]), str(row["away_code"]))
        for _, row in r32[r32["round"] == "Round of 32"].iterrows()
    }


def match_event_to_slot(
    event: dict,
    slot_teams: dict[int, tuple[str, str]],
) -> int | None:
    """Find the bracket match_id whose teams match the ESPN event's team codes."""
    codes = {event["home_code"], event["away_code"]}
    for match_id, (h, a) in slot_teams.items():
        if {h, a} == codes:
            return match_id
    return None


def build_knockout_results(
    bracket_slots: pd.DataFrame,
    projected_qualifiers: pd.DataFrame,
    teams: pd.DataFrame,
    espn_events: list[dict],
) -> pd.DataFrame:
    """Match ESPN events to bracket slots, propagate winners, return results."""
    slot_teams = build_slot_team_map(bracket_slots, projected_qualifiers)
    code_to_team_id = dict(zip(teams["code"], teams["team_id"]))

    rows: list[dict] = []
    remaining = list(espn_events)

    # Multiple passes: each pass resolves slots whose feeder matches are now known.
    for _ in range(6):
        if not remaining:
            break
        unmatched = []
        for event in remaining:
            match_id = match_event_to_slot(event, slot_teams)
            if match_id is None:
                unmatched.append(event)
                continue

            winner_code = event["winner_code"]
            loser_code = event["loser_code"]

            rows.append({
                "match_id": match_id,
                "home_code": event["home_code"],
                "away_code": event["away_code"],
                "home_score": event["home_score"],
                "away_score": event["away_score"],
                "winner_code": winner_code,
                "loser_code": loser_code,
                "winner_team_id": code_to_team_id.get(winner_code, winner_code),
                "loser_team_id": code_to_team_id.get(loser_code, loser_code),
                "espn_event_id": event["espn_event_id"],
                "date": event["date"],
            })

            # Propagate this winner into downstream bracket slots.
            for _, slot_row in bracket_slots.iterrows():
                slot_mid = int(slot_row["match_id"])
                for side in ("home_source", "away_source"):
                    if str(slot_row[side]) == f"Winner Match {match_id}":
                        h, a = slot_teams.get(slot_mid, ("TBD", "TBD"))
                        if side == "home_source":
                            slot_teams[slot_mid] = (winner_code, a)
                        else:
                            slot_teams[slot_mid] = (h, winner_code)

        remaining = unmatched

    if remaining:
        print(
            f"Warning: {len(remaining)} ESPN event(s) could not be matched "
            "to bracket slots (may be non-World-Cup fixtures):"
        )
        for e in remaining:
            print(
                f"  {e['home_code']} {e['home_score']}-{e['away_score']} "
                f"{e['away_code']} ({e['date']})"
            )

    if not rows:
        return pd.DataFrame(columns=KNOCKOUT_RESULTS_COLUMNS)

    return (
        pd.DataFrame(rows)
        .sort_values("match_id")
        .reset_index(drop=True)[KNOCKOUT_RESULTS_COLUMNS]
    )


def main() -> None:
    args = parse_args()

    teams = pd.read_csv("data/teams.csv")
    fixtures = pd.read_csv("data/fixtures.csv")
    results = pd.read_csv("data/results.csv")
    bracket_slots = pd.read_csv("data/bracket_slots.csv")

    standings = calculate_all_group_standings(
        teams=teams, fixtures=fixtures, results=results
    )
    third_place = calculate_current_third_place_table(standings)
    projected_qualifiers = calculate_current_projected_qualifiers(
        standings_by_group=standings, third_place_table=third_place
    )

    today = date.today()
    print(
        f"Fetching ESPN knockout events from {KNOCKOUT_START_DATE} to {today}..."
    )
    espn_events = fetch_espn_knockout_events(KNOCKOUT_START_DATE, today)
    print(f"Found {len(espn_events)} completed ESPN event(s).")

    ko_results = build_knockout_results(
        bracket_slots=bracket_slots,
        projected_qualifiers=projected_qualifiers,
        teams=teams,
        espn_events=espn_events,
    )

    print(f"\nMatched {len(ko_results)} bracket slot result(s):")
    for _, row in ko_results.iterrows():
        print(
            f"  Match {int(row['match_id'])}: "
            f"{row['home_code']} {int(row['home_score'])}-"
            f"{int(row['away_score'])} {row['away_code']} "
            f"→ {row['winner_code']} advances"
        )

    if args.dry_run:
        print("\nDry run — no files written.")
        return

    ko_results.to_csv(KNOCKOUT_RESULTS_PATH, index=False)
    print(f"\nWrote {KNOCKOUT_RESULTS_PATH}")


if __name__ == "__main__":
    main()
