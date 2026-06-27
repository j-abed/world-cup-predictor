from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.espn_client import (
    extract_card_counts_from_summary,
    extract_team_id,
    fetch_event_summary,
    fetch_scoreboard,
    get_competition,
    is_completed_event,
)
from src.fair_play import conduct_score_from_cards, fair_play_penalty
from src.tiebreakers import FAIR_PLAY_PATH

FIXTURES_PATH = Path("data/fixtures.csv")
RESULTS_PATH = Path("data/results.csv")
TEAMS_PATH = Path("data/teams.csv")


def parse_kickoff_date(kickoff: str) -> str:
    return datetime.fromisoformat(kickoff).date().isoformat()


def find_event_id_for_fixture(
    payload: dict,
    home_team: str,
    away_team: str,
) -> str | None:
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
            (row for row in competitors if row.get("homeAway") == "home"),
            None,
        )
        away = next(
            (row for row in competitors if row.get("homeAway") == "away"),
            None,
        )

        if home is None or away is None:
            continue

        home_id = extract_team_id(home)
        away_id = extract_team_id(away)

        if home_id == home_team and away_id == away_team:
            event_id = event.get("id")
            return str(event_id) if event_id is not None else None

    return None


def update_fair_play_from_espn(
    *,
    fixtures_path: Path = FIXTURES_PATH,
    results_path: Path = RESULTS_PATH,
    teams_path: Path = TEAMS_PATH,
    fair_play_path: Path = FAIR_PLAY_PATH,
    dry_run: bool = False,
) -> tuple[int, list[str]]:
    fixtures = pd.read_csv(fixtures_path)
    results = pd.read_csv(results_path)
    teams = pd.read_csv(teams_path)

    completed = results[results["status"] == "Complete"].copy()
    group_matches = fixtures[
        (fixtures["stage"] == "Group")
        & fixtures["match_id"].isin(completed["match_id"])
    ].merge(completed, on="match_id", how="inner")

    card_totals = {
        str(team_id): {"yellow": 0, "red": 0}
        for team_id in teams["team_id"]
    }

    messages: list[str] = []
    scoreboard_cache: dict[str, dict] = {}
    matched_events = 0

    for _, match in group_matches.sort_values("match_id").iterrows():
        match_id = int(match["match_id"])
        home_team = str(match["home_team"])
        away_team = str(match["away_team"])
        kickoff_date = parse_kickoff_date(str(match["kickoff"]))

        if kickoff_date not in scoreboard_cache:
            scoreboard_cache[kickoff_date] = fetch_scoreboard(
                datetime.fromisoformat(kickoff_date).date()
            )

        event_id = find_event_id_for_fixture(
            scoreboard_cache[kickoff_date],
            home_team,
            away_team,
        )

        if event_id is None:
            messages.append(
                f"No ESPN event for match_id {match_id}: {home_team} vs {away_team}"
            )
            continue

        summary = fetch_event_summary(event_id)
        cards = extract_card_counts_from_summary(summary)

        home_cards = cards.get(home_team, {"yellow": 0, "red": 0})
        away_cards = cards.get(away_team, {"yellow": 0, "red": 0})

        for team_id, team_card_counts in (
            (home_team, home_cards),
            (away_team, away_cards),
        ):
            card_totals[team_id]["yellow"] += int(team_card_counts["yellow"])
            card_totals[team_id]["red"] += int(team_card_counts["red"])

        matched_events += 1
        messages.append(
            f"match_id {match_id}: {home_team} Y{home_cards['yellow']}/R{home_cards['red']} | "
            f"{away_team} Y{away_cards['yellow']}/R{away_cards['red']}"
        )

    rows = []

    for _, team in teams.sort_values("team_id").iterrows():
        team_id = str(team["team_id"])
        totals = card_totals[team_id]
        rows.append(
            {
                "team_id": team_id,
                "yellow_cards": totals["yellow"],
                "red_cards": totals["red"],
                "conduct_score": conduct_score_from_cards(
                    totals["yellow"], totals["red"]
                ),
                "source": "espn_summary",
            }
        )

    output = pd.DataFrame(rows)

    if dry_run:
        messages.append("Dry run only. fair_play.csv not written.")
        return matched_events, messages

    output.to_csv(fair_play_path, index=False)
    messages.append(f"Wrote {fair_play_path}")

    return matched_events, messages


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rebuild fair-play conduct scores from ESPN match summaries."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show card totals without writing data/fair_play.csv.",
    )
    args = parser.parse_args()

    matched, messages = update_fair_play_from_espn(dry_run=args.dry_run)

    for message in messages:
        print(message)

    print(f"Matched {matched} completed group-stage ESPN events.")


if __name__ == "__main__":
    main()
