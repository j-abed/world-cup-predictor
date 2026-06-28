import { useMemo } from "react";
import type { Backtest2022 } from "../types/backtest";
import {
  CommandDataRow,
  CommandMetaChip,
  CommandPanel,
  CommandPanelStack,
  CommandStat,
  CommandStatGrid,
  CommandSubcard,
} from "./CommandPanel";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface BacktestViewProps {
  backtest: Backtest2022 | null;
  onSelectTeam: (code: string) => void;
  knownTeamCodes: ReadonlySet<string>;
}

const ROUND_LABELS: Record<string, string> = {
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinals",
  semifinal: "Semifinals",
  final: "Final",
  champion: "Champion",
};

function formatRoundLabel(round: string): string {
  return ROUND_LABELS[round] ?? round;
}

export function BacktestView({
  backtest,
  onSelectTeam,
  knownTeamCodes,
}: BacktestViewProps) {
  const standingsByGroup = useMemo(() => {
    if (!backtest) return new Map<string, Backtest2022["standings"]>();

    const grouped = new Map<string, Backtest2022["standings"]>();

    for (const row of backtest.standings) {
      const existing = grouped.get(row.group_code) ?? [];
      existing.push(row);
      grouped.set(row.group_code, existing);
    }

    return grouped;
  }, [backtest]);

  if (!backtest) {
    return (
      <CommandPanel
        eyebrow="Calibration replay"
        title="2022 historical backtest"
        subtitle="Backtest data is not available yet. Regenerate it with the export script and refresh the deployed snapshot."
      />
    );
  }

  const { metadata, summary, round_metrics, teams, notable_upsets } = backtest;

  return (
    <CommandPanelStack>
      <CommandPanel
        eyebrow="Calibration replay"
        title={metadata.tournament}
        subtitle={metadata.label}
        meta={
          <>
            <CommandMetaChip>
              {metadata.simulations.toLocaleString()} simulations
            </CommandMetaChip>
            <CommandMetaChip>Ratings {metadata.ratings_as_of}</CommandMetaChip>
          </>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">{metadata.methodology}</p>

        <CommandStatGrid>
          <CommandStat label="Actual champion">
            <div className="flex items-center gap-2">
              <TeamBadge code={summary.actual_champion} />
              <span className="font-semibold">{summary.actual_champion_team}</span>
            </div>
          </CommandStat>
          <CommandStat label="Model rank pre-tournament">
            <p className="command-stat__value--hero">#{summary.predicted_champion_rank}</p>
          </CommandStat>
          <CommandStat label="Model champion probability">
            <p className="command-stat__value--hero">
              {(summary.predicted_champion_probability * 100).toFixed(1)}%
            </p>
          </CommandStat>
        </CommandStatGrid>
      </CommandPanel>

      <CommandPanel
        eyebrow="Knockout overlap"
        title="Vs actual results"
        subtitle="For each round, how many actual participants appeared in the model's top-N by reach probability before kickoff."
      >
        <div className="command-data-list">
          {round_metrics.map((metric) => {
            const ratio =
              metric.top_n > 0
                ? metric.actual_teams_in_top_n / metric.top_n
                : 0;

            return (
              <div key={metric.round} className="command-data-row command-data-row--static">
                <span className="text-sm font-medium">
                  {formatRoundLabel(metric.round)}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {metric.actual_teams_in_top_n}/{metric.top_n}
                </span>
                <ProbabilityBar value={ratio} size="sm" />
              </div>
            );
          })}
        </div>
      </CommandPanel>

      <CommandPanel
        eyebrow="Pre-tournament outlook"
        title="Team probabilities"
        subtitle="Qualification and title odds from the replay, compared to who actually reached the Round of 16."
      >
        <ul className="command-data-list">
          {teams.map((team) => {
            const clickable = knownTeamCodes.has(team.code);

            return (
              <li key={team.code}>
                <CommandDataRow
                  onClick={clickable ? () => onSelectTeam(team.code) : undefined}
                  className={clickable ? "" : "command-data-row--static opacity-80"}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <TeamBadge code={team.code} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{team.team}</p>
                      <p className="text-xs text-muted-foreground">
                        Group {team.group}
                        {team.actual_champion ? " · Champion" : ""}
                        {team.actual_made_round_of_16 && !team.actual_champion
                          ? " · R16"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Qualify
                      </p>
                      <ProbabilityBar
                        value={team.qualify_prob}
                        valueLabel={`${(team.qualify_prob * 100).toFixed(0)}%`}
                        size="sm"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Champion
                      </p>
                      <ProbabilityBar
                        value={team.champion_prob}
                        valueLabel={`${(team.champion_prob * 100).toFixed(1)}%`}
                        size="sm"
                      />
                    </div>
                  </div>
                </CommandDataRow>
              </li>
            );
          })}
        </ul>
      </CommandPanel>

      <CommandPanel eyebrow="Upsets" title="Notable results" subtitle={metadata.tournament}>
        <ul className="command-data-list">
          {notable_upsets.map((upset) => (
            <li key={upset.match}>
              <CommandSubcard className="command-subcard--flat">
                <p className="font-medium">{upset.match}</p>
                <p className="mt-1 text-sm text-muted-foreground">{upset.note}</p>
              </CommandSubcard>
            </li>
          ))}
        </ul>
      </CommandPanel>

      <CommandPanel eyebrow="Group stage" title="Actual final standings">
        <div className="command-group-grid">
          {[...standingsByGroup.entries()].map(([group, rows]) => (
            <CommandSubcard key={group} className="command-subcard--flat">
              <p className="command-section__title">Group {group}</p>
              <ol className="mt-2 flex flex-col gap-1">
                  {rows.map((row) => (
                    <li
                      key={row.code}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">{row.team}</span>
                      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                        {row.points} pts
                      </span>
                    </li>
                  ))}
                </ol>
            </CommandSubcard>
          ))}
        </div>
      </CommandPanel>
    </CommandPanelStack>
  );
}
