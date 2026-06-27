interface TrendSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function TrendSparkline({
  values,
  width = 56,
  height = 18,
  className = "",
}: TrendSparklineProps) {
  if (values.length < 2) {
    return <span className={`terminal-spark terminal-spark--flat ${className}`}>—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * innerWidth;
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;

      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const first = values[0];
  const trendClass =
    last > first
      ? "terminal-spark--up"
      : last < first
        ? "terminal-spark--down"
        : "terminal-spark--flat";

  return (
    <svg
      className={`terminal-spark ${trendClass} ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <polyline points={points} fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <circle
        cx={padding + innerWidth}
        cy={
          padding +
          innerHeight -
          ((last - min) / range) * innerHeight
        }
        r="1.75"
      />
    </svg>
  );
}
