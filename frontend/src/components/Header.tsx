import type { Metadata } from "../types";

interface HeaderProps {
  metadata: Metadata;
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function Header({ metadata }: HeaderProps) {
  const totalSimulations =
    metadata.simulations.tournament + metadata.simulations.round;

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div
        className="pitch-markings pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              World Cup 2026
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              World Cup Predictor
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              A live-updating projected bracket and championship odds,
              simulated from current group results and team ratings.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4 lg:w-auto">
            <Stat label="Updated" value={formatGeneratedAt(metadata.generated_at)} />
            <Stat
              label="Results in"
              value={`${metadata.completed_result_count} / ${metadata.fixture_count}`}
            />
            <Stat
              label="Simulations run"
              value={totalSimulations.toLocaleString()}
            />
            <Stat label="Teams" value={String(metadata.team_count)} />
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {metadata.ratings_source && (
            <span>
              Ratings:{" "}
              {metadata.ratings_source_url ? (
                <a
                  href={metadata.ratings_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border underline-offset-2 hover:text-accent"
                >
                  {metadata.ratings_source}
                </a>
              ) : (
                metadata.ratings_source
              )}
            </span>
          )}
        </div>

        {metadata.data_caveats.length > 0 && (
          <details className="group glass mt-5 rounded-xl open:border-accent/30">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <span>Data caveats &amp; methodology notes</span>
              <span className="text-muted-foreground/60 transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <ul className="space-y-1.5 px-4 pb-4 text-xs text-muted-foreground">
              {metadata.data_caveats.map((caveat) => (
                <li key={caveat} className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  <span>{caveat}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-base font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
