import { useMemo } from "react";
import type { GroupStanding, ThirdPlaceEntry } from "../types";
import { activateOnEnterOrSpace, INTERACTIVE_ROW_CLASS } from "../lib/keyboard";
import { TeamBadge } from "./TeamBadge";

interface GroupStandingsProps {
  standings: GroupStanding[];
  thirdPlace: ThirdPlaceEntry[];
  onSelectTeam: (code: string) => void;
}

export function GroupStandings({
  standings,
  thirdPlace,
  onSelectTeam,
}: GroupStandingsProps) {
  const qualifyingThirdPlaceCodes = useMemo(
    () =>
      new Set(
        thirdPlace.filter((entry) => entry.currently_qualifies).map((e) => e.code),
      ),
    [thirdPlace],
  );

  const groups = useMemo(() => {
    const byGroup = new Map<string, GroupStanding[]>();
    for (const row of standings) {
      const rows = byGroup.get(row.group_code) ?? [];
      rows.push(row);
      byGroup.set(row.group_code, rows);
    }
    return [...byGroup.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, rows]) => [group, rows.sort((a, b) => a.rank - b.rank)] as const);
  }, [standings]);

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Group Standings
        </h2>
        <p className="text-sm text-muted-foreground">
          Top two in each group advance automatically; the best third-place
          teams take the remaining knockout spots.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map(([group, rows]) => (
          <div
            key={group}
            data-group={group}
            className="pitch-card rounded-2xl border-t-2 p-4"
            style={{ borderTopColor: "var(--group-accent)" }}
          >
            <h3
              className="mb-3 text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--group-accent)" }}
            >
              Group {group}
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-muted-foreground/70">
                  <th className="w-6 pb-1.5 text-left font-medium" />
                  <th className="pb-1.5 text-left font-medium">Team</th>
                  <th className="pb-1.5 text-right font-medium">P</th>
                  <th className="pb-1.5 text-right font-medium">W</th>
                  <th className="pb-1.5 text-right font-medium">D</th>
                  <th className="pb-1.5 text-right font-medium">L</th>
                  <th className="pb-1.5 text-right font-medium">GD</th>
                  <th className="pb-1.5 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const qualifies =
                    row.rank <= 2 || qualifyingThirdPlaceCodes.has(row.code);
                  return (
                    <tr
                      key={row.code}
                      tabIndex={0}
                      role="button"
                      onClick={() => onSelectTeam(row.code)}
                      onKeyDown={(event) =>
                        activateOnEnterOrSpace(event, () =>
                          onSelectTeam(row.code),
                        )
                      }
                      className={`border-t border-border ${INTERACTIVE_ROW_CLASS} ${
                        qualifies ? "bg-success/[0.08]" : ""
                      }`}
                    >
                      <td className="py-1.5 text-muted-foreground">{row.rank}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <TeamBadge code={row.code} size="sm" />
                          <span
                            className={`truncate font-medium ${
                              qualifies ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {row.team}
                          </span>
                          {row.rank === 3 && qualifies && (
                            <span className="rounded-full bg-success/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">
                              3rd
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {row.played}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {row.wins}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {row.draws}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {row.losses}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold tabular-nums text-foreground">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
