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
    <section className="relative overflow-hidden rounded-3xl border border-pitch-700 bg-gradient-to-b from-pitch-850 to-pitch-900 p-5 shadow-2xl shadow-black/40 sm:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-pitch-100 sm:text-3xl">
            Champion Odds
          </h2>
          <p className="text-sm text-pitch-300">
            Simulated probability of winning the tournament outright.
          </p>
        </div>
        <span className="rounded-full border border-pitch-600 bg-pitch-800/80 px-3 py-1 text-xs font-medium text-pitch-300">
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
              className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg ${
                rank === 1
                  ? "border-gold-400/60 bg-gradient-to-b from-gold-500/15 to-transparent sm:order-2 sm:scale-105"
                  : "border-pitch-700 bg-pitch-800/50 sm:order-none"
              } ${rank === 2 ? "sm:order-1" : ""} ${rank === 3 ? "sm:order-3" : ""}`}
            >
              <span className="font-display text-xs font-bold uppercase tracking-widest text-pitch-400">
                #{rank}
              </span>
              <TeamBadge code={team.code} rank={rank} size="lg" />
              <div>
                <div className="font-display text-lg font-semibold text-pitch-100 group-hover:text-gold-300">
                  {team.team}
                </div>
                <div className="text-xs text-pitch-400">Group {team.group}</div>
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
                className="flex w-full items-center gap-4 rounded-xl border border-pitch-800 bg-pitch-900/60 p-3 text-left transition hover:border-pitch-600 hover:bg-pitch-800/70"
              >
                <span className="w-6 shrink-0 text-center font-mono text-sm text-pitch-400">
                  {rank}
                </span>
                <TeamBadge code={team.code} size="sm" />
                <div className="w-36 shrink-0 truncate sm:w-44">
                  <div className="truncate text-sm font-medium text-pitch-100">
                    {team.team}
                  </div>
                  <div className="text-[11px] text-pitch-400">
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
                <div className="hidden w-24 shrink-0 text-right text-[11px] text-pitch-400 sm:block">
                  Final {team.final_prob_label.trim()}
                </div>
                <div className="hidden w-28 shrink-0 text-right text-[11px] text-pitch-400 md:block">
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
            className="rounded-full border border-pitch-600 bg-pitch-800 px-4 py-1.5 text-xs font-semibold text-pitch-200 transition hover:border-gold-400/60 hover:text-gold-300"
          >
            {expanded ? "Show fewer teams" : `Show all ${ranked.length} teams`}
          </button>
        </div>
      )}
    </section>
  );
}
