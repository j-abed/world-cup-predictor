from __future__ import annotations

from typing import Any


def _index_by_code(rows: list[dict[str, Any]], code_key: str = "code") -> dict[str, dict[str, Any]]:
    return {str(row[code_key]): row for row in rows}


def champion_odds_deltas(
    baseline: dict[str, Any],
    scenario: dict[str, Any],
    *,
    top_n: int = 10,
) -> list[dict[str, Any]]:
    baseline_rows = _index_by_code(baseline["odds"]["round"])
    scenario_rows = _index_by_code(scenario["odds"]["round"])

    deltas: list[dict[str, Any]] = []

    for code, baseline_row in baseline_rows.items():
        scenario_row = scenario_rows.get(code)
        if scenario_row is None:
            continue

        baseline_prob = float(baseline_row["champion_prob"])
        scenario_prob = float(scenario_row["champion_prob"])
        delta = scenario_prob - baseline_prob

        deltas.append(
            {
                "code": code,
                "team": baseline_row["team"],
                "baseline_prob": baseline_prob,
                "scenario_prob": scenario_prob,
                "delta": delta,
            }
        )

    deltas.sort(key=lambda row: abs(row["delta"]), reverse=True)
    return deltas[:top_n]


def qualification_deltas_for_codes(
    baseline: dict[str, Any],
    scenario: dict[str, Any],
    team_codes: set[str],
) -> list[dict[str, Any]]:
    baseline_rows = _index_by_code(baseline["odds"]["qualification"])
    scenario_rows = _index_by_code(scenario["odds"]["qualification"])

    rows: list[dict[str, Any]] = []

    for code in sorted(team_codes):
        baseline_row = baseline_rows.get(code)
        scenario_row = scenario_rows.get(code)

        if baseline_row is None or scenario_row is None:
            continue

        baseline_prob = float(baseline_row["qualify_prob"])
        scenario_prob = float(scenario_row["qualify_prob"])

        rows.append(
            {
                "code": code,
                "team": baseline_row["team"],
                "group": baseline_row["group"],
                "baseline_prob": baseline_prob,
                "scenario_prob": scenario_prob,
                "delta": scenario_prob - baseline_prob,
            }
        )

    rows.sort(key=lambda row: abs(row["delta"]), reverse=True)
    return rows


def team_codes_for_overrides(
    fixtures: list[dict[str, Any]],
    overrides: list[dict[str, Any]],
) -> set[str]:
    by_match_id = {int(row["match_id"]): row for row in fixtures}
    codes: set[str] = set()

    for override in overrides:
        fixture = by_match_id.get(int(override["match_id"]))
        if fixture is None:
            continue
        codes.add(str(fixture["home_code"]))
        codes.add(str(fixture["away_code"]))

    return codes


def _format_pct(value: float) -> str:
    return f"{value * 100:5.1f}%"


def _format_delta(value: float) -> str:
    points = value * 100
    sign = "+" if points >= 0 else ""
    return f"{sign}{points:4.1f} pp"


def format_scenario_report(
    scenario: dict[str, Any],
    baseline: dict[str, Any] | None,
) -> str:
    scenario_meta = scenario["metadata"]["scenario"]
    lines: list[str] = []

    lines.append(f"Scenario: {scenario_meta['label']}")
    lines.append(f"Simulations: {scenario_meta['simulations']:,}")
    lines.append("")

    if baseline is None:
        lines.append("Baseline snapshot not found — showing scenario champion odds only.")
        lines.append("")
        top = sorted(
            scenario["odds"]["round"],
            key=lambda row: row["champion_prob"],
            reverse=True,
        )[:10]
        lines.append("Top champion odds:")
        lines.append(f"  {'Team':<22} {'Odds':>7}")
        lines.append(f"  {'-' * 22} {'-' * 7}")
        for row in top:
            lines.append(
                f"  {row['team']:<22} {_format_pct(float(row['champion_prob'])):>7}"
            )
        return "\n".join(lines)

    lines.append("Champion odds vs baseline:")
    lines.append(
        f"  {'Team':<22} {'Baseline':>9} {'Scenario':>9} {'Change':>9}"
    )
    lines.append(f"  {'-' * 22} {'-' * 9} {'-' * 9} {'-' * 9}")

    for row in champion_odds_deltas(baseline, scenario):
        lines.append(
            f"  {row['team']:<22} "
            f"{_format_pct(row['baseline_prob']):>9} "
            f"{_format_pct(row['scenario_prob']):>9} "
            f"{_format_delta(row['delta']):>9}"
        )

    match_codes = team_codes_for_overrides(
        scenario["fixtures"],
        scenario_meta["overrides"],
    )

    if match_codes:
        qual_rows = qualification_deltas_for_codes(
            baseline,
            scenario,
            match_codes,
        )

        if qual_rows:
            lines.append("")
            lines.append("Qualification odds for teams in this scenario:")
            lines.append(
                f"  {'Team':<22} {'Baseline':>9} {'Scenario':>9} {'Change':>9}"
            )
            lines.append(f"  {'-' * 22} {'-' * 9} {'-' * 9} {'-' * 9}")

            for row in qual_rows:
                lines.append(
                    f"  {row['team']:<22} "
                    f"{_format_pct(row['baseline_prob']):>9} "
                    f"{_format_pct(row['scenario_prob']):>9} "
                    f"{_format_delta(row['delta']):>9}"
                )

    return "\n".join(lines)
