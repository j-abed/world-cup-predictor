from __future__ import annotations

import pandas as pd


def initialize_standings(teams: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for _, team in teams.iterrows():
        rows.append(
            {
                "team_id": team["team_id"],
                "team": team["name"],
                "code": team["code"],
                "group": team["group"],
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals_for": 0,
                "goals_against": 0,
                "goal_difference": 0,
                "points": 0,
            }
        )

    return pd.DataFrame(rows)


def apply_match_result(
    standings: pd.DataFrame,
    home_team: str,
    away_team: str,
    home_score: int,
    away_score: int,
) -> pd.DataFrame:
    standings = standings.copy()

    home_idx = standings.index[standings["team_id"] == home_team][0]
    away_idx = standings.index[standings["team_id"] == away_team][0]

    standings.loc[home_idx, "played"] += 1
    standings.loc[away_idx, "played"] += 1

    standings.loc[home_idx, "goals_for"] += home_score
    standings.loc[home_idx, "goals_against"] += away_score

    standings.loc[away_idx, "goals_for"] += away_score
    standings.loc[away_idx, "goals_against"] += home_score

    if home_score > away_score:
        standings.loc[home_idx, "wins"] += 1
        standings.loc[away_idx, "losses"] += 1
        standings.loc[home_idx, "points"] += 3
    elif away_score > home_score:
        standings.loc[away_idx, "wins"] += 1
        standings.loc[home_idx, "losses"] += 1
        standings.loc[away_idx, "points"] += 3
    else:
        standings.loc[home_idx, "draws"] += 1
        standings.loc[away_idx, "draws"] += 1
        standings.loc[home_idx, "points"] += 1
        standings.loc[away_idx, "points"] += 1

    standings["goal_difference"] = (
        standings["goals_for"] - standings["goals_against"]
    )

    return standings


def calculate_group_standings(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
    results: pd.DataFrame,
    group: str,
) -> pd.DataFrame:
    group_teams = teams[teams["group"] == group].copy()
    standings = initialize_standings(group_teams)

    completed_results = results[results["status"] == "Complete"].copy()

    matches = completed_results.merge(
        fixtures,
        on="match_id",
        how="left",
        validate="many_to_one",
    )

    group_matches = matches[matches["group"] == group].copy()

    for _, match in group_matches.iterrows():
        standings = apply_match_result(
            standings=standings,
            home_team=match["home_team"],
            away_team=match["away_team"],
            home_score=int(match["home_score"]),
            away_score=int(match["away_score"]),
        )

    standings = standings.sort_values(
        by=["points", "goal_difference", "goals_for"],
        ascending=[False, False, False],
    ).reset_index(drop=True)

    standings.insert(0, "rank", range(1, len(standings) + 1))

    return standings
