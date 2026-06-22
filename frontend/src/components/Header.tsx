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
    <header className="relative overflow-hidden border-b border-pitch-800 bg-gradient-to-b from-pitch-900 via-pitch-900 to-pitch-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(242,179,65,0.16),transparent_60%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-300">
              World Cup 2026
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-pitch-100 sm:text-5xl">
              World Cup Predictor
            </h1>
            <p className="mt-3 max-w-xl text-sm text-pitch-300 sm:text-base">
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

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-pitch-400">
          {metadata.ratings_source && (
            <span>
              Ratings:{" "}
              {metadata.ratings_source_url ? (
                <a
                  href={metadata.ratings_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-pitch-600 underline-offset-2 hover:text-gold-300"
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
          <details className="group mt-5 rounded-xl border border-pitch-800 bg-pitch-900/70 open:border-pitch-700">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-pitch-300 transition hover:text-pitch-100">
              <span>Data caveats &amp; methodology notes</span>
              <span className="text-pitch-500 transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <ul className="space-y-1.5 px-4 pb-4 text-xs text-pitch-400">
              {metadata.data_caveats.map((caveat) => (
                <li key={caveat} className="flex gap-2">
                  <span className="text-pitch-600">•</span>
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
      <dt className="text-[11px] uppercase tracking-wider text-pitch-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-base font-semibold text-pitch-100">
        {value}
      </dd>
    </div>
  );
}
