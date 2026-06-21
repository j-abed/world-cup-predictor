from __future__ import annotations

import pandas as pd


def validate_group_fixture_coverage(
    teams: pd.DataFrame,
    fixtures: pd.DataFrame,
) -> pd.DataFrame:
    rows = []

    for group, group_teams in teams.groupby("group"):
        expected_teams = set(group_teams["team_id"])
        group_fixtures = fixtures[
            (fixtures["stage"] == "Group") & (fixtures["group"] == group)
        ]

        fixture_teams = set(group_fixtures["home_team"]).union(
            set(group_fixtures["away_team"])
        )

        rows.append(
            {
                "group": group,
                "team_count": len(expected_teams),
                "fixture_count": len(group_fixtures),
                "expected_fixture_count": 6,
                "has_complete_fixture_set": len(group_fixtures) == 6,
                "missing_from_fixtures": ", ".join(sorted(expected_teams - fixture_teams)),
                "unexpected_in_fixtures": ", ".join(sorted(fixture_teams - expected_teams)),
            }
        )

    return pd.DataFrame(rows).sort_values("group").reset_index(drop=True)
