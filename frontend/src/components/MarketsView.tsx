import { useMemo } from "react";
import type { MarketComparison } from "../types";
import { ProbabilityBar } from "./ProbabilityBar";
import { ProbabilityDelta } from "./MovementSummary";
import { TeamBadge } from "./TeamBadge";

interface MarketsViewProps {
  marketComparison: MarketComparison | undefined;
  onSelectTeam: (code: string) => void;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatOdds(value: number): string {
  return value.toFixed(2);
}

export function MarketsView({
  marketComparison,
  onSelectTeam,
}: MarketsViewProps) {
  const teams = useMemo(
    () => marketComparison?.teams ?? [],
    [marketComparison?.teams],
  );

  if (!marketComparison?.available) {
    return (
      <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Model vs betting markets
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {marketComparison?.methodology ??
            "Market odds are not available yet. Run scripts/update_market_odds.py or wait for the next data refresh."}
        </p>
      </section>
    );
  }

  const { summary, source, as_of, methodology } = marketComparison;

  return (
    <div className="flex flex-col gap-10">
      <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Model vs betting markets
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {methodology}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="glass rounded-full px-3 py-1">Source: {source}</span>
            {as_of ? (
              <span className="glass rounded-full px-3 py-1">As of {as_of}</span>
            ) : null}
          </div>
        </div>

        {summary ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Model favorite
              </p>
              <div className="mt-2 flex items-center gap-3">
                <TeamBadge code={summary.model_favorite_code} />
                <span className="text-lg font-semibold text-foreground">
                  {summary.model_favorite_team}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Market favorite
              </p>
              <div className="mt-2 flex items-center gap-3">
                <TeamBadge code={summary.market_favorite_code} />
                <span className="text-lg font-semibold text-foreground">
                  {summary.market_favorite_team}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Agreement
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {summary.favorites_agree ? "Same pick" : "Different picks"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mean absolute gap:{" "}
                {formatPct(summary.mean_absolute_gap)} across{" "}
                {summary.compared_team_count} teams
              </p>
            </div>
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <li key={team.code}>
              <button
                type="button"
                onClick={() => onSelectTeam(team.code)}
                className="glass group flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TeamBadge code={team.code} />
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-foreground group-hover:text-gold">
                      {team.team}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatOdds(team.decimal_odds)} decimal odds
                    </div>
                  </div>
                </div>

                <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Model
                    </p>
                    <ProbabilityBar
                      value={team.model_champion_prob}
                      valueLabel={formatPct(team.model_champion_prob)}
                      size="sm"
                      tone="gold"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Market
                    </p>
                    <ProbabilityBar
                      value={team.market_implied_prob}
                      valueLabel={formatPct(team.market_implied_prob)}
                      size="sm"
                      tone="neutral"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 sm:w-24">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Delta
                  </span>
                  <ProbabilityDelta delta={team.delta} className="text-sm" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {team.delta >= 0 ? "Model higher" : "Market higher"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
