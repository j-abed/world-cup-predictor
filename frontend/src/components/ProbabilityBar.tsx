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
  variant?: "default" | "board";
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
  variant = "default",
  className = "",
}: ProbabilityBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, value));
  const isBoard = variant === "board";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedWidth(clamped * 100));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const displayLabel = valueLabel?.trim() ?? `${(clamped * 100).toFixed(1)}%`;
  const showLabel = !isBoard && (label || valueLabel);

  return (
    <div className={`w-full ${isBoard ? "prob-bar--board" : ""} ${className}`}>
      {showLabel ? (
        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
          {label ? (
            <span className="truncate text-muted-foreground">{label}</span>
          ) : null}
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {displayLabel}
          </span>
        </div>
      ) : null}
      <div
        className={`prob-bar__track ${SIZE_TRACK[size]}${isBoard ? " prob-bar__track--board" : " rounded-full bg-foreground/10"}`}
      >
        <div
          className={`prob-bar__fill h-full transition-[width] duration-700 ease-out${isBoard ? " prob-bar__fill--board" : " rounded-full"}`}
          style={{ width: `${animatedWidth}%`, background: TONE_FILL[tone] }}
        />
      </div>
    </div>
  );
}
