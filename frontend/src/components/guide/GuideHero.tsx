import type { GuideHeroStat } from "../../lib/guideStats";

interface GuideHeroProps {
  stats: GuideHeroStat[];
}

export function GuideHero({ stats }: GuideHeroProps) {
  return (
    <header className="guide-hero">
      <p className="guide-hero__eyebrow">Educational Guide</p>
      <h1 className="guide-hero__title">
        How the World Cup Probability Engine Works
      </h1>
      <p className="guide-hero__lede">
        A plain-language tour of the Monte Carlo simulator, the math behind
        match scores and tiebreakers, and how to read the dashboard projections.
      </p>
      <div className="guide-hero__stats" role="list">
        {stats.map((stat) => (
          <div key={stat.label} className="guide-hero__stat" role="listitem">
            <p className="guide-hero__stat-value">{stat.value}</p>
            <p className="guide-hero__stat-label">{stat.label}</p>
          </div>
        ))}
      </div>
    </header>
  );
}
