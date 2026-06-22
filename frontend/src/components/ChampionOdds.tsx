import { useMemo, useState } from "react";
import type { RoundOdds } from "../types";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface ChampionOddsProps {
  round: RoundOdds[];
  onSelectTeam: (code: string) => void;
}

const DEFAULT_VISIBLE = 10;

export function ChampionOdds({ round, onSelectTeam }: ChampionOddsProps) {
  const [expanded, setExpanded] = useState(false);

  const ranked = useMemo(
    () => [...round].sort((a, b) => b.champion_prob - a.champion_prob),
    [round],
  );

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const visibleRest = expanded ? rest : rest.slice(0, DEFAULT_VISIBLE - 3);

  return (
    <section className="pitch-card-strong relative overflow-hidden rounded-3xl p-5 sm:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Champion Odds
          </h2>
          <p className="text-sm text-muted-foreground">
            Simulated probability of winning the tournament outright.
          </p>
        </div>
        <span className="glass rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
          {ranked.length} teams ranked
        </span>
      </div>

      {/* Podium — the three favourites, visually prominent */}
      <div className="relative mb-8 grid gap-4 sm:grid-cols-3">
        {podium.map((team, i) => {
          const rank = i + 1;
          return (
            <button
              key={team.code}
              type="button"
              onClick={() => onSelectTeam(team.code)}
              className={`group flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg ${
                rank === 1
                  ? "border border-accent/50 bg-accent/10 sm:order-2 sm:scale-105"
                  : "glass sm:order-none"
              } ${rank === 2 ? "sm:order-1" : ""} ${rank === 3 ? "sm:order-3" : ""}`}
            >
              <span className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                #{rank}
              </span>
              <TeamBadge code={team.code} rank={rank} size="lg" />
              <div>
                <div className="font-display text-lg font-semibold text-foreground group-hover:text-gold">
                  {team.team}
                </div>
                <div className="text-xs text-muted-foreground">
                  Group {team.group}
                </div>
              </div>
              <div className="w-full">
                <ProbabilityBar
                  value={team.champion_prob}
                  valueLabel={team.champion_prob_label}
                  size="lg"
                  tone="gold"
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Ranked list — secondary contenders */}
      <ul className="relative flex flex-col gap-2">
        {visibleRest.map((team, i) => {
          const rank = i + 4;
          return (
            <li key={team.code}>
              <button
                type="button"
                onClick={() => onSelectTeam(team.code)}
                className="glass flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:border-accent/40"
              >
                <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground">
                  {rank}
                </span>
                <TeamBadge code={team.code} size="sm" />
                <div className="w-36 shrink-0 truncate sm:w-44">
                  <div className="truncate text-sm font-medium text-foreground">
                    {team.team}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Group {team.group}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <ProbabilityBar
                    value={team.champion_prob}
                    valueLabel={team.champion_prob_label}
                    size="sm"
                    tone="gold"
                  />
                </div>
                <div className="hidden w-24 shrink-0 text-right text-[11px] text-muted-foreground sm:block">
                  Final {team.final_prob_label.trim()}
                </div>
                <div className="hidden w-28 shrink-0 text-right text-[11px] text-muted-foreground md:block">
                  Semifinal {team.sf_prob_label.trim()}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {rest.length > DEFAULT_VISIBLE - 3 && (
        <div className="relative mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="glass rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-accent/50 hover:text-gold"
          >
            {expanded ? "Show fewer teams" : `Show all ${ranked.length} teams`}
          </button>
        </div>
      )}
    </section>
  );
}
