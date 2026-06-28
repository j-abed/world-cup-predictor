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
    <section className="movers-board">
      <header className="movers-board__header">
        <p className="movers-board__eyebrow">Run-over-run</p>
        <h3 className="movers-board__title">Biggest movers</h3>
        <p className="movers-board__subtitle">
          Largest probability shifts since the previous refresh
          {baseline_generated_at ? ` (${baseline_generated_at})` : ""}.
        </p>
      </header>

      <ul className="movers-board__list">
        {biggest_movers.map((row) => (
          <li
            key={`${row.code}-${row.metric}`}
            className="movers-board__row"
          >
            <div className="movers-board__team">
              <TeamBadge code={row.code} size="sm" />
              <div className="min-w-0">
                <p className="movers-board__name">{row.team}</p>
                <p className="movers-board__metric">
                  {movementMetricLabel(row.metric)} odds
                </p>
              </div>
            </div>

            <div className="movers-board__delta">
              <span className="movers-board__range">
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
