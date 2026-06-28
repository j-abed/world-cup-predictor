import { useEffect, useState } from "react";
import { GUIDE_TIERS } from "../../lib/guideSections";

export function TableOfContents() {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const allIds = GUIDE_TIERS.flatMap((t) => t.sections).map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          const topmost = intersecting.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          setActiveId(topmost.target.id);
        }
      },
      {
        rootMargin: "-72px 0px -60% 0px",
        threshold: 0,
      },
    );

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="guide-toc" aria-label="Guide sections">
      <h3 className="guide-toc__title">On this page</h3>
      {GUIDE_TIERS.map((tier) => (
        <div key={tier.label} className="guide-toc__tier">
          <p className="guide-toc__tier-label">
            {tier.label}
            <span className="guide-toc__tier-hint">⏱ {tier.hint}</span>
          </p>
          <ol className="guide-toc__list">
            {tier.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`guide-toc__link${activeId === section.id ? " guide-toc__link--active" : ""}`}
                >
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
