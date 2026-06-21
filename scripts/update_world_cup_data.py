from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path


RESULTS_PATH = Path("data/results.csv")
SYNC_SCRIPT = Path("scripts/sync_results_from_espn.py")
MAIN_SCRIPT = Path("main.py")
WEB_EXPORT_SCRIPT = Path("scripts/export_web_state.py")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update World Cup data and optionally rerun the model."
    )

    date_group = parser.add_mutually_exclusive_group()
    date_group.add_argument(
        "--today",
        action="store_true",
        help="Sync results for today's date.",
    )
    date_group.add_argument(
        "--yesterday",
        action="store_true",
        help="Sync results for yesterday's date.",
    )
    date_group.add_argument(
        "--date",
        help="Sync one date in YYYY-MM-DD format.",
    )
    date_group.add_argument(
        "--last-days",
        type=int,
        help="Sync a rolling range ending today. Example: --last-days 3",
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
        "--force",
        action="store_true",
        help="Overwrite existing completed results from ESPN.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show sync changes without writing data/results.csv.",
    )
    parser.add_argument(
        "--run-model",
        action="store_true",
        help="Run uv run python main.py after syncing.",
    )
    parser.add_argument(
        "--skip-sync",
        action="store_true",
        help="Skip ESPN sync and only run the model if --run-model is supplied.",
    )
    parser.add_argument(
        "--export-web",
        action="store_true",
        help="Export web-app-ready JSON files to outputs/web.",
    )

    return parser.parse_args()


def require_file(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Required file not found: {path}")


def parse_iso_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise SystemExit(f"Invalid date '{value}'. Expected YYYY-MM-DD.") from exc


def build_sync_command(args: argparse.Namespace) -> list[str]:
    command = [
        "uv",
        "run",
        "python",
        str(SYNC_SCRIPT),
    ]

    if args.today:
        command.extend(["--date", date.today().isoformat()])
    elif args.yesterday:
        command.extend(["--date", (date.today() - timedelta(days=1)).isoformat()])
    elif args.date:
        parse_iso_date(args.date)
        command.extend(["--date", args.date])
    elif args.last_days is not None:
        if args.last_days < 1:
            raise SystemExit("--last-days must be 1 or greater.")

        end = date.today()
        start = end - timedelta(days=args.last_days - 1)
        command.extend(["--start-date", start.isoformat(), "--end-date", end.isoformat()])
    elif args.start_date or args.end_date:
        if not args.start_date or not args.end_date:
            raise SystemExit("Use both --start-date and --end-date.")

        start = parse_iso_date(args.start_date)
        end = parse_iso_date(args.end_date)

        if end < start:
            raise SystemExit("--end-date must be on or after --start-date.")

        command.extend(["--start-date", args.start_date, "--end-date", args.end_date])
    else:
        # Safe default: sync today.
        command.extend(["--date", date.today().isoformat()])

    if args.force:
        command.append("--force")

    if args.dry_run:
        command.append("--dry-run")

    return command


def run_command(command: list[str]) -> None:
    print()
    print("$ " + " ".join(command))
    print()

    result = subprocess.run(command)

    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> None:
    args = parse_args()

    require_file(RESULTS_PATH)
    require_file(MAIN_SCRIPT)

    if not args.skip_sync:
        require_file(SYNC_SCRIPT)
        run_command(build_sync_command(args))

    if args.run_model:
        run_command(["uv", "run", "python", str(MAIN_SCRIPT)])
    else:
        print()
        print("Sync complete. To rerun the model:")
        print("  uv run python main.py")

    if args.export_web:
        require_file(WEB_EXPORT_SCRIPT)
        run_command(["uv", "run", "python", str(WEB_EXPORT_SCRIPT)])


if __name__ == "__main__":
    main()
