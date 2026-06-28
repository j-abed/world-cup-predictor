import { useEffect, useState } from "react";

/**
 * Re-renders the caller every `intervalMs` milliseconds.
 * Useful for time-sensitive UI that needs to stay current without server data.
 */
export function useMinuteTick(intervalMs = 60_000): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

/**
 * A group-stage match runs ~90 min + 15 min half-time + stoppage.
 * If more than this has elapsed since kickoff, we treat it as "likely finished"
 * even if the backend JSON hasn't refreshed yet.
 */
const MATCH_WINDOW_MS = 115 * 60 * 1_000;

export function isMatchLikelyOver(kickoff: string): boolean {
  const ms = new Date(kickoff).getTime();
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms > MATCH_WINDOW_MS;
}
