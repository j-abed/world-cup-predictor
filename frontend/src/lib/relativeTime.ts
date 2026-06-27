const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(
  value: string,
  now = Date.now(),
): string | null {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffMs = timestamp - now;
  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < 45 * 1000) {
    return "just now";
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  if (absDiffMs < HOUR_MS) {
    return formatter.format(Math.round(diffMs / MINUTE_MS), "minute");
  }

  if (absDiffMs < DAY_MS) {
    return formatter.format(Math.round(diffMs / HOUR_MS), "hour");
  }

  if (absDiffMs < 7 * DAY_MS) {
    return formatter.format(Math.round(diffMs / DAY_MS), "day");
  }

  return null;
}

export function formatUpdatedAt(value: string, now = Date.now()): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const absolute = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  const relative = formatRelativeTime(value, now);

  return relative ? `${relative} · ${absolute}` : absolute;
}

export function formatUntil(value: string, now = Date.now()): string | null {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffMs = timestamp - now;

  if (diffMs <= 0) {
    return "soon";
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  if (diffMs < HOUR_MS) {
    return formatter.format(Math.ceil(diffMs / MINUTE_MS), "minute");
  }

  if (diffMs < DAY_MS) {
    return formatter.format(Math.ceil(diffMs / HOUR_MS), "hour");
  }

  return formatter.format(Math.ceil(diffMs / DAY_MS), "day");
}
