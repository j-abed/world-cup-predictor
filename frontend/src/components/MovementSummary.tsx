import type { Movement } from "../types";
import {
  formatProbabilityDelta,
  movementMetricLabel,
} from "../lib/movement";
import { TeamBadge } from "./TeamBadge";

interface MovementSummaryProps {
  movement: Movement | undefined;
}

function deltaClassName(delta: number): string {
  if (delta > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (delta < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-muted-foreground";
}

export function ProbabilityDelta({
  delta,
  className = "",
}: {
  delta: number;
  className?: string;
}) {
  if (delta === 0) {
    return null;
  }

  return (
    <span
      className={`text-xs font-semibold tabular-nums ${deltaClassName(delta)} ${className}`}
    >
      {formatProbabilityDelta(delta)}
    </span>
  );
}

export function MovementSummary({ movement }: MovementSummaryProps) {
  if (!movement?.has_baseline) {
    return null;
  }

  const { biggest_movers, baseline_generated_at } = movement;

  if (biggest_movers.length === 0) {
    return null;
  }

  return (
    <section className="pitch-card mb-8 rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Biggest movers
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Largest probability shifts since the previous refresh
            {baseline_generated_at ? ` (${baseline_generated_at})` : ""}.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {biggest_movers.map((row) => (
          <li
            key={`${row.code}-${row.metric}`}
            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <TeamBadge code={row.code} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.team}
                </p>
                <p className="text-xs text-muted-foreground">
                  {movementMetricLabel(row.metric)} odds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span className="text-muted-foreground">
                {(row.previous * 100).toFixed(1)}% → {(row.current * 100).toFixed(1)}%
              </span>
              <ProbabilityDelta delta={row.delta} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
