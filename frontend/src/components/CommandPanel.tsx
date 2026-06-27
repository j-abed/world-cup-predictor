import type { ReactNode } from "react";

interface CommandPanelProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function CommandPanel({
  eyebrow,
  title,
  subtitle,
  meta,
  children,
  className = "",
}: CommandPanelProps) {
  return (
    <section className={`odds-board ${className}`.trim()}>
      <header className="odds-board__header">
        <div>
          {eyebrow ? <p className="odds-board__eyebrow">{eyebrow}</p> : null}
          <h2 className="odds-board__title">{title}</h2>
          {subtitle ? <p className="odds-board__subtitle">{subtitle}</p> : null}
        </div>
        {meta ? <div className="odds-board__meta">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function CommandPanelStack({ children }: { children: ReactNode }) {
  return <div className="command-panel-stack">{children}</div>;
}

export function CommandMetaChip({
  children,
  live = false,
}: {
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <span
      className={`odds-board__meta-chip${live ? " odds-board__meta-chip--live" : ""}`}
    >
      {children}
    </span>
  );
}

export function CommandSection({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`command-section ${className}`.trim()}>
      <header className="command-section__header">
        <h3 className="command-section__title">{title}</h3>
        {subtitle ? (
          <p className="command-section__subtitle">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function CommandStatGrid({ children }: { children: ReactNode }) {
  return <div className="command-stat-grid">{children}</div>;
}

export function CommandStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="command-stat">
      <p className="command-stat__label">{label}</p>
      <div className="command-stat__value">{children}</div>
    </div>
  );
}

export function CommandNote({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="command-note" role="note">
      <p className="command-note__title">{title}</p>
      <div className="command-note__body">{children}</div>
    </div>
  );
}

export function CommandToolbar({ children }: { children: ReactNode }) {
  return <div className="command-toolbar">{children}</div>;
}

export function CommandSubcard({
  children,
  className = "",
  group,
}: {
  children: ReactNode;
  className?: string;
  group?: string;
}) {
  return (
    <div
      data-group={group}
      className={`command-subcard ${className}`.trim()}
      style={
        group
          ? ({ borderTopColor: "var(--group-accent)" } as const)
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function CommandDataRow({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`command-data-row ${className}`.trim()}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`command-data-row command-data-row--static ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CommandTable({
  children,
  minWidth,
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="command-table-scroll">
      <table
        className="command-table"
        style={minWidth ? { minWidth } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function CommandEmpty({ children }: { children: ReactNode }) {
  return <p className="command-empty">{children}</p>;
}
