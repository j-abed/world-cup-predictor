import { useMemo } from "react";
import type { Backtest2022 } from "../types/backtest";
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
      <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          2022 historical backtest
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Backtest data is not available yet. Regenerate it with the export
          script and refresh the deployed snapshot.
        </p>
      </section>
    );
  }

  const { metadata, summary, round_metrics, teams, notable_upsets } = backtest;

  return (
    <div className="flex flex-col gap-10">
      <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {metadata.tournament}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{metadata.label}</p>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {metadata.methodology}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="glass rounded-full px-3 py-1">
              {metadata.simulations.toLocaleString()} simulations
            </span>
            <span className="glass rounded-full px-3 py-1">
              Ratings as of {metadata.ratings_as_of}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Actual champion
            </p>
            <div className="mt-2 flex items-center gap-3">
              <TeamBadge code={summary.actual_champion} />
              <span className="text-lg font-semibold text-foreground">
                {summary.actual_champion_team}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Model rank pre-tournament
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              #{summary.predicted_champion_rank}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Model champion probability
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {(summary.predicted_champion_probability * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      <section className="pitch-card rounded-3xl p-5 sm:p-8">
        <h3 className="text-lg font-semibold text-foreground">
          Knockout overlap vs actual
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          For each round, how many actual participants appeared in the model&apos;s
          top-N by reach probability before kickoff.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {round_metrics.map((metric) => {
            const ratio =
              metric.top_n > 0
                ? metric.actual_teams_in_top_n / metric.top_n
                : 0;

            return (
              <div key={metric.round} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    {formatRoundLabel(metric.round)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {metric.actual_teams_in_top_n}/{metric.top_n}
                  </span>
                </div>
                <ProbabilityBar value={ratio} size="sm" />
              </div>
            );
          })}
        </div>
      </section>

      <section className="pitch-card rounded-3xl p-5 sm:p-8">
        <h3 className="text-lg font-semibold text-foreground">
          Pre-tournament team outlook
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Qualification and title odds from the replay, compared to who actually
          reached the Round of 16.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {teams.map((team) => {
            const clickable = knownTeamCodes.has(team.code);

            return (
              <button
                key={team.code}
                type="button"
                disabled={!clickable}
                onClick={() => onSelectTeam(team.code)}
                className={`flex flex-col gap-3 rounded-xl border border-border/60 p-4 text-left sm:flex-row sm:items-center sm:gap-4 ${
                  clickable
                    ? "bg-background/40 transition hover:bg-muted/40"
                    : "cursor-default bg-background/20 opacity-80"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TeamBadge code={team.code} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {team.team}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Group {team.group}
                      {team.actual_champion ? " · Champion" : ""}
                      {team.actual_made_round_of_16 && !team.actual_champion
                        ? " · R16"
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="grid w-full gap-3 sm:max-w-lg sm:grid-cols-2">
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
              </button>
            );
          })}
        </div>
      </section>

      <section className="pitch-card rounded-3xl p-5 sm:p-8">
        <h3 className="text-lg font-semibold text-foreground">Notable upsets</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {notable_upsets.map((upset) => (
            <li
              key={upset.match}
              className="rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <p className="font-medium text-foreground">{upset.match}</p>
              <p className="mt-1 text-sm text-muted-foreground">{upset.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pitch-card rounded-3xl p-5 sm:p-8">
        <h3 className="text-lg font-semibold text-foreground">
          Actual final group standings
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...standingsByGroup.entries()].map(([group, rows]) => (
            <div
              key={group}
              className="rounded-xl border border-border/60 bg-background/40 p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group {group}
              </p>
              <ol className="flex flex-col gap-1">
                {rows.map((row) => (
                  <li
                    key={row.code}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-foreground">{row.team}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.points} pts
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
