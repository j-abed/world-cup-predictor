import type { ReactNode } from "react";

interface CodeBlockProps {
  children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className="guide-code-block">
      <code>{children}</code>
    </pre>
  );
}

interface GuideSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function GuideSection({ id, title, children }: GuideSectionProps) {
  return (
    <section
      id={id}
      className="guide-section"
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="guide-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function GuideProse({ children }: { children: ReactNode }) {
  return <p className="guide-prose">{children}</p>;
}

export function GuideList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="guide-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function GuideDivider() {
  return <hr className="guide-divider" aria-hidden />;
}
