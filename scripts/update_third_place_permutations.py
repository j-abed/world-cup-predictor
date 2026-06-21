from __future__ import annotations

from pathlib import Path
from urllib.request import Request, urlopen

import pandas as pd
from bs4 import BeautifulSoup


SOURCE_URL = "https://en.wikipedia.org/wiki/Template:2026_FIFA_World_Cup_third-place_table"
OUTPUT_PATH = Path("data/third_place_permutations.csv")

# Published matchup order:
# 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
#
# Our bracket slots:
# 1A -> R32-79
# 1B -> R32-85
# 1D -> R32-81
# 1E -> R32-74
# 1G -> R32-82
# 1I -> R32-77
# 1K -> R32-87
# 1L -> R32-80
MATCHUP_TO_SLOT_IN_ORDER = [
    ("1A", "slot_79"),
    ("1B", "slot_85"),
    ("1D", "slot_81"),
    ("1E", "slot_74"),
    ("1G", "slot_82"),
    ("1I", "slot_77"),
    ("1K", "slot_87"),
    ("1L", "slot_80"),
]

VALID_GROUPS = set("ABCDEFGHIJKL")


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0 Safari/537.36"
            )
        },
    )

    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def clean_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split()).strip()


def normalize_group_list(value: str) -> str:
    text = clean_text(value)
    groups = [part for part in text.replace(",", " ").split() if part in VALID_GROUPS]

    if len(groups) != 8:
        raise ValueError(
            f"Expected 8 advancing third-place groups, got {groups} from {value!r}"
        )

    return "-".join(sorted(groups))


def normalize_third_place_value(value: str) -> str:
    text = clean_text(value).replace(" ", "")

    if not text.startswith("3") or len(text) < 2:
        raise ValueError(f"Invalid third-place table value: {value!r}")

    group = text[-1]

    if group not in VALID_GROUPS:
        raise ValueError(f"Invalid third-place group in value: {value!r}")

    return group


def extract_rows_from_html(html: str) -> list[list[str]]:
    soup = BeautifulSoup(html, "html.parser")

    rows: list[list[str]] = []

    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            raw_cells = [
                clean_text(cell.get_text(" ", strip=True))
                for cell in tr.find_all(["th", "td"])
            ]

            # Wikipedia's template table can include blank cells / spacer cells.
            # Remove blanks before interpreting row positions.
            cells = [cell for cell in raw_cells if cell]

            if not cells:
                continue

            # Data rows begin with scenario number 1..495.
            if not cells[0].isdigit():
                continue

            # Expected normalized row shape:
            # no, advancing groups, 1A assignment, 1B assignment, 1D assignment,
            # 1E assignment, 1G assignment, 1I assignment, 1K assignment, 1L assignment.
            if len(cells) < 10:
                continue

            rows.append(cells)

    return rows


def main() -> None:
    html = fetch_html(SOURCE_URL)
    rows = extract_rows_from_html(html)

    if len(rows) != 495:
        raise RuntimeError(f"Expected 495 permutation rows, found {len(rows)}.")

    output_rows = []

    for cells in rows:
        scenario_number = int(cells[0])

        # Wikipedia may parse the advancing groups either as:
        #   "E F G H I J K L"
        # or as separate cells:
        #   "E", "F", "G", "H", "I", "J", "K", "L"
        remaining_cells = cells[1:]

        if len(remaining_cells) >= 16 and all(
            cell in VALID_GROUPS for cell in remaining_cells[:8]
        ):
            qualifying_group_values = remaining_cells[:8]
            assignment_values = remaining_cells[8:16]
            qualifying_groups = "-".join(sorted(qualifying_group_values))
        else:
            qualifying_groups = normalize_group_list(remaining_cells[0])
            assignment_values = remaining_cells[1:9]

        if len(assignment_values) != 8:
            raise RuntimeError(
                f"Expected 8 assignment values for scenario {scenario_number}, "
                f"got {assignment_values} from cells {cells}"
            )

        output_row = {
            "scenario_number": scenario_number,
            "qualifying_groups": qualifying_groups,
            "source_url": SOURCE_URL,
        }

        for (_, slot_column), assignment_value in zip(
            MATCHUP_TO_SLOT_IN_ORDER,
            assignment_values,
            strict=True,
        ):
            output_row[slot_column] = normalize_third_place_value(assignment_value)

        assigned_groups = [
            output_row[slot_column]
            for _, slot_column in MATCHUP_TO_SLOT_IN_ORDER
        ]

        if sorted(assigned_groups) != qualifying_groups.split("-"):
            raise RuntimeError(
                f"Scenario {scenario_number} assignment mismatch. "
                f"Qualifying groups: {qualifying_groups}; "
                f"assigned groups: {assigned_groups}"
            )

        output_rows.append(output_row)

    permutations = pd.DataFrame(output_rows)

    expected_columns = [
        "scenario_number",
        "qualifying_groups",
        "slot_74",
        "slot_77",
        "slot_79",
        "slot_80",
        "slot_81",
        "slot_82",
        "slot_85",
        "slot_87",
        "source_url",
    ]

    permutations = permutations[expected_columns].sort_values("scenario_number")

    if permutations["qualifying_groups"].duplicated().any():
        duplicates = permutations[
            permutations["qualifying_groups"].duplicated(keep=False)
        ]["qualifying_groups"].tolist()
        raise RuntimeError(f"Duplicate qualifying group combinations found: {duplicates}")

    if len(set(permutations["qualifying_groups"])) != 495:
        raise RuntimeError("Expected 495 unique qualifying group combinations.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    permutations.to_csv(OUTPUT_PATH, index=False)

    print(f"Wrote {OUTPUT_PATH}")
    print()
    print(permutations.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
