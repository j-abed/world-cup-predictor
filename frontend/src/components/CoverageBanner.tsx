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
      <div className="command-coverage command-coverage--complete" role="status">
        <div className="command-coverage__copy">
          <p className="command-coverage__title">
            All {total} group-stage results are in.
          </p>
          <p className="command-coverage__subtitle">
            Projections reflect the full group-stage picture.
          </p>
        </div>
        <div className="command-coverage__stat">
          <span className="command-coverage__stat-value">100%</span>
          <span className="command-coverage__stat-label">Complete</span>
        </div>
      </div>
    );
  }

  return (
    <div className="command-coverage" role="status">
      <div className="command-coverage__main">
        <div className="command-coverage__copy">
          <p className="command-coverage__title">
            {resultsComplete
              ? "Group-stage results complete"
              : `${played} of ${total} group-stage matches played`}
          </p>
          <p className="command-coverage__subtitle">
            {resultsComplete
              ? "Fixture data still has coverage gaps — projections may shift."
              : remaining === 1
                ? "1 match remaining — odds and bracket projections update as results come in."
                : `${remaining} matches remaining — odds and bracket projections update as results come in.`}
          </p>
        </div>
        <div className="command-coverage__stat">
          <span className="command-coverage__stat-value">
            {Math.round(progress)}%
          </span>
          <span className="command-coverage__stat-label">Complete</span>
        </div>
      </div>

      <div className="command-coverage__track" aria-hidden>
        <div
          className="command-coverage__fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {incompleteGroups.length > 0 ? (
        <p className="command-coverage__footnote">
          Incomplete fixture sets:{" "}
          {incompleteGroups.map((group) => `Group ${group.group}`).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
