import type { ThirdPlaceEntry } from "../types";
import { TeamBadge } from "./TeamBadge";

interface ThirdPlaceTableProps {
  thirdPlace: ThirdPlaceEntry[];
  onSelectTeam: (code: string) => void;
}

export function ThirdPlaceTable({
  thirdPlace,
  onSelectTeam,
}: ThirdPlaceTableProps) {
  const rows = [...thirdPlace].sort((a, b) => a.third_rank - b.third_rank);
  const qualifyingCount = rows.filter((r) => r.currently_qualifies).length;

  return (
    <section className="rounded-2xl border border-pitch-700 bg-pitch-900/60 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-pitch-100">
            Third-Place Ranking
          </h2>
          <p className="text-sm text-pitch-300">
            Ranked across all groups — the top {qualifyingCount} currently
            advance to the knockout round.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-pitch-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Currently qualifying
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-pitch-500">
              <th className="pb-2 font-medium">Rank</th>
              <th className="pb-2 font-medium">Team</th>
              <th className="pb-2 font-medium">Group</th>
              <th className="pb-2 text-right font-medium">P</th>
              <th className="pb-2 text-right font-medium">Pts</th>
              <th className="pb-2 text-right font-medium">GD</th>
              <th className="pb-2 text-right font-medium">GF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.code}
                onClick={() => onSelectTeam(row.code)}
                className={`cursor-pointer border-t border-pitch-800/80 transition hover:bg-pitch-800/60 ${
                  row.currently_qualifies ? "bg-emerald-500/[0.06]" : ""
                }`}
              >
                <td className="py-2 font-mono text-pitch-400">
                  {row.third_rank}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <TeamBadge code={row.code} size="sm" />
                    <span
                      className={`font-medium ${
                        row.currently_qualifies
                          ? "text-pitch-100"
                          : "text-pitch-400"
                      }`}
                    >
                      {row.team}
                    </span>
                    {row.currently_qualifies && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </td>
                <td className="py-2 text-pitch-400">Group {row.group}</td>
                <td className="py-2 text-right tabular-nums text-pitch-300">
                  {row.played}
                </td>
                <td className="py-2 text-right font-mono font-semibold tabular-nums text-pitch-100">
                  {row.points}
                </td>
                <td className="py-2 text-right tabular-nums text-pitch-300">
                  {row.goal_difference > 0
                    ? `+${row.goal_difference}`
                    : row.goal_difference}
                </td>
                <td className="py-2 text-right tabular-nums text-pitch-300">
                  {row.goals_for}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
