import { useMemo } from "react";
import type { MarketComparison } from "../types";
import {
  CommandDataRow,
  CommandMetaChip,
  CommandPanel,
  CommandStat,
  CommandStatGrid,
} from "./CommandPanel";
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
      <CommandPanel
        eyebrow="Market overlay"
        title="Model vs betting markets"
        subtitle={
          marketComparison?.methodology ??
          "Market odds are not available yet. Run scripts/update_market_odds.py or wait for the next data refresh."
        }
      />
    );
  }

  const { summary, source, as_of, methodology } = marketComparison;

  return (
    <CommandPanel
      eyebrow="Market overlay"
      title="Model vs betting markets"
      subtitle={methodology}
      meta={
        <>
          <CommandMetaChip>Source: {source}</CommandMetaChip>
          {as_of ? <CommandMetaChip>As of {as_of}</CommandMetaChip> : null}
        </>
      }
    >
      {summary ? (
        <CommandStatGrid>
          <CommandStat label="Model favorite">
            <div className="flex items-center gap-2">
              <TeamBadge code={summary.model_favorite_code} />
              <span className="font-semibold">{summary.model_favorite_team}</span>
            </div>
          </CommandStat>
          <CommandStat label="Market favorite">
            <div className="flex items-center gap-2">
              <TeamBadge code={summary.market_favorite_code} />
              <span className="font-semibold">{summary.market_favorite_team}</span>
            </div>
          </CommandStat>
          <CommandStat label="Agreement">
            <p className="command-stat__value--hero">
              {summary.favorites_agree ? "Aligned" : "Split"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mean abs gap {formatPct(summary.mean_absolute_gap)} ·{" "}
              {summary.compared_team_count} teams
            </p>
          </CommandStat>
        </CommandStatGrid>
      ) : null}

      <ul className="command-data-list">
        {teams.map((team) => (
          <li key={team.code}>
            <CommandDataRow onClick={() => onSelectTeam(team.code)}>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamBadge code={team.code} />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">
                    {team.team}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatOdds(team.decimal_odds)} decimal odds
                  </div>
                </div>
              </div>

              <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
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
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
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

              <div className="flex shrink-0 flex-col items-end gap-0.5 sm:w-24">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Delta
                </span>
                <ProbabilityDelta delta={team.delta} className="text-sm" />
              </div>
            </CommandDataRow>
          </li>
        ))}
      </ul>
    </CommandPanel>
  );
}
