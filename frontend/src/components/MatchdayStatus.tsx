import type { GroupCoverage, LiveContext, Metadata } from "../types";
import { isMatchLikelyOver, useMinuteTick } from "../lib/useClock";
import { TeamBadge } from "./TeamBadge";

interface MatchdayStatusProps {
  liveContext: LiveContext;
  metadata: Metadata;
  coverage: GroupCoverage[];
}

export function MatchdayStatus({
  liveContext,
  metadata,
  coverage,
}: MatchdayStatusProps) {
  useMinuteTick();

  const liveMatch = liveContext.in_progress_matches[0];
  const nextMatch = liveContext.next_match;

  // If the match has been "in progress" longer than a typical game window,
  // the backend JSON is stale — treat it as awaiting a result sync.
  const likelyOver = liveMatch ? isMatchLikelyOver(liveMatch.kickoff) : false;

  const displayMatch = liveMatch ?? nextMatch;
  const isLive = Boolean(liveMatch) && !likelyOver;
  const isAwaiting = Boolean(liveMatch) && likelyOver;

  const played = metadata.completed_result_count;
  const total = metadata.fixture_count;
  const progress = total > 0 ? (played / total) * 100 : 0;
  const resultsComplete = played >= total;

  const incompleteGroups = coverage.filter(
    (group) => !group.has_complete_fixture_set,
  );

  const hasScore =
    displayMatch &&
    displayMatch.home_score !== null &&
    displayMatch.home_score !== undefined &&
    displayMatch.away_score !== null &&
    displayMatch.away_score !== undefined;

  return (
    <section className="matchday-status" aria-label="Matchday status">
      <header className="matchday-status__label">Matchday status</header>

      {displayMatch ? (
        <div
          className={`matchday-status__match-row${isLive ? " matchday-status__match-row--live" : ""}`}
        >
          <span
            className={`matchday-status__badge${isLive ? " matchday-status__badge--live" : ""}`}
            title={isAwaiting ? "Match window has passed — awaiting result sync" : undefined}
          >
            {isLive ? "Live" : isAwaiting ? "Awaiting" : "Next"}
          </span>
          <div className="matchday-status__match-teams">
            <TeamBadge code={displayMatch.home_code} size="sm" />
            <span className="matchday-status__team">{displayMatch.home_team}</span>
            <span className="matchday-status__score">
              {hasScore
                ? `${displayMatch.home_score}–${displayMatch.away_score}`
                : "vs"}
            </span>
            <span className="matchday-status__team">{displayMatch.away_team}</span>
            <TeamBadge code={displayMatch.away_code} size="sm" />
          </div>
          <span className="matchday-status__group">Group {displayMatch.group}</span>
        </div>
      ) : null}

      <div className="matchday-status__progress-row">
        <p className="matchday-status__progress-copy">
          {resultsComplete && incompleteGroups.length === 0 ? (
            <>
              All {total} group-stage results in
              <span className="matchday-status__sep" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="matchday-status__pct">100% complete</span>
            </>
          ) : (
            <>
              {played} of {total} group-stage matches played
              <span className="matchday-status__sep" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="matchday-status__pct">
                {Math.round(progress)}% complete
              </span>
            </>
          )}
        </p>
        <div className="matchday-status__track" aria-hidden>
          <div
            className="matchday-status__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {incompleteGroups.length > 0 ? (
          <p className="matchday-status__footnote">
            Incomplete fixture sets:{" "}
            {incompleteGroups.map((group) => `Group ${group.group}`).join(", ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
