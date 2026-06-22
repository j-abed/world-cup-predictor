interface TeamBadgeProps {
  code: string | null;
  rank?: number;
  /** Group letter (A-L) — tints the badge ring with that group's accent color. */
  group?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

const MEDAL_RING: Record<number, string> = {
  1: "ring-2 ring-accent shadow-[0_0_18px_-2px_oklch(0.84_0.17_92_/_0.55)]",
  2: "ring-2 ring-foreground/50",
  3: "ring-2 ring-amber-700/60",
};

export function TeamBadge({ code, rank, group, size = "md" }: TeamBadgeProps) {
  const isTbd = !code || code === "TBD";
  const ring = rank ? MEDAL_RING[rank] ?? "" : "";
  const groupRingStyle =
    !rank && group ? { borderColor: "var(--group-accent)" } : undefined;

  return (
    <span
      data-group={!rank && group ? group : undefined}
      style={groupRingStyle}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-display font-bold tracking-wide ${SIZE_CLASS[size]} ${ring} ${
        isTbd
          ? "border-dashed border-muted-foreground/40 text-muted-foreground"
          : "bg-secondary text-foreground border-border"
      }`}
    >
      {isTbd ? "—" : code}
    </span>
  );
}
