import { useMemo, useState } from "react";
import type { QualificationOdds as QualificationOddsRow } from "../types";
import { activateOnEnterOrSpace, INTERACTIVE_ROW_CLASS } from "../lib/keyboard";
import {
  CommandEmpty,
  CommandPanel,
  CommandTable,
  CommandToolbar,
} from "./CommandPanel";
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
  { key: "first_prob", label: "Win group" },
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
    <CommandPanel
      eyebrow="Advance probabilities"
      title="Qualification odds"
      subtitle="Simulated probability of advancing out of the group stage."
    >
      <CommandToolbar>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search team or code…"
        />
        <select
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
        >
          <option value="all">All groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              Group {group}
            </option>
          ))}
        </select>
      </CommandToolbar>

      {rows.length === 0 ? (
        <CommandEmpty>No teams match your filters.</CommandEmpty>
      ) : (
        <CommandTable minWidth="720px">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key}>
                  <button type="button" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    {sortKey === column.key ? (
                      <span className="text-gold">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    ) : null}
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
                className={INTERACTIVE_ROW_CLASS}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <TeamBadge code={row.code} group={row.group} size="sm" />
                    <span className="font-medium">{row.team}</span>
                  </div>
                </td>
                <td
                  className="font-medium"
                  style={{ color: "var(--group-accent)" }}
                >
                  {row.group}
                </td>
                <td className="w-36">
                  <ProbabilityBar
                    value={row.qualify_prob}
                    valueLabel={row.qualify_prob_label}
                    size="sm"
                    tone="emerald"
                  />
                </td>
                <td className="w-36">
                  <ProbabilityBar
                    value={row.first_prob}
                    valueLabel={row.first_prob_label}
                    size="sm"
                    tone="gold"
                  />
                </td>
                <td className="w-36">
                  <ProbabilityBar
                    value={row.second_prob}
                    valueLabel={row.second_prob_label}
                    size="sm"
                    tone="neutral"
                  />
                </td>
                <td className="w-36">
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
        </CommandTable>
      )}
    </CommandPanel>
  );
}
