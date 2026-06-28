import { useMemo, useState, type ReactNode } from "react";
import type { Bracket, BracketMatch, BracketRoundKey, RoundOdds } from "../types";
import { ROUND_SEQUENCE, orderedBracketRounds, pairUp } from "../lib/bracket";
import { CommandNote, CommandPanel } from "./CommandPanel";
import { TeamBadge } from "./TeamBadge";

interface BracketViewProps {
  bracket: Bracket;
  roundOdds: RoundOdds[];
  onSelectTeam: (code: string) => void;
  projectedBracketSimulations?: number;
}

type BracketViewMode = "reach" | "path";

function bracketHasProjectedPath(bracket: Bracket): boolean {
  return ROUND_SEQUENCE.some((roundKey) =>
    bracket[roundKey].some((match) => Boolean(match.projected_winner?.code)),
  );
}

const ROUND_TITLES: Record<BracketRoundKey, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinals: "Quarterfinals",
  semifinals: "Semifinals",
  final: "Final",
};

const DEFAULT_OPEN_ROUNDS: BracketRoundKey[] = [
  "round_of_32",
  "final",
];

/** Simulation odds for reaching the next knockout stage (not a head-to-head match-win %). */
const ADVANCE_PROB_FIELD: Record<
  BracketRoundKey,
  { value: keyof RoundOdds; label: keyof RoundOdds; reachLabel: string }
> = {
  round_of_32: {
    value: "r16_prob",
    label: "r16_prob_label",
    reachLabel: "Reach R16",
  },
  round_of_16: {
    value: "qf_prob",
    label: "qf_prob_label",
    reachLabel: "Reach QF",
  },
  quarterfinals: {
    value: "sf_prob",
    label: "sf_prob_label",
    reachLabel: "Reach SF",
  },
  semifinals: {
    value: "final_prob",
    label: "final_prob_label",
    reachLabel: "Reach final",
  },
  final: {
    value: "champion_prob",
    label: "champion_prob_label",
    reachLabel: "Win title",
  },
};

interface AdvanceProb {
  value: number;
  label: string;
  reachLabel: string;
}

function getAdvanceProb(
  code: string | null,
  roundKey: BracketRoundKey,
  byCode: Map<string, RoundOdds>,
): AdvanceProb | null {
  if (!code || code === "TBD") return null;
  const odds = byCode.get(code);
  if (!odds) return null;
  const field = ADVANCE_PROB_FIELD[roundKey];
  return {
    value: odds[field.value] as number,
    label: odds[field.label] as string,
    reachLabel: field.reachLabel,
  };
}

function isRoundOpen(
  roundKey: BracketRoundKey,
  openRounds: Set<BracketRoundKey>,
): boolean {
  return openRounds.has(roundKey);
}

export function BracketView({
  bracket,
  roundOdds,
  onSelectTeam,
  projectedBracketSimulations,
}: BracketViewProps) {
  const rounds = useMemo(() => orderedBracketRounds(bracket), [bracket]);
  const roundOddsByCode = useMemo(
    () => new Map(roundOdds.map((odds) => [odds.code, odds])),
    [roundOdds],
  );
  const hasProjectedPath = useMemo(() => bracketHasProjectedPath(bracket), [bracket]);
  const [viewMode, setViewMode] = useState<BracketViewMode>("reach");
  const [openRounds, setOpenRounds] = useState<Set<BracketRoundKey>>(
    () => new Set(ROUND_SEQUENCE),
  );
  const [focusedRound, setFocusedRound] = useState<BracketRoundKey | "all">("all");
  const showReachOdds = viewMode === "reach";

  const toggleRound = (roundKey: BracketRoundKey) => {
    setOpenRounds((current) => {
      const next = new Set(current);
      if (next.has(roundKey)) {
        next.delete(roundKey);
      } else {
        next.add(roundKey);
      }
      return next;
    });
  };

  const expandAllRounds = () => {
    setOpenRounds(new Set(ROUND_SEQUENCE));
  };

  const collapseMiddleRounds = () => {
    setOpenRounds(new Set(DEFAULT_OPEN_ROUNDS));
  };

  const visibleDesktopRounds =
    focusedRound === "all"
      ? ROUND_SEQUENCE
      : ROUND_SEQUENCE.filter((roundKey) => roundKey === focusedRound);

  return (
    <CommandPanel
      eyebrow="Knockout tree"
      title="Projected knockout bracket"
      subtitle="Built from current group standings — updates as results come in."
    >
      <CommandNote
        title={showReachOdds ? "How to read the percentages" : "Most likely knockout path"}
      >
        {showReachOdds ? (
          <p>
            Each figure is a simulated chance to reach the next round (or win the
            title in the final) across thousands of full-tournament runs — not a
            head-to-head win probability for that specific fixture. Both teams in a
            matchup can show high reach odds when the model rates them strongly
            overall.
          </p>
        ) : (
          <p>
            Most common winner per match across{" "}
            {projectedBracketSimulations !== undefined
              ? `${projectedBracketSimulations.toLocaleString()} knockout simulations`
              : "thousands of knockout simulations"}{" "}
            from the current Round of 32 field. Highlighted teams are the modal
            winners advancing through the tree — not guaranteed to match every
            reach-odds favorite in each pairing.
          </p>
        )}
      </CommandNote>

      {hasProjectedPath ? (
        <div className="bracket-filter-strip bracket-filter-strip--view-mode">
          <span className="bracket-filter-strip__label">View</span>
          <RoundFilterChip
            label="Reach odds"
            active={viewMode === "reach"}
            onClick={() => setViewMode("reach")}
          />
          <RoundFilterChip
            label="Most likely path"
            active={viewMode === "path"}
            onClick={() => setViewMode("path")}
          />
        </div>
      ) : null}

      <div className="bracket-filter-strip">
        <span className="bracket-filter-strip__label">Focus</span>
        <RoundFilterChip
          label="All rounds"
          active={focusedRound === "all"}
          onClick={() => setFocusedRound("all")}
        />
        {ROUND_SEQUENCE.map((roundKey) => (
          <RoundFilterChip
            key={roundKey}
            label={ROUND_TITLES[roundKey]}
            active={focusedRound === roundKey}
            onClick={() => setFocusedRound(roundKey)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        <BracketControlButton onClick={expandAllRounds}>
          Expand all
        </BracketControlButton>
        <BracketControlButton onClick={collapseMiddleRounds}>
          Collapse middle rounds
        </BracketControlButton>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:hidden">
        {ROUND_SEQUENCE.map((roundKey) => (
          <CollapsibleBracketRound
            key={roundKey}
            title={ROUND_TITLES[roundKey]}
            roundKey={roundKey}
            matches={rounds[roundKey]}
            roundOddsByCode={roundOddsByCode}
            onSelectTeam={onSelectTeam}
            open={isRoundOpen(roundKey, openRounds)}
            onToggle={() => toggleRound(roundKey)}
            hidden={focusedRound !== "all" && focusedRound !== roundKey}
            showReachOdds={showReachOdds}
          />
        ))}
      </div>

      <div className="-mx-5 hidden overflow-x-auto px-5 pb-2 pt-4 sm:-mx-8 sm:block sm:px-8">
        <div
          className={`grid min-w-[960px] gap-x-6 ${
            visibleDesktopRounds.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : visibleDesktopRounds.length === 2
                ? "grid-cols-2"
                : visibleDesktopRounds.length === 3
                  ? "grid-cols-3"
                  : visibleDesktopRounds.length === 4
                    ? "grid-cols-4"
                    : "grid-cols-5"
          }`}
        >
          {visibleDesktopRounds.map((roundKey) => (
            <CollapsibleBracketColumn
              key={roundKey}
              title={ROUND_TITLES[roundKey]}
              roundKey={roundKey}
              matches={rounds[roundKey]}
              roundOddsByCode={roundOddsByCode}
              isFinal={roundKey === "final"}
              onSelectTeam={onSelectTeam}
              open={isRoundOpen(roundKey, openRounds)}
              onToggle={() => toggleRound(roundKey)}
              showReachOdds={showReachOdds}
            />
          ))}
        </div>
      </div>
    </CommandPanel>
  );
}

function RoundFilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`command-chip${active ? " command-chip--active" : ""}`}
    >
      {label}
    </button>
  );
}

function BracketControlButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="command-chip"
    >
      {children}
    </button>
  );
}

function CollapsibleBracketRound({
  title,
  roundKey,
  matches,
  roundOddsByCode,
  onSelectTeam,
  open,
  onToggle,
  hidden = false,
  showReachOdds,
}: {
  title: string;
  roundKey: BracketRoundKey;
  matches: BracketMatch[];
  roundOddsByCode: Map<string, RoundOdds>;
  onSelectTeam: (code: string) => void;
  open: boolean;
  onToggle: () => void;
  hidden?: boolean;
  showReachOdds: boolean;
}) {
  if (hidden) return null;

  return (
    <section className="command-bracket-round">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="command-bracket-round__toggle"
      >
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
            {title}
          </h3>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {ADVANCE_PROB_FIELD[roundKey].reachLabel} · {matches.length} matches
          </p>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-border/50 px-4 py-3">
          {matches.map((match) => (
            <MatchCard
              key={match.slot_id}
              match={match}
              roundKey={roundKey}
              roundOddsByCode={roundOddsByCode}
              onSelectTeam={onSelectTeam}
              showReachOdds={showReachOdds}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CollapsibleBracketColumn({
  title,
  roundKey,
  matches,
  roundOddsByCode,
  isFinal,
  onSelectTeam,
  open,
  onToggle,
  showReachOdds,
}: {
  title: string;
  roundKey: BracketRoundKey;
  matches: BracketMatch[];
  roundOddsByCode: Map<string, RoundOdds>;
  isFinal: boolean;
  onSelectTeam: (code: string) => void;
  open: boolean;
  onToggle: () => void;
  showReachOdds: boolean;
}) {
  const pairs = pairUp(matches);

  return (
    <div className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={onToggle}
        className="mb-1 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1 text-center transition hover:bg-accent/5"
        aria-expanded={open}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <>
          <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {showReachOdds ? ADVANCE_PROB_FIELD[roundKey].reachLabel : "Most likely winners"}
          </p>
          <div
            className={`flex flex-1 flex-col ${
              isFinal ? "justify-center" : "justify-around gap-y-3"
            }`}
          >
            {pairs.map(([first, second], idx) => (
              <div
                key={first.slot_id}
                className={`flex items-stretch ${isFinal ? "" : "gap-2"}`}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-around gap-3">
                  <MatchCard
                    match={first}
                    roundKey={roundKey}
                    roundOddsByCode={roundOddsByCode}
                    onSelectTeam={onSelectTeam}
                    showReachOdds={showReachOdds}
                  />
                  {second && (
                    <MatchCard
                      match={second}
                      roundKey={roundKey}
                      roundOddsByCode={roundOddsByCode}
                      onSelectTeam={onSelectTeam}
                      showReachOdds={showReachOdds}
                    />
                  )}
                </div>
                {!isFinal && second && (
                  <BracketConnector key={`${first.slot_id}-connector-${idx}`} />
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-[11px] text-muted-foreground">
          {matches.length} matches hidden
        </p>
      )}
    </div>
  );
}

function BracketConnector() {
  return (
    <svg
      viewBox="0 0 24 100"
      preserveAspectRatio="none"
      className="h-full w-6 shrink-0 text-foreground/25"
      aria-hidden
    >
      <path
        d="M0,25 H8 M0,75 H8 M8,25 V75 M8,50 H24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MatchCard({
  match,
  roundKey,
  roundOddsByCode,
  onSelectTeam,
  showReachOdds,
}: {
  match: BracketMatch;
  roundKey: BracketRoundKey;
  roundOddsByCode: Map<string, RoundOdds>;
  onSelectTeam: (code: string) => void;
  showReachOdds: boolean;
}) {
  const homeProb = showReachOdds
    ? getAdvanceProb(match.home.code, roundKey, roundOddsByCode)
    : null;
  const awayProb = showReachOdds
    ? getAdvanceProb(match.away.code, roundKey, roundOddsByCode)
    : null;
  const projectedWinnerCode = match.projected_winner?.code ?? null;

  return (
    <div className="command-bracket-card">
      <MatchTeamRow
        slot={match.home}
        advanceProb={homeProb}
        isFavored={
          showReachOdds &&
          homeProb !== null &&
          awayProb !== null &&
          homeProb.value >= awayProb.value
        }
        isProjectedWinner={
          !showReachOdds &&
          projectedWinnerCode !== null &&
          match.home.code === projectedWinnerCode
        }
        onSelectTeam={onSelectTeam}
      />
      <div className="my-1 h-px bg-border" />
      <MatchTeamRow
        slot={match.away}
        advanceProb={awayProb}
        isFavored={
          showReachOdds &&
          homeProb !== null &&
          awayProb !== null &&
          awayProb.value >= homeProb.value
        }
        isProjectedWinner={
          !showReachOdds &&
          projectedWinnerCode !== null &&
          match.away.code === projectedWinnerCode
        }
        onSelectTeam={onSelectTeam}
      />
      {match.match_id != null && (
        <div className="mt-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Match {match.match_id}
        </div>
      )}
    </div>
  );
}

function MatchTeamRow({
  slot,
  advanceProb,
  isFavored,
  isProjectedWinner,
  onSelectTeam,
}: {
  slot: BracketMatch["home"];
  advanceProb: AdvanceProb | null;
  isFavored: boolean;
  isProjectedWinner: boolean;
  onSelectTeam: (code: string) => void;
}) {
  const isResolved = Boolean(slot.code) && slot.code !== "TBD";

  return (
    <button
      type="button"
      disabled={!isResolved}
      onClick={() => isResolved && onSelectTeam(slot.code as string)}
      className={`flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition ${
        isResolved ? "hover:bg-accent/10" : "cursor-default"
      }${isProjectedWinner ? " bg-accent/15 ring-1 ring-accent/40" : ""}`}
    >
      <TeamBadge code={slot.code} size="sm" />
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-sm font-medium ${
            isResolved ? "text-foreground" : "text-muted-foreground/50"
          }`}
        >
          {slot.team ?? "TBD"}
        </div>
        <div className="truncate text-[10px] text-muted-foreground/70">
          {slot.source ?? "—"}
        </div>
      </div>
      {advanceProb && (
        <span
          className="shrink-0 text-right"
          title={`${advanceProb.label.trim()} simulated chance to ${advanceProb.reachLabel.toLowerCase()}`}
        >
          <span
            className={`block font-mono text-xs font-bold tabular-nums ${
              isFavored ? "text-gold" : "text-muted-foreground"
            }`}
          >
            {advanceProb.label.trim()}
          </span>
          <span className="block text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
            {advanceProb.reachLabel}
          </span>
        </span>
      )}
    </button>
  );
}
