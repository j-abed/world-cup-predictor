import { useMemo } from "react";
import type { FixtureMatch } from "../types";
import { partitionFixtures, fixtureBucket } from "../lib/fixtures";
import { CommandEmpty, CommandPanel, CommandSection } from "./CommandPanel";
import { TeamBadge } from "./TeamBadge";

interface FixturesViewProps {
  fixtures: FixtureMatch[];
  onSelectTeam: (code: string) => void;
}

function formatKickoff(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isComplete(match: FixtureMatch): boolean {
  return match.status.toLowerCase() === "complete";
}

function isLiveOrAwaiting(match: FixtureMatch): boolean {
  return fixtureBucket(match) === "in_progress";
}

function MatchRow({
  match,
  onSelectTeam,
}: {
  match: FixtureMatch;
  onSelectTeam: (code: string) => void;
}) {
  const complete = isComplete(match);

  return (
    <div
      data-group={match.group}
      className="command-match-row"
      style={{ borderTopColor: "var(--group-accent)" }}
    >
      <div className="command-match-row__teams">
        <button
          type="button"
          onClick={() => onSelectTeam(match.home_code)}
          className="command-match-row__side command-match-row__side--home"
        >
          <span className="truncate text-sm font-medium">{match.home_team}</span>
          <TeamBadge code={match.home_code} group={match.group} size="sm" />
        </button>

        <div className="command-match-row__score">
          {complete ? (
            <span>
              {match.home_score}–{match.away_score}
            </span>
          ) : isLiveOrAwaiting(match) ? (
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                match.status.toLowerCase() === "in progress"
                  ? "text-success"
                  : "text-muted-foreground"
              }`}
            >
              {match.status.toLowerCase() === "in progress" ? "Live" : "Awaiting"}
            </span>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              vs
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelectTeam(match.away_code)}
          className="command-match-row__side"
        >
          <TeamBadge code={match.away_code} group={match.group} size="sm" />
          <span className="truncate text-sm font-medium">{match.away_team}</span>
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--group-accent)" }}
        >
          Group {match.group}
        </span>
        <time dateTime={match.kickoff} className="text-xs text-muted-foreground">
          {formatKickoff(match.kickoff)}
        </time>
      </div>
    </div>
  );
}

function MatchSection({
  title,
  description,
  matches,
  onSelectTeam,
  emptyMessage,
}: {
  title: string;
  description: string;
  matches: FixtureMatch[];
  onSelectTeam: (code: string) => void;
  emptyMessage: string;
}) {
  return (
    <CommandSection title={title} subtitle={description}>
      {matches.length === 0 ? (
        <CommandEmpty>{emptyMessage}</CommandEmpty>
      ) : (
        <div className="command-data-list">
          {matches.map((match) => (
            <MatchRow
              key={match.match_id}
              match={match}
              onSelectTeam={onSelectTeam}
            />
          ))}
        </div>
      )}
    </CommandSection>
  );
}

export function FixturesView({ fixtures, onSelectTeam }: FixturesViewProps) {
  const { recent, inProgress, upcoming } = useMemo(
    () => partitionFixtures(fixtures),
    [fixtures],
  );

  return (
    <CommandPanel
      eyebrow="Schedule feed"
      title="Fixtures & results"
      subtitle="Group-stage schedule with live scores where available."
    >
      <MatchSection
        title="Recent results"
        description="Latest completed matches, newest first."
        matches={recent}
        onSelectTeam={onSelectTeam}
        emptyMessage="No completed matches yet."
      />

      <MatchSection
        title="In progress & awaiting results"
        description="Kickoff has passed — live now or waiting for ESPN sync."
        matches={inProgress}
        onSelectTeam={onSelectTeam}
        emptyMessage="No matches waiting on a result right now."
      />

      <MatchSection
        title="Upcoming"
        description="Scheduled matches yet to kick off."
        matches={upcoming}
        onSelectTeam={onSelectTeam}
        emptyMessage="No upcoming group-stage matches on the calendar."
      />
    </CommandPanel>
  );
}
