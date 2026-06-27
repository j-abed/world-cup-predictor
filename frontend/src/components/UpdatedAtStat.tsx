import { useSyncExternalStore } from "react";
import { formatUpdatedAt } from "../lib/relativeTime";

interface UpdatedAtStatProps {
  generatedAt: string;
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

export function UpdatedAtStat({ generatedAt }: UpdatedAtStatProps) {
  const now = useMinuteTick();
  const label = formatUpdatedAt(generatedAt, now);

  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Updated
      </dt>
      <dd
        className="mt-0.5 font-display text-base font-semibold text-foreground"
        title={generatedAt}
      >
        {label}
      </dd>
    </div>
  );
}
