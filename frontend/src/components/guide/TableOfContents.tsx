import { GUIDE_TIERS } from "../../lib/guideSections";

export function TableOfContents() {
  return (
    <nav className="guide-toc" aria-label="Guide sections">
      <h3 className="guide-toc__title">On this page</h3>
      {GUIDE_TIERS.map((tier) => (
        <div key={tier.label} className="guide-toc__tier">
          <p className="guide-toc__tier-label">
            {tier.label}
            <span className="guide-toc__tier-hint">{tier.hint}</span>
          </p>
          <ol className="guide-toc__list">
            {tier.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="guide-toc__link">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
  );
}
