import { useMemo, useState } from "react";
import type { QualificationOdds as QualificationOddsRow } from "../types";
import { activateOnEnterOrSpace, INTERACTIVE_ROW_CLASS } from "../lib/keyboard";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface QualificationOddsProps {
  qualification: QualificationOddsRow[];
  onSelectTeam: (code: string) => void;
}

type SortKey =
  | "team"
  | "group"
  | "qualify_prob"
  | "first_prob"
  | "second_prob"
  | "third_qualify_prob";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "group", label: "Group" },
  { key: "qualify_prob", label: "Qualify" },
  { key: "first_prob", label: "Win Group" },
  { key: "second_prob", label: "Finish 2nd" },
  { key: "third_qualify_prob", label: "Qualify as 3rd" },
];

export function QualificationOdds({
  qualification,
  onSelectTeam,
}: QualificationOddsProps) {
  const [sortKey, setSortKey] = useState<SortKey>("qualify_prob");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const groups = useMemo(
    () => [...new Set(qualification.map((row) => row.group))].sort(),
    [qualification],
  );

  const rows = useMemo(() => {
    const filtered = qualification.filter((row) => {
      const matchesGroup = groupFilter === "all" || row.group === groupFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        row.team.toLowerCase().includes(query) ||
        row.code.toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });

    const direction = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortKey === "team" || sortKey === "group") {
        return a[sortKey].localeCompare(b[sortKey]) * direction;
      }
      return (a[sortKey] - b[sortKey]) * direction;
    });
  }, [qualification, groupFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <section className="pitch-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Qualification Odds
          </h2>
          <p className="text-sm text-muted-foreground">
            Simulated probability of advancing out of the group stage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search team or code…"
            className="glass rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent/60 focus:outline-none"
          />
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="glass rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/60 focus:outline-none"
          >
            <option value="all">All groups</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                Group {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground/70">
              {COLUMNS.map((column) => (
                <th key={column.key} className="pb-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 transition hover:text-foreground"
                  >
                    {column.label}
                    {sortKey === column.key && (
                      <span className="text-gold">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.code}
                data-group={row.group}
                tabIndex={0}
                role="button"
                onClick={() => onSelectTeam(row.code)}
                onKeyDown={(event) =>
                  activateOnEnterOrSpace(event, () => onSelectTeam(row.code))
                }
                className={`border-t border-border ${INTERACTIVE_ROW_CLASS}`}
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <TeamBadge code={row.code} group={row.group} size="sm" />
                    <span className="font-medium text-foreground">
                      {row.team}
                    </span>
                  </div>
                </td>
                <td
                  className="py-2.5 font-medium"
                  style={{ color: "var(--group-accent)" }}
                >
                  {row.group}
                </td>
                <td className="w-36 py-2.5">
                  <ProbabilityBar
                    value={row.qualify_prob}
                    valueLabel={row.qualify_prob_label}
                    size="sm"
                    tone="emerald"
                  />
                </td>
                <td className="w-36 py-2.5">
                  <ProbabilityBar
                    value={row.first_prob}
                    valueLabel={row.first_prob_label}
                    size="sm"
                    tone="gold"
                  />
                </td>
                <td className="w-36 py-2.5">
                  <ProbabilityBar
                    value={row.second_prob}
                    valueLabel={row.second_prob_label}
                    size="sm"
                    tone="neutral"
                  />
                </td>
                <td className="w-36 py-2.5">
                  <ProbabilityBar
                    value={row.third_qualify_prob}
                    valueLabel={row.third_qualify_prob_label}
                    size="sm"
                    tone="crimson"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No teams match your filters.
          </p>
        )}
      </div>
    </section>
  );
}
