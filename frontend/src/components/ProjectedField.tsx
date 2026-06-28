import { useMemo } from "react";
import type { ProjectedQualifier } from "../types";
import {
  CommandPanel,
  CommandSection,
  CommandStat,
  CommandStatGrid,
  CommandTable,
} from "./CommandPanel";
import { TeamBadge } from "./TeamBadge";

interface ProjectedFieldProps {
  qualifiers: ProjectedQualifier[];
  onSelectTeam: (code: string) => void;
}

const PATH_ORDER = ["Group winner", "Group runner-up", "Best third-place"] as const;

const PATH_LABEL: Record<string, string> = {
  "Group winner": "Group winners",
  "Group runner-up": "Runners-up",
  "Best third-place": "Best third-place teams",
};

function pathSummary(qualifiers: ProjectedQualifier[]): string {
  const counts = new Map<string, number>();

  for (const row of qualifiers) {
    counts.set(row.qualifying_path, (counts.get(row.qualifying_path) ?? 0) + 1);
  }

  return PATH_ORDER.filter((path) => counts.has(path))
    .map((path) => `${counts.get(path)} ${PATH_LABEL[path]?.toLowerCase() ?? path}`)
    .join(" · ");
}

function QualifierTable({
  rows,
  onSelectTeam,
}: {
  rows: ProjectedQualifier[];
  onSelectTeam: (code: string) => void;
}) {
  return (
    <CommandTable minWidth="640px">
      <thead>
        <tr>
          <th>Seed</th>
          <th>Team</th>
          <th>Group</th>
          <th>Bracket slot</th>
          <th className="text-right">Pts</th>
          <th className="text-right">GD</th>
          <th className="text-right">GF</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.seed}-${row.code}`}
            data-group={row.group}
            onClick={() => onSelectTeam(row.code)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectTeam(row.code);
              }
            }}
            tabIndex={0}
            role="button"
          >
            <td className="font-mono text-muted-foreground">{row.seed}</td>
            <td>
              <span className="flex items-center gap-2">
                <TeamBadge code={row.code} group={row.group} size="sm" />
                <span className="font-medium">{row.team}</span>
              </span>
            </td>
            <td>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--group-accent)" }}
              >
                {row.group}
              </span>
            </td>
            <td className="text-muted-foreground">{row.source}</td>
            <td className="text-right tabular-nums">{row.points}</td>
            <td className="text-right tabular-nums">
              {row.goal_difference > 0 ? "+" : ""}
              {row.goal_difference}
            </td>
            <td className="text-right tabular-nums">{row.goals_for}</td>
          </tr>
        ))}
      </tbody>
    </CommandTable>
  );
}

export function ProjectedField({
  qualifiers,
  onSelectTeam,
}: ProjectedFieldProps) {
  const sorted = useMemo(
    () => [...qualifiers].sort((a, b) => a.seed - b.seed),
    [qualifiers],
  );

  const byPath = useMemo(() => {
    const groups = new Map<string, ProjectedQualifier[]>();

    for (const path of PATH_ORDER) {
      groups.set(path, []);
    }

    for (const row of sorted) {
      const bucket = groups.get(row.qualifying_path) ?? [];
      bucket.push(row);
      groups.set(row.qualifying_path, bucket);
    }

    return PATH_ORDER.map((path) => ({
      path,
      label: PATH_LABEL[path] ?? path,
      rows: groups.get(path) ?? [],
    })).filter((section) => section.rows.length > 0);
  }, [sorted]);

  return (
    <CommandPanel
      eyebrow="Knockout field"
      title="Projected round of 32"
      subtitle={`Current knockout field from group standings — ${sorted.length} teams (${pathSummary(sorted)}).`}
    >
      <CommandStatGrid>
        {byPath.map((section) => (
          <CommandStat key={section.path} label={section.label}>
            <p className="command-stat__value--hero">{section.rows.length}</p>
          </CommandStat>
        ))}
      </CommandStatGrid>

      {byPath.map((section) => (
        <CommandSection key={section.path} title={section.label}>
          <QualifierTable rows={section.rows} onSelectTeam={onSelectTeam} />
        </CommandSection>
      ))}
    </CommandPanel>
  );
}
