import { useEffect, useState } from "react";
import { formatUpdatedAt } from "../lib/relativeTime";

interface UpdatedAtStatProps {
  generatedAt: string;
}

export function UpdatedAtStat({ generatedAt }: UpdatedAtStatProps) {
  const [label, setLabel] = useState(() => formatUpdatedAt(generatedAt));

  useEffect(() => {
    setLabel(formatUpdatedAt(generatedAt));

    const interval = window.setInterval(() => {
      setLabel(formatUpdatedAt(generatedAt));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [generatedAt]);

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
