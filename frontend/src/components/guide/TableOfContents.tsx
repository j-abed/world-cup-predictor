import { GUIDE_SECTIONS } from "../../lib/guideSections";

export function TableOfContents() {
  return (
    <nav className="guide-toc" aria-label="Guide sections">
      <h3 className="guide-toc__title">On this page</h3>
      <ol className="guide-toc__list">
        {GUIDE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="guide-toc__link">
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
