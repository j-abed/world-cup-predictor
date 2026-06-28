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

interface GuideNoteProps {
  title: string;
  children: ReactNode;
}

function NoteIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="guide-note__icon"
    >
      <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 5v3.5M6 3.5v.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GuideNote({ title, children }: GuideNoteProps) {
  return (
    <aside className="guide-note">
      <p className="guide-note__title">
        <NoteIcon />
        {title}
      </p>
      <div className="guide-note__body">{children}</div>
    </aside>
  );
}

interface GuideCompareRow {
  label: string;
  snapshot: string;
  projection: string;
}

export function GuideCompareTable({
  rows,
}: {
  rows: GuideCompareRow[];
}) {
  return (
    <div className="guide-table-wrap">
      <table className="guide-table">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">Snapshot</th>
            <th scope="col">Projection</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.snapshot}</td>
              <td>{row.projection}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface GuideMetricRow {
  component: string;
  exportValue: string;
  meaning: string;
}

export function GuideMetricTable({ rows }: { rows: GuideMetricRow[] }) {
  return (
    <div className="guide-table-wrap">
      <table className="guide-table">
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col">This export</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.component}>
              <th scope="row">{row.component}</th>
              <td>{row.exportValue}</td>
              <td>{row.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
