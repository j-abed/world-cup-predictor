import { useSyncExternalStore } from "react";
import { formatUntil } from "../lib/relativeTime";

interface NextRefreshStatProps {
  nextRefreshAt: string;
}

function subscribeToMinuteTicks(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(interval);
}

function useMinuteTick() {
  return useSyncExternalStore(
    subscribeToMinuteTicks,
    () => Date.now(),
    () => Date.now(),
  );
}

export function NextRefreshStat({ nextRefreshAt }: NextRefreshStatProps) {
  const now = useMinuteTick();
  const label = formatUntil(nextRefreshAt, now) ?? nextRefreshAt;

  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Next update
      </dt>
      <dd
        className="mt-0.5 font-display text-base font-semibold text-foreground"
        title={nextRefreshAt}
      >
        {label}
      </dd>
    </div>
  );
}
