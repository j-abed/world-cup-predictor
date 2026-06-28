import type { Movement } from "../../types";
import type { PathTimelineStep } from "../../lib/pathToFinal";
import { TeamBadge } from "../TeamBadge";
import { ProbabilityDelta } from "../MovementSummary";

interface InsightRailProps {
  movement?: Movement;
  pathSteps: PathTimelineStep[];
  focusTeam: string;
  focusCode: string;
  variant?: "inline" | "cockpit";
}

function pickMovers(movement: Movement | undefined) {
  const source = movement?.biggest_movers.length
    ? movement.biggest_movers
    : (movement?.top_champion_changes ?? []);

  return source
    .filter((row) => Math.abs(row.delta) > 1e-6)
    .slice(0, 3);
}

function MoverSparkline({ delta }: { delta: number }) {
  const up = delta > 0;
  const flat = Math.abs(delta) < 1e-6;
  const points = flat
    ? "2,8 8,8 14,8"
    : up
      ? "2,12 6,9 10,7 14,4"
      : "2,4 6,7 10,9 14,12";

  return (
    <svg
      className={`insight-mover-spark${up ? " insight-mover-spark--up" : flat ? "" : " insight-mover-spark--down"}`}
      width="32"
      height="14"
      viewBox="0 0 16 14"
      aria-hidden
    >
      <polyline points={points} fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {!flat ? (
        <circle cx={up ? "14" : "14"} cy={up ? "4" : "12"} r="1.2" />
      ) : null}
    </svg>
  );
}

export function InsightRail({
  movement,
  pathSteps,
  focusTeam,
  focusCode,
  variant = "inline",
}: InsightRailProps) {
  const movers = pickMovers(movement);
  const railClass =
    variant === "cockpit" ? "insight-rail insight-rail--cockpit" : "insight-rail";

  return (
    <aside className={railClass} aria-label="Live insights">
      <section className="insight-card insight-card--broadcast">
        <header className="insight-card__header">
          <h3 className="insight-card__title insight-card__title--broadcast">
            Biggest movers
          </h3>
          <p className="insight-card__subtitle">vs last simulation</p>
        </header>

        {movers.length === 0 ? (
          <p className="insight-card__empty">No movement since last refresh.</p>
        ) : (
          <ul className="insight-movers insight-movers--compact">
            {movers.map((row) => {
              const isMover = "metric" in row;

              return (
                <li
                  key={`${row.code}-${isMover ? row.metric : "champion"}`}
                  className="insight-movers__row insight-movers__row--compact"
                >
                  <TeamBadge code={row.code} size="sm" />
                  <div className="insight-movers__body">
                    <span className="insight-movers__name">{row.team}</span>
                  </div>
                  <div className="insight-movers__delta insight-movers__delta--compact">
                    <MoverSparkline delta={row.delta} />
                    <ProbabilityDelta delta={row.delta} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="insight-card insight-card--path insight-card--broadcast">
        <header className="insight-card__header">
          <h3 className="insight-card__title insight-card__title--broadcast">
            {focusTeam} path to the final
          </h3>
          <p className="insight-card__subtitle">Most likely bracket route</p>
        </header>

        {pathSteps.length === 0 ? (
          <p className="insight-card__empty">
            Knockout path unavailable for this team in the current bracket.
          </p>
        ) : (
          <ol className="path-timeline path-timeline--subway">
            {pathSteps.map((step, index) => (
              <li
                key={`${step.stage}-${step.shortLabel}-${step.detail}`}
                className="path-timeline__step path-timeline__step--subway"
              >
                <div className="path-timeline__track" aria-hidden>
                  <span className="path-timeline__node path-timeline__node--subway" />
                  {index < pathSteps.length - 1 ? (
                    <span className="path-timeline__line path-timeline__line--subway" />
                  ) : null}
                </div>
                <div className="path-timeline__content path-timeline__content--subway">
                  <div className="path-timeline__row">
                    <span className="path-timeline__stage">{step.shortLabel}</span>
                    <span className="path-timeline__prob">{step.probLabel.trim()}</span>
                  </div>
                  <p className="path-timeline__detail path-timeline__detail--subway">
                    {`${step.shortLabel} — ${step.detail}`}
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
