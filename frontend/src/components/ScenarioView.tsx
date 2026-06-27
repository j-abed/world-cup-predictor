import { useMemo } from "react";
import type { AppState, RoundOdds } from "../types";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface ScenarioViewProps {
  baseline: AppState;
  scenario: AppState | null;
  onSelectTeam: (code: string) => void;
}

function championDelta(
  baseline: RoundOdds[],
  scenario: RoundOdds[],
): Array<{
  code: string;
  team: string;
  baselineProb: number;
  scenarioProb: number;
  delta: number;
}> {
  const scenarioByCode = new Map(scenario.map((row) => [row.code, row]));

  return baseline
    .map((row) => {
      const other = scenarioByCode.get(row.code);
      const scenarioProb = other?.champion_prob ?? 0;

      return {
        code: row.code,
        team: row.team,
        baselineProb: row.champion_prob,
        scenarioProb,
        delta: scenarioProb - row.champion_prob,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function ScenarioView({
  baseline,
  scenario,
  onSelectTeam,
}: ScenarioViewProps) {
  const deltas = useMemo(() => {
    if (!scenario) return [];
    return championDelta(baseline.odds.round, scenario.odds.round);
  }, [baseline.odds.round, scenario]);

  if (!scenario) {
    return (
      <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          What-if scenarios
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          No active scenario right now. When a what-if projection is published,
          this tab will show how championship odds shift compared to the current
          baseline.
        </p>
      </section>
    );
  }

  const scenarioLabel = scenario.metadata.scenario?.label ?? "Custom scenario";

  return (
    <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            What-if scenario
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{scenarioLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Champion odds compared to the current baseline projection.
          </p>
        </div>
        <span className="glass rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
          {scenario.metadata.simulations.round.toLocaleString()} simulations
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {deltas.slice(0, 12).map((row) => (
          <button
            key={row.code}
            type="button"
            onClick={() => onSelectTeam(row.code)}
            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-4 text-left transition hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <TeamBadge code={row.code} />
              <span className="truncate text-sm font-medium text-foreground">
                {row.team}
              </span>
            </div>

            <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Baseline
                </p>
                <ProbabilityBar
                  value={row.baselineProb}
                  valueLabel={`${(row.baselineProb * 100).toFixed(1)}%`}
                  size="sm"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Scenario
                </p>
                <ProbabilityBar
                  value={row.scenarioProb}
                  valueLabel={`${(row.scenarioProb * 100).toFixed(1)}%`}
                  size="sm"
                />
              </div>
            </div>

            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                row.delta > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : row.delta < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground"
              }`}
            >
              {row.delta >= 0 ? "+" : ""}
              {(row.delta * 100).toFixed(1)} pp
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
