import type { LiveContext, LiveMatchSummary } from "../types";
import { isMatchLikelyOver, useMinuteTick } from "../lib/useClock";
import { TeamBadge } from "./TeamBadge";

interface LiveMatchBannerProps {
  liveContext: LiveContext;
}

function MatchChip({
  match,
  live,
}: {
  match: LiveMatchSummary;
  live?: boolean;
}) {
  const hasScore =
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined;

  const likelyOver = live ? isMatchLikelyOver(match.kickoff) : false;
  const showLive = live && !likelyOver;
  const showAwaiting = live && likelyOver;

  return (
    <div
      className={`command-match-banner${showLive ? " command-match-banner--live" : ""}`}
    >
      {showLive ? (
        <span className="command-match-banner__badge command-match-banner__badge--live">
          Live
        </span>
      ) : showAwaiting ? (
        <span
          className="command-match-banner__badge"
          title="Match window has passed — awaiting result sync"
        >
          Awaiting result
        </span>
      ) : (
        <span className="command-match-banner__badge">Next up</span>
      )}

      <div className="command-match-banner__teams">
        <TeamBadge code={match.home_code} size="sm" />
        <span className="command-match-banner__team">{match.home_team}</span>
        <span className="command-match-banner__score">
          {hasScore ? `${match.home_score}–${match.away_score}` : "vs"}
        </span>
        <span className="command-match-banner__team">{match.away_team}</span>
        <TeamBadge code={match.away_code} size="sm" />
      </div>

      <span className="command-match-banner__group">Group {match.group}</span>
    </div>
  );
}

export function LiveMatchBanner({ liveContext }: LiveMatchBannerProps) {
  useMinuteTick();

  const liveMatch = liveContext.in_progress_matches[0];
  const nextMatch = liveContext.next_match;

  if (!liveMatch && !nextMatch) {
    return null;
  }

  return (
    <div className="command-match-banner-stack">
      {liveMatch ? <MatchChip match={liveMatch} live /> : null}
      {!liveMatch && nextMatch ? <MatchChip match={nextMatch} /> : null}
    </div>
  );
}
