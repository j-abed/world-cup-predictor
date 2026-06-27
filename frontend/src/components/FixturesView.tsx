import { useMemo } from "react";
import type { FixtureMatch } from "../types";
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
      className="pitch-card flex flex-col gap-3 rounded-xl border-t-2 p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderTopColor: "var(--group-accent)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => onSelectTeam(match.home_code)}
          className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right transition hover:opacity-80"
        >
          <span className="truncate text-sm font-medium text-foreground">
            {match.home_team}
          </span>
          <TeamBadge code={match.home_code} group={match.group} size="sm" />
        </button>

        <div className="shrink-0 px-1 text-center">
          {complete ? (
            <span className="font-display text-lg font-bold tabular-nums text-foreground">
              {match.home_score}–{match.away_score}
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
          className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-80"
        >
          <TeamBadge code={match.away_code} group={match.group} size="sm" />
          <span className="truncate text-sm font-medium text-foreground">
            {match.away_team}
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--group-accent)" }}
        >
          Group {match.group}
        </span>
        <time
          dateTime={match.kickoff}
          className="text-xs text-muted-foreground"
        >
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
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchRow
              key={match.match_id}
              match={match}
              onSelectTeam={onSelectTeam}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function FixturesView({ fixtures, onSelectTeam }: FixturesViewProps) {
  const { upcoming, recent } = useMemo(() => {
    const completed = fixtures.filter(isComplete);
    const scheduled = fixtures.filter((match) => !isComplete(match));

    return {
      recent: [...completed].reverse(),
      upcoming: scheduled,
    };
  }, [fixtures]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Fixtures &amp; Results
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Group-stage schedule with live scores where available.
        </p>
      </div>

      <MatchSection
        title="Recent results"
        description="Latest completed matches, newest first."
        matches={recent}
        onSelectTeam={onSelectTeam}
        emptyMessage="No completed matches yet."
      />

      <MatchSection
        title="Upcoming"
        description="Scheduled matches yet to kick off."
        matches={upcoming}
        onSelectTeam={onSelectTeam}
        emptyMessage="All group-stage matches are complete."
      />
    </div>
  );
}
