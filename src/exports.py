from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pandas as pd


def export_all_group_standings(
    standings_by_group: dict[str, pd.DataFrame],
    output_dir: str = "outputs",
) -> Path:
    rows = []

    for group, standings in standings_by_group.items():
        export_df = standings.copy()
        export_df.insert(0, "group_code", group)
        rows.append(export_df)

    all_standings = pd.concat(rows, ignore_index=True)

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    output_path = Path(output_dir) / "group_standings.csv"
    all_standings.to_csv(output_path, index=False)

    return output_path


def export_dataframe(
    dataframe: pd.DataFrame,
    filename: str,
    output_dir: str = "outputs",
) -> Path:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    output_path = Path(output_dir) / filename
    dataframe.to_csv(output_path, index=False)

    return output_path


def export_html_report(
    sections: list[tuple[str, pd.DataFrame]],
    output_dir: str = "outputs",
    filename: str = "index.html",
) -> Path:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    output_path = Path(output_dir) / filename

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    section_html = []

    for title, dataframe in sections:
        section_html.append(
            f"""
            <section>
              <h2>{title}</h2>
              {dataframe.to_html(index=False, border=0, classes="data-table")}
            </section>
            """
        )

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>World Cup Predictor Outputs</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 32px;
      color: #111827;
      background: #f9fafb;
    }}

    h1 {{
      margin-bottom: 4px;
    }}

    .timestamp {{
      color: #6b7280;
      margin-bottom: 32px;
    }}

    section {{
      margin-bottom: 40px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }}

    h2 {{
      margin-top: 0;
    }}

    .data-table {{
      border-collapse: collapse;
      width: 100%;
      font-size: 14px;
    }}

    .data-table th,
    .data-table td {{
      border-bottom: 1px solid #e5e7eb;
      padding: 8px 10px;
      text-align: left;
      white-space: nowrap;
    }}

    .data-table th {{
      background: #f3f4f6;
      font-weight: 600;
    }}

    .data-table tr:hover {{
      background: #f9fafb;
    }}
  </style>
</head>
<body>
  <h1>World Cup Predictor Outputs</h1>
  <div class="timestamp">Generated at {generated_at}</div>
  {''.join(section_html)}
</body>
</html>
"""

    output_path.write_text(html, encoding="utf-8")

    return output_path
