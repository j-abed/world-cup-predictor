import { useMemo, useState } from "react";
import type { PathDifficultyEntry, RoundOdds } from "../../types";
import type { TopChampionChange } from "../../types";
import { computeVolatility } from "../../lib/pathToFinal";
import { ProbabilityDelta } from "../MovementSummary";
import { TeamBadge } from "../TeamBadge";
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

      <div className="terminal-board__scroll">
        <div
          className="terminal-board__grid terminal-board__grid--head"
          role="row"
        >
          {columns.map((column) => (
            <span key={column} className="terminal-board__head-cell" role="columnheader">
              {column}
            </span>
          ))}
        </div>

        <ul className="terminal-board__body">
          {visibleTeams.map((team, index) => {
            const rank = index + 1;
            const change = championChanges.get(team.code);
            const path = pathByCode.get(team.code);
            const conf = qualificationByCode.get(team.code);
            const isSelected = selectedCode !== undefined && team.code === selectedCode;
            const vol = computeVolatility(team);

            return (
              <li key={team.code} role="none">
                <button
                  type="button"
                  role="row"
                  onClick={() => onSelectTeam(team.code)}
                  className={`terminal-board__grid terminal-board__row${isSelected ? " terminal-board__row--selected" : ""}`}
                  aria-selected={isSelected}
                >
                  <span className="terminal-board__cell terminal-board__cell--rank">
                    {rank}
                  </span>

                  <span className="terminal-board__cell terminal-board__cell--team">
                    <TeamBadge code={team.code} size="sm" />
                    <span className="terminal-board__team-wrap">
                      <span className="terminal-board__team-name">{team.team}</span>
                      <span className="terminal-board__team-meta">Grp {team.group}</span>
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
            className="terminal-board__expand"
          >
            {expanded ? "Show fewer" : `Show all ${teams.length} teams`}
          </button>
        </footer>
      ) : null}
    </div>
  );
}
