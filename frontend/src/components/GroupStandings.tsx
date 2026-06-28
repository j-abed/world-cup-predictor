import { useMemo } from "react";
import type { GroupStanding, ThirdPlaceEntry } from "../types";
import { activateOnEnterOrSpace, INTERACTIVE_ROW_CLASS } from "../lib/keyboard";
import { CommandPanel } from "./CommandPanel";
import { TeamBadge } from "./TeamBadge";

interface GroupStandingsProps {
  standings: GroupStanding[];
  thirdPlace: ThirdPlaceEntry[];
  onSelectTeam: (code: string) => void;
}

const STANDINGS_GRID =
  "grid grid-cols-[1.125rem_minmax(0,1fr)_1.125rem_1.125rem_1.125rem_1.125rem_1.75rem_1.75rem] items-center gap-x-1.5";

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
    <CommandPanel
      eyebrow="Group stage"
      title="Group standings"
      subtitle="Top two in each group advance automatically; the best third-place teams take the remaining knockout spots."
    >
      <div className="command-group-grid">
        {groups.map(([group, rows]) => (
          <div
            key={group}
            data-group={group}
            className="command-subcard"
            style={{ borderTopColor: "var(--group-accent)" }}
          >
            <h3
              className="mb-2 text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--group-accent)" }}
            >
              Group {group}
            </h3>

            <div className="min-w-0" role="table" aria-label={`Group ${group} standings`}>
              <div
                role="row"
                className={`${STANDINGS_GRID} border-b border-border/60 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80`}
              >
                <span role="columnheader" aria-hidden />
                <span role="columnheader">Team</span>
                <span role="columnheader" className="text-center" title="Played">
                  P
                </span>
                <span role="columnheader" className="text-center" title="Won">
                  W
                </span>
                <span role="columnheader" className="text-center" title="Drawn">
                  D
                </span>
                <span role="columnheader" className="text-center" title="Lost">
                  L
                </span>
                <span role="columnheader" className="text-center" title="Goal difference">
                  GD
                </span>
                <span role="columnheader" className="text-center" title="Points">
                  Pts
                </span>
              </div>

              <div role="rowgroup">
                {rows.map((row) => {
                  const qualifies =
                    row.rank <= 2 || qualifyingThirdPlaceCodes.has(row.code);

                  return (
                    <div
                      key={row.code}
                      role="row"
                      tabIndex={0}
                      onClick={() => onSelectTeam(row.code)}
                      onKeyDown={(event) =>
                        activateOnEnterOrSpace(event, () =>
                          onSelectTeam(row.code),
                        )
                      }
                      className={`${STANDINGS_GRID} border-t border-border/50 py-1.5 text-xs ${INTERACTIVE_ROW_CLASS} ${
                        qualifies
                          ? "command-data-row--qualify border-l-2 pl-2 -ml-2"
                          : ""
                      }`}
                    >
                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.rank}
                      </span>

                      <div role="cell" className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <TeamBadge code={row.code} group={group} size="sm" />
                          <span
                            className={`min-w-0 truncate font-medium ${
                              qualifies
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                            title={row.team}
                          >
                            {row.team}
                          </span>
                          {row.rank === 3 && qualifies ? (
                            <span
                              className="shrink-0 rounded-full bg-success/20 px-1 py-0.5 text-[8px] font-bold uppercase leading-none text-success"
                              title="Qualifying third place"
                            >
                              3rd
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.played}
                      </span>
                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.wins}
                      </span>
                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.draws}
                      </span>
                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.losses}
                      </span>
                      <span
                        role="cell"
                        className="text-center tabular-nums text-muted-foreground"
                      >
                        {row.goal_difference > 0
                          ? `+${row.goal_difference}`
                          : row.goal_difference}
                      </span>
                      <span
                        role="cell"
                        className="text-center font-mono text-xs font-bold tabular-nums text-foreground"
                      >
                        {row.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CommandPanel>
  );
}
