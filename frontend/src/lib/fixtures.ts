import type { FixtureMatch } from "../types";

export type FixtureBucket = "complete" | "in_progress" | "upcoming";

function parseKickoff(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Mirrors backend live-context rules: past kickoff ≠ still upcoming. */
export function fixtureBucket(
  match: FixtureMatch,
  now: Date = new Date(),
): FixtureBucket {
  const status = match.status.toLowerCase();

  if (status === "complete") {
    return "complete";
  }

  if (status === "in progress") {
    return "in_progress";
  }

  const kickoff = parseKickoff(match.kickoff);
  if (kickoff && kickoff.getTime() <= now.getTime()) {
    return "in_progress";
  }

  return "upcoming";
}

export function partitionFixtures(
  fixtures: FixtureMatch[],
  now: Date = new Date(),
): {
  recent: FixtureMatch[];
  inProgress: FixtureMatch[];
  upcoming: FixtureMatch[];
} {
  const recent: FixtureMatch[] = [];
  const inProgress: FixtureMatch[] = [];
  const upcoming: FixtureMatch[] = [];

  for (const match of fixtures) {
    const bucket = fixtureBucket(match, now);

    switch (bucket) {
      case "complete":
        recent.push(match);
        break;
      case "in_progress":
        inProgress.push(match);
        break;
      case "upcoming":
        upcoming.push(match);
        break;
      default: {
        const exhaustive: never = bucket;
        return exhaustive;
      }
    }
  }

  recent.reverse();

  return { recent, inProgress, upcoming };
}
