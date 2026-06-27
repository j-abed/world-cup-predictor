import type { ThirdPlaceEntry } from "../types";
import {
  CommandMetaChip,
  CommandPanel,
  CommandTable,
} from "./CommandPanel";
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
    <CommandPanel
      eyebrow="Third-place race"
      title="Third-place ranking"
      subtitle={`Ranked across all groups — the top ${qualifyingCount} currently advance to the knockout round.`}
      meta={<CommandMetaChip live>Qualifying</CommandMetaChip>}
    >
      <CommandTable minWidth="560px">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Group</th>
            <th className="text-right">P</th>
            <th className="text-right">Pts</th>
            <th className="text-right">GD</th>
            <th className="text-right">GF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.code}
              data-group={row.group}
              onClick={() => onSelectTeam(row.code)}
              className={row.currently_qualifies ? "command-data-row--qualify" : ""}
            >
              <td className="font-mono text-muted-foreground">{row.third_rank}</td>
              <td>
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
                  {row.currently_qualifies ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  ) : null}
                </div>
              </td>
              <td
                className="font-medium"
                style={{ color: "var(--group-accent)" }}
              >
                Group {row.group}
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {row.played}
              </td>
              <td className="text-right font-mono font-semibold tabular-nums">
                {row.points}
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {row.goal_difference > 0
                  ? `+${row.goal_difference}`
                  : row.goal_difference}
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {row.goals_for}
              </td>
            </tr>
          ))}
        </tbody>
      </CommandTable>
    </CommandPanel>
  );
}
