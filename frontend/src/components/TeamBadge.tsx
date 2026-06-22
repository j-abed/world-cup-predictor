interface TeamBadgeProps {
  code: string | null;
  rank?: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

const MEDAL_RING: Record<number, string> = {
  1: "ring-2 ring-gold-400 shadow-[0_0_18px_-2px_rgba(242,179,65,0.7)]",
  2: "ring-2 ring-pitch-200/70",
  3: "ring-2 ring-amber-700/60",
};

export function TeamBadge({ code, rank, size = "md" }: TeamBadgeProps) {
  const isTbd = !code || code === "TBD";
  const ring = rank ? MEDAL_RING[rank] ?? "" : "";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-display font-bold tracking-wide ${SIZE_CLASS[size]} ${ring} ${
        isTbd
          ? "border-dashed border-pitch-500 text-pitch-400"
          : "border-pitch-600 bg-pitch-800 text-pitch-100"
      }`}
    >
      {isTbd ? "—" : code}
    </span>
  );
}
