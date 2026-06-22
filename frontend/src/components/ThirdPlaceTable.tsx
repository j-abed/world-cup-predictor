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
    <section className="pitch-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Third-Place Ranking
          </h2>
          <p className="text-sm text-muted-foreground">
            Ranked across all groups — the top {qualifyingCount} currently
            advance to the knockout round.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          Currently qualifying
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground/70">
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
                data-group={row.group}
                onClick={() => onSelectTeam(row.code)}
                className={`cursor-pointer border-t border-border transition hover:bg-accent/10 ${
                  row.currently_qualifies ? "bg-success/[0.08]" : ""
                }`}
              >
                <td className="py-2 font-mono text-muted-foreground">
                  {row.third_rank}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <TeamBadge code={row.code} group={row.group} size="sm" />
                    <span
                      className={`font-medium ${
                        row.currently_qualifies
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {row.team}
                    </span>
                    {row.currently_qualifies && (
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    )}
                  </div>
                </td>
                <td
                  className="py-2 font-medium"
                  style={{ color: "var(--group-accent)" }}
                >
                  Group {row.group}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {row.played}
                </td>
                <td className="py-2 text-right font-mono font-semibold tabular-nums text-foreground">
                  {row.points}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {row.goal_difference > 0
                    ? `+${row.goal_difference}`
                    : row.goal_difference}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
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
