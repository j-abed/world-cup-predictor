import type { LiveContext, LiveMatchSummary } from "../types";
import { TeamBadge } from "./TeamBadge";

interface LiveMatchBannerProps {
  liveContext: LiveContext;
}

function MatchChip({ match, live }: { match: LiveMatchSummary; live?: boolean }) {
  const hasScore =
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        live
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-border/60 bg-background/40"
      }`}
    >
      {live ? (
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Live
        </span>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Next up
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
        <TeamBadge code={match.home_code} size="sm" />
        <span className="font-medium text-foreground">{match.home_team}</span>
        <span className="font-display text-base font-semibold tabular-nums text-foreground">
          {hasScore ? `${match.home_score}–${match.away_score}` : "vs"}
        </span>
        <span className="font-medium text-foreground">{match.away_team}</span>
        <TeamBadge code={match.away_code} size="sm" />
      </div>

      <span className="text-xs text-muted-foreground">Group {match.group}</span>
    </div>
  );
}

export function LiveMatchBanner({ liveContext }: LiveMatchBannerProps) {
  const liveMatch = liveContext.in_progress_matches[0];
  const nextMatch = liveContext.next_match;

  if (!liveMatch && !nextMatch) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      {liveMatch ? <MatchChip match={liveMatch} live /> : null}
      {!liveMatch && nextMatch ? <MatchChip match={nextMatch} /> : null}
    </div>
  );
}
