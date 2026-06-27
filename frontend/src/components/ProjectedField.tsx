import { useMemo } from "react";
import type { ProjectedQualifier } from "../types";
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground/70">
            <th className="pb-2 font-medium">Seed</th>
            <th className="pb-2 font-medium">Team</th>
            <th className="pb-2 font-medium">Group</th>
            <th className="pb-2 font-medium">Bracket slot</th>
            <th className="pb-2 text-right font-medium">Pts</th>
            <th className="pb-2 text-right font-medium">GD</th>
            <th className="pb-2 text-right font-medium">GF</th>
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
              className="cursor-pointer border-t border-border transition hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <td className="py-2.5 font-mono text-muted-foreground">
                {row.seed}
              </td>
              <td className="py-2.5">
                <span className="flex items-center gap-2">
                  <TeamBadge code={row.code} group={row.group} size="sm" />
                  <span className="font-medium text-foreground">{row.team}</span>
                </span>
              </td>
              <td className="py-2.5">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--group-accent)" }}
                >
                  {row.group}
                </span>
              </td>
              <td className="py-2.5 text-muted-foreground">{row.source}</td>
              <td className="py-2.5 text-right tabular-nums">{row.points}</td>
              <td className="py-2.5 text-right tabular-nums">
                {row.goal_difference > 0 ? "+" : ""}
                {row.goal_difference}
              </td>
              <td className="py-2.5 text-right tabular-nums">{row.goals_for}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Projected Round of 32
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current knockout field from group standings — {sorted.length} teams (
          {pathSummary(sorted)}).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {byPath.map((section) => (
          <div key={section.path} className="pitch-card rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-gold">
              {section.rows.length}
            </p>
          </div>
        ))}
      </div>

      {byPath.map((section) => (
        <section key={section.path} className="pitch-card rounded-2xl p-5">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {section.label}
          </h3>
          <QualifierTable rows={section.rows} onSelectTeam={onSelectTeam} />
        </section>
      ))}
    </div>
  );
}
