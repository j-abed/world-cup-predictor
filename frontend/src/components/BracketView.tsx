import { useMemo } from "react";
import type { Bracket, BracketMatch, BracketRoundKey, RoundOdds } from "../types";
import { ROUND_SEQUENCE, orderedBracketRounds, pairUp } from "../lib/bracket";
import { TeamBadge } from "./TeamBadge";

interface BracketViewProps {
  bracket: Bracket;
  roundOdds: RoundOdds[];
  onSelectTeam: (code: string) => void;
}

const ROUND_TITLES: Record<BracketRoundKey, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinals: "Quarterfinals",
  semifinals: "Semifinals",
  final: "Final",
};

/** The odds.round field that represents "wins this round's match" — i.e. reaches the next stage. */
const WIN_PROB_FIELD: Record<
  BracketRoundKey,
  { value: keyof RoundOdds; label: keyof RoundOdds }
> = {
  round_of_32: { value: "r16_prob", label: "r16_prob_label" },
  round_of_16: { value: "qf_prob", label: "qf_prob_label" },
  quarterfinals: { value: "sf_prob", label: "sf_prob_label" },
  semifinals: { value: "final_prob", label: "final_prob_label" },
  final: { value: "champion_prob", label: "champion_prob_label" },
};

interface WinProb {
  value: number;
  label: string;
}

function getWinProb(
  code: string | null,
  roundKey: BracketRoundKey,
  byCode: Map<string, RoundOdds>,
): WinProb | null {
  if (!code || code === "TBD") return null;
  const odds = byCode.get(code);
  if (!odds) return null;
  const field = WIN_PROB_FIELD[roundKey];
  return { value: odds[field.value] as number, label: odds[field.label] as string };
}

export function BracketView({ bracket, roundOdds, onSelectTeam }: BracketViewProps) {
  const rounds = useMemo(() => orderedBracketRounds(bracket), [bracket]);
  const roundOddsByCode = useMemo(
    () => new Map(roundOdds.map((odds) => [odds.code, odds])),
    [roundOdds],
  );

  return (
    <section className="pitch-card-strong rounded-3xl p-5 sm:p-8">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Projected Knockout Bracket
          </h2>
          <p className="text-sm text-muted-foreground">
            Built from current group standings — updates as results come in.
            Percentages show each team&apos;s chance of winning that match.
          </p>
        </div>
        <span className="text-xs text-muted-foreground sm:hidden">
          Scroll sideways to see the full bracket →
        </span>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 pt-4 sm:-mx-8 sm:px-8">
        <div className="grid min-w-[1180px] grid-cols-5 gap-x-6">
          {ROUND_SEQUENCE.map((roundKey) => (
            <BracketColumn
              key={roundKey}
              title={ROUND_TITLES[roundKey]}
              roundKey={roundKey}
              matches={rounds[roundKey]}
              roundOddsByCode={roundOddsByCode}
              isFinal={roundKey === "final"}
              onSelectTeam={onSelectTeam}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BracketColumn({
  title,
  roundKey,
  matches,
  roundOddsByCode,
  isFinal,
  onSelectTeam,
}: {
  title: string;
  roundKey: BracketRoundKey;
  matches: BracketMatch[];
  roundOddsByCode: Map<string, RoundOdds>;
  isFinal: boolean;
  onSelectTeam: (code: string) => void;
}) {
  const pairs = pairUp(matches);

  return (
    <div className="flex flex-col">
      <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
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
              />
              {second && (
                <MatchCard
                  match={second}
                  roundKey={roundKey}
                  roundOddsByCode={roundOddsByCode}
                  onSelectTeam={onSelectTeam}
                />
              )}
            </div>
            {!isFinal && second && (
              <BracketConnector key={`${first.slot_id}-connector-${idx}`} />
            )}
          </div>
        ))}
      </div>
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
}: {
  match: BracketMatch;
  roundKey: BracketRoundKey;
  roundOddsByCode: Map<string, RoundOdds>;
  onSelectTeam: (code: string) => void;
}) {
  const homeProb = getWinProb(match.home.code, roundKey, roundOddsByCode);
  const awayProb = getWinProb(match.away.code, roundKey, roundOddsByCode);
  const homeFavored = Boolean(
    homeProb && (!awayProb || homeProb.value >= awayProb.value),
  );
  const awayFavored = Boolean(
    awayProb && (!homeProb || awayProb.value >= homeProb.value),
  );

  return (
    <div className="glass rounded-xl p-2.5">
      <MatchTeamRow
        slot={match.home}
        winProb={homeProb}
        isFavored={homeProb !== null && awayProb !== null && homeFavored}
        onSelectTeam={onSelectTeam}
      />
      <div className="my-1 h-px bg-border" />
      <MatchTeamRow
        slot={match.away}
        winProb={awayProb}
        isFavored={homeProb !== null && awayProb !== null && awayFavored}
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
  winProb,
  isFavored,
  onSelectTeam,
}: {
  slot: BracketMatch["home"];
  winProb: WinProb | null;
  isFavored: boolean;
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
      }`}
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
      {winProb && (
        <span
          className={`shrink-0 font-mono text-xs font-bold tabular-nums ${
            isFavored ? "text-gold" : "text-muted-foreground"
          }`}
        >
          {winProb.label.trim()}
        </span>
      )}
    </button>
  );
}
