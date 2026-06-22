import { useEffect, useState } from "react";

type Tone = "gold" | "emerald" | "crimson" | "neutral";

interface ProbabilityBarProps {
  /** 0..1 */
  value: number;
  /** Precomputed display string, e.g. " 16.6%". Falls back to value * 100. */
  valueLabel?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: Tone;
  className?: string;
}

const TONE_FILL: Record<Tone, string> = {
  gold: "var(--gradient-gold)",
  emerald: "var(--success)",
  crimson: "var(--destructive)",
  neutral: "oklch(0.95 0.02 95 / 0.45)",
};

const SIZE_TRACK: Record<NonNullable<ProbabilityBarProps["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProbabilityBar({
  value,
  valueLabel,
  label,
  size = "md",
  tone = "gold",
  className = "",
}: ProbabilityBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedWidth(clamped * 100));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const displayLabel = valueLabel?.trim() ?? `${(clamped * 100).toFixed(1)}%`;

  return (
    <div className={`w-full ${className}`}>
      {(label || valueLabel) && (
        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
          {label && (
            <span className="truncate text-muted-foreground">{label}</span>
          )}
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {displayLabel}
          </span>
        </div>
      )}
      <div
        className={`relative w-full overflow-hidden rounded-full bg-foreground/10 ${SIZE_TRACK[size]}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${animatedWidth}%`, background: TONE_FILL[tone] }}
        />
      </div>
    </div>
  );
}
