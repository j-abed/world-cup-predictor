interface RunTrendArrowProps {
  delta: number;
  className?: string;
}

export function RunTrendArrow({ delta, className = "" }: RunTrendArrowProps) {
  const direction =
    delta > 0 ? "up" : delta < 0 ? "down" : ("flat" as const);

  return (
    <span
      className={`terminal-trend terminal-trend--${direction} ${className}`}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {direction === "up" ? (
          <path
            d="M3 10.5 10 3.5M10 3.5H6.5M10 3.5V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {direction === "down" ? (
          <path
            d="M3 3.5 10 10.5M10 10.5H6.5M10 10.5V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {direction === "flat" ? (
          <path
            d="M2.5 7h7M7.5 5l2 2-2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </span>
  );
}
