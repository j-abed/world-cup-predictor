import { useMemo, useState } from "react";
import type { PathDifficultyEntry, RoundOdds } from "../../types";
import type { TopChampionChange } from "../../types";
import { computeVolatility } from "../../lib/pathToFinal";
import { ProbabilityDelta } from "../MovementSummary";
import { TeamBadge } from "../TeamBadge";
import { TITLE_BOARD_COLUMN_HINTS } from "../../lib/dashboardHints";
import { HoverHint } from "../HoverHint";
import { RunTrendArrow } from "./RunTrendArrow";

interface TitleOddsBoardProps {
  teams: RoundOdds[];
  championChanges: Map<string, TopChampionChange>;
  pathByCode: Map<string, PathDifficultyEntry>;
  qualificationByCode: Map<string, number>;
  selectedCode?: string;
  onSelectTeam: (code: string) => void;
}

const DEFAULT_VISIBLE = 16;

function formatPctLabel(label: string): string {
  return label.trim();
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="terminal-board__expand-chevron"
      style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s ease" }}
    >
      <path
        d="M2 3.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TitleOddsBoard({
  teams,
  championChanges,
  pathByCode,
  qualificationByCode,
  selectedCode,
  onSelectTeam,
}: TitleOddsBoardProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleTeams = expanded ? teams : teams.slice(0, DEFAULT_VISIBLE);

  const columns = useMemo(
    () =>
      [
        "Rank",
        "Team",
        "Conf",
        "Title %",
        "Δ Run",
        "Final %",
        "Semi %",
        "Path Diff",
        "Vol",
        "Run",
      ] as const,
    [],
  );

  return (
    <div className="terminal-board">
      <header className="terminal-board__header">
        <div>
          <p className="terminal-board__eyebrow">Live board</p>
          <h3 className="terminal-board__title">Title odds board</h3>
        </div>
        <span className="terminal-board__count">{teams.length} teams</span>
      </header>

      <div className="terminal-board__head-wrap">
        <div
          className="terminal-board__grid terminal-board__grid--head"
          role="row"
          aria-hidden
        >
          {columns.map((column) => {
            const hint =
              column in TITLE_BOARD_COLUMN_HINTS
                ? TITLE_BOARD_COLUMN_HINTS[
                    column as keyof typeof TITLE_BOARD_COLUMN_HINTS
                  ]
                : undefined;

            return (
              <span key={column} className="terminal-board__head-cell" role="columnheader">
                {hint ? (
                  <HoverHint
                    label={column}
                    hint={hint}
                    compact
                    showIcon={false}
                    placement="bottom"
                    align="start"
                  />
                ) : (
                  column
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div className="terminal-board__scroll">
        <ul className="terminal-board__body" role="list">
          {visibleTeams.map((team, index) => {
            const rank = index + 1;
            const change = championChanges.get(team.code);
            const path = pathByCode.get(team.code);
            const conf = qualificationByCode.get(team.code);
            const isSelected = selectedCode !== undefined && team.code === selectedCode;
            const vol = computeVolatility(team);

            return (
              <li key={team.code}>
                <button
                  type="button"
                  onClick={() => onSelectTeam(team.code)}
                  className={`terminal-board__grid terminal-board__row${isSelected ? " terminal-board__row--selected" : ""}`}
                  aria-pressed={isSelected}
                  aria-label={`${team.team}, title odds ${formatPctLabel(team.champion_prob_label)}`}
                >
                  <span className="terminal-board__cell terminal-board__cell--rank">
                    {rank}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--team">
                    <TeamBadge code={team.code} size="sm" />
                    <span className="terminal-board__team-wrap">
                      <span className="terminal-board__team-name">{team.team}</span>
                      <span className="terminal-board__team-meta">
                        <span
                          data-group={team.group}
                          className="terminal-board__group-pip"
                        >
                          {team.group}
                        </span>
                      </span>
                    </span>
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num">
                    {conf !== undefined ? `${(conf * 100).toFixed(1)}%` : "—"}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num terminal-board__cell--gold">
                    {formatPctLabel(team.champion_prob_label)}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num">
                    {change ? (
                      <ProbabilityDelta delta={change.delta} />
                    ) : (
                      <span className="terminal-board__muted">—</span>
                    )}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num">
                    {formatPctLabel(team.final_prob_label)}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num">
                    {formatPctLabel(team.sf_prob_label)}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--path">
                    {path?.label ?? "—"}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--num">
                    {vol.toFixed(1)}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--trend">
                    {change ? (
                      <RunTrendArrow delta={change.delta} />
                    ) : (
                      <span className="terminal-board__muted">—</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {teams.length > DEFAULT_VISIBLE ? (
        <footer className="terminal-board__footer">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={`terminal-board__expand${expanded ? " terminal-board__expand--expanded" : ""}`}
            aria-expanded={expanded}
          >
            {expanded ? "Show fewer" : `Show all ${teams.length} teams`}
            <ChevronIcon expanded={expanded} />
          </button>
        </footer>
      ) : null}
    </div>
  );
}
