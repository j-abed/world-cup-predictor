import type { GroupCoverage, Metadata } from "../types";

interface CoverageBannerProps {
  metadata: Metadata;
  coverage: GroupCoverage[];
}

export function CoverageBanner({ metadata, coverage }: CoverageBannerProps) {
  const played = metadata.completed_result_count;
  const total = metadata.fixture_count;
  const remaining = Math.max(0, total - played);
  const progress = total > 0 ? (played / total) * 100 : 0;
  const resultsComplete = played >= total;

  const incompleteGroups = coverage.filter(
    (group) => !group.has_complete_fixture_set,
  );

  if (resultsComplete && incompleteGroups.length === 0) {
    return (
      <div
        className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3"
        role="status"
      >
        <p className="text-sm font-medium text-foreground">
          All {total} group-stage results are in.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Projections reflect the full group-stage picture.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {resultsComplete
              ? "Group-stage results complete"
              : `${played} of ${total} group-stage matches played`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {resultsComplete
              ? "Fixture data still has coverage gaps — projections may shift."
              : remaining === 1
                ? "1 match remaining — odds and bracket projections update as results come in."
                : `${remaining} matches remaining — odds and bracket projections update as results come in.`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-display text-2xl font-bold text-gold">
            {Math.round(progress)}%
          </span>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Complete
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/60"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {incompleteGroups.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Incomplete fixture sets:{" "}
          {incompleteGroups.map((group) => `Group ${group.group}`).join(", ")}
        </p>
      )}
    </div>
  );
}
