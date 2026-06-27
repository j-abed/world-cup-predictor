import type { Movement } from "../../types";
import type { PathTimelineStep } from "../../lib/pathToFinal";
import { TeamBadge } from "../TeamBadge";
import { ProbabilityDelta } from "../MovementSummary";

interface InsightRailProps {
  movement?: Movement;
  pathSteps: PathTimelineStep[];
  focusTeam: string;
  focusCode: string;
}

function pickMovers(movement: Movement | undefined) {
  const source = movement?.biggest_movers.length
    ? movement.biggest_movers
    : (movement?.top_champion_changes ?? []);

  return source
    .filter((row) => Math.abs(row.delta) > 1e-6)
    .slice(0, 3);
}

export function InsightRail({
  movement,
  pathSteps,
  focusTeam,
  focusCode,
}: InsightRailProps) {
  const movers = pickMovers(movement);

  return (
    <aside className="insight-rail" aria-label="Live insights">
      <section className="insight-card">
        <header className="insight-card__header">
          <p className="insight-card__eyebrow">Run-over-run</p>
          <h3 className="insight-card__title">Biggest movers</h3>
        </header>

        {movers.length === 0 ? (
          <p className="insight-card__empty">No movement since last refresh.</p>
        ) : (
          <ul className="insight-movers">
            {movers.map((row) => {
              const isMover = "metric" in row;

              return (
                <li
                  key={`${row.code}-${isMover ? row.metric : "champion"}`}
                  className="insight-movers__row"
                >
                  <TeamBadge code={row.code} size="sm" />
                  <div className="insight-movers__body">
                    <span className="insight-movers__name">{row.team}</span>
                    <span className="insight-movers__metric">
                      {isMover ? row.metric.replaceAll("_", " ") : "Champion odds"}
                    </span>
                  </div>
                  <div className="insight-movers__delta">
                    <span className="insight-movers__range">
                      {(row.previous * 100).toFixed(1)}→{(row.current * 100).toFixed(1)}
                    </span>
                    <ProbabilityDelta delta={row.delta} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="insight-card insight-card--path">
        <header className="insight-card__header">
          <p className="insight-card__eyebrow">Projected route</p>
          <h3 className="insight-card__title">{focusTeam} path to the final</h3>
        </header>

        {pathSteps.length === 0 ? (
          <p className="insight-card__empty">
            Knockout path unavailable for this team in the current bracket.
          </p>
        ) : (
          <ol className="path-timeline">
            {pathSteps.map((step, index) => (
              <li
                key={`${step.stage}-${step.shortLabel}-${step.detail}`}
                className="path-timeline__step"
              >
                <div className="path-timeline__track" aria-hidden>
                  <span className="path-timeline__node" />
                  {index < pathSteps.length - 1 ? (
                    <span className="path-timeline__line" />
                  ) : null}
                </div>
                <div className="path-timeline__content">
                  <div className="path-timeline__row">
                    <span className="path-timeline__stage">{step.shortLabel}</span>
                    <span className="path-timeline__prob">{step.probLabel}</span>
                  </div>
                  <p className="path-timeline__detail">
                    {step.detail === "1st place" ? step.detail : `— ${step.detail}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {focusCode ? (
          <div className="path-timeline__footer">
            <TeamBadge code={focusCode} size="sm" />
            <span className="path-timeline__footer-label">
              Most likely knockout route
            </span>
          </div>
        ) : null}
      </section>
    </aside>
  );
}
