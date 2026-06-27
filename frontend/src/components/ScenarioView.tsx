import { useMemo } from "react";
import type { AppState, RoundOdds } from "../types";
import {
  CommandDataRow,
  CommandMetaChip,
  CommandPanel,
} from "./CommandPanel";
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
      <CommandPanel
        eyebrow="What-if engine"
        title="What-if scenarios"
        subtitle="No active scenario right now. When a what-if projection is published, this tab will show how championship odds shift compared to the current baseline."
      />
    );
  }

  const scenarioLabel = scenario.metadata.scenario?.label ?? "Custom scenario";

  return (
    <CommandPanel
      eyebrow="What-if engine"
      title="What-if scenario"
      subtitle={`${scenarioLabel} — champion odds compared to the current baseline projection.`}
      meta={
        <CommandMetaChip>
          {scenario.metadata.simulations.round.toLocaleString()} simulations
        </CommandMetaChip>
      }
    >
      <ul className="command-data-list">
        {deltas.slice(0, 12).map((row) => (
          <li key={row.code}>
            <CommandDataRow onClick={() => onSelectTeam(row.code)}>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamBadge code={row.code} />
                <span className="truncate text-sm font-medium">{row.team}</span>
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
                className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                  row.delta > 0
                    ? "text-emerald-400"
                    : row.delta < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                }`}
              >
                {row.delta >= 0 ? "+" : ""}
                {(row.delta * 100).toFixed(1)} pp
              </span>
            </CommandDataRow>
          </li>
        ))}
      </ul>
    </CommandPanel>
  );
}
