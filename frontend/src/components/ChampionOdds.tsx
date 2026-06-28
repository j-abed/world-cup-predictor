import { useMemo, type ReactNode } from "react";
import type {
  Movement,
  PathDifficultyEntry,
  QualificationOdds,
  RoundOdds,
} from "../types";
import { championChangeByCode } from "../lib/movement";
import { TitleOddsBoard } from "./champion/TitleOddsBoard";
import { ProbabilityDelta } from "./MovementSummary";
import { TeamBadge } from "./TeamBadge";

interface ChampionOddsProps {
  round: RoundOdds[];
  movement?: Movement;
  pathDifficulty?: PathDifficultyEntry[];
  qualification: QualificationOdds[];
  selectedTeamCode?: string | null;
  onSelectTeam: (code: string) => void;
}

interface TitleRacePodiumProps {
  podium: RoundOdds[];
  championChanges: Map<string, { delta: number }>;
  pathByCode: Map<string, PathDifficultyEntry>;
  selectedCode: string | null;
  onSelectTeam: (code: string) => void;
}

function ProbabilityDial({
  value,
  displayLabel,
}: {
  value: number;
  displayLabel: string;
}) {
  const size = 112;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="title-race__dial">
      <svg
        className="title-race__dial-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Title win probability ${displayLabel}`}
      >
        <circle
          className="title-race__dial-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="title-race__dial-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="title-race__dial-value">{displayLabel}</span>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="title-race__stat">
      <dt className="title-race__stat-label">{label}</dt>
      <dd
        className={`title-race__stat-value${accent ? " title-race__stat-value--gold" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function TitleRaceCard({
  team,
  rank,
  variant,
  change,
  path,
  selected,
  onSelect,
}: {
  team: RoundOdds;
  rank: number;
  variant: "leader" | "flank";
  change?: { delta: number };
  path?: PathDifficultyEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLeader = variant === "leader";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`title-race__card title-race__card--${variant}${selected ? " title-race__card--selected" : ""}${isLeader ? " title-race__card--leader" : ""}`}
    >
      <span className="title-race__watermark" aria-hidden>
        ★
      </span>

      <div className="title-race__card-head">
        <span className="title-race__rank">#{rank}</span>
        <TeamBadge code={team.code} rank={rank} size={isLeader ? "lg" : "md"} />
        <div className="title-race__identity">
          <span className="title-race__name">{team.team}</span>
          <span className="title-race__group">Group {team.group}</span>
        </div>
      </div>

      {isLeader ? (
        <div className="title-race__dial-block">
          <p className="title-race__dial-caption">Title Win Probability</p>
          <ProbabilityDial
            value={team.champion_prob}
            displayLabel={team.champion_prob_label.trim()}
          />
        </div>
      ) : (
        <div className="title-race__flank-prob">
          <p className="title-race__dial-caption">Title Win Probability</p>
          <p className="title-race__flank-pct">
            {team.champion_prob_label.trim()}
          </p>
        </div>
      )}

      <dl className="title-race__stats">
        <StatRow
          label="Δ Last Run"
          value={
            change ? (
              <ProbabilityDelta delta={change.delta} />
            ) : (
              <span className="title-race__stat-muted">—</span>
            )
          }
        />
        <StatRow
          label="Reach R16"
          value={team.r16_prob_label.trim()}
          accent
        />
        <StatRow
          label="Semi %"
          value={team.sf_prob_label.trim()}
        />
        <StatRow
          label="Final %"
          value={team.final_prob_label.trim()}
        />
        <StatRow
          label="Path Difficulty"
          value={path?.label ?? "—"}
        />
      </dl>
    </button>
  );
}

function TitleRacePodium({
  podium,
  championChanges,
  pathByCode,
  selectedCode,
  onSelectTeam,
}: TitleRacePodiumProps) {
  if (podium.length === 0) {
    return null;
  }

  const leader = podium[0];
  const leftFlank = podium[1];
  const rightFlank = podium[2];

  return (
    <section className="title-race" aria-label="Title race — top three contenders">
      <p className="title-race__module-label">Title race</p>

      <div className="title-race__grid">
        {leftFlank ? (
          <TitleRaceCard
            team={leftFlank}
            rank={2}
            variant="flank"
            change={championChanges.get(leftFlank.code)}
            path={pathByCode.get(leftFlank.code)}
            selected={leftFlank.code === selectedCode}
            onSelect={() => onSelectTeam(leftFlank.code)}
          />
        ) : (
          <div className="title-race__spacer" aria-hidden />
        )}

        <TitleRaceCard
          team={leader}
          rank={1}
          variant="leader"
          change={championChanges.get(leader.code)}
          path={pathByCode.get(leader.code)}
          selected={leader.code === selectedCode}
          onSelect={() => onSelectTeam(leader.code)}
        />

        {rightFlank ? (
          <TitleRaceCard
            team={rightFlank}
            rank={3}
            variant="flank"
            change={championChanges.get(rightFlank.code)}
            path={pathByCode.get(rightFlank.code)}
            selected={rightFlank.code === selectedCode}
            onSelect={() => onSelectTeam(rightFlank.code)}
          />
        ) : (
          <div className="title-race__spacer" aria-hidden />
        )}
      </div>
    </section>
  );
}

export function ChampionOdds({
  round,
  movement,
  pathDifficulty = [],
  qualification,
  selectedTeamCode = null,
  onSelectTeam,
}: ChampionOddsProps) {
  const championChanges = useMemo(
    () => championChangeByCode(movement),
    [movement],
  );

  const pathByCode = useMemo(
    () => new Map(pathDifficulty.map((entry) => [entry.code, entry])),
    [pathDifficulty],
  );

  const qualificationByCode = useMemo(
    () =>
      new Map(
        qualification.map((entry) => [entry.code, entry.first_prob]),
      ),
    [qualification],
  );

  const ranked = useMemo(
    () => [...round].sort((a, b) => b.champion_prob - a.champion_prob),
    [round],
  );

  const podium = ranked.slice(0, 3);

  const focusCode =
    selectedTeamCode && ranked.some((team) => team.code === selectedTeamCode)
      ? selectedTeamCode
      : ranked[0]?.code ?? null;

  return (
    <section className="odds-board">
      <header className="odds-board__header">
        <div>
          <p className="odds-board__eyebrow">Outright market</p>
          <h2 className="odds-board__title">Champion odds board</h2>
          <p className="odds-board__subtitle">
            Simulated probability of winning the tournament outright.
          </p>
        </div>
        <div className="odds-board__meta">
          <span className="odds-board__meta-chip">{ranked.length} teams</span>
          <span className="odds-board__meta-chip odds-board__meta-chip--live">
            Live sim
          </span>
        </div>
      </header>

      <TitleRacePodium
        podium={podium}
        championChanges={championChanges}
        pathByCode={pathByCode}
        selectedCode={focusCode}
        onSelectTeam={onSelectTeam}
      />

      <div className="board-lower board-lower--solo">
        <TitleOddsBoard
          teams={ranked}
          championChanges={championChanges}
          pathByCode={pathByCode}
          qualificationByCode={qualificationByCode}
          selectedCode={focusCode ?? undefined}
          onSelectTeam={onSelectTeam}
        />
      </div>
    </section>
  );
}
