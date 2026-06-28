import { KatexBlock } from "../KatexBlock";

interface MathBlockProps {
  math: string;
}

export function MathBlock({ math }: MathBlockProps) {
  return (
    <div className="guide-math-block">
      <KatexBlock math={math} />
    </div>
  );
}

interface InlineMathProps {
  math: string;
}

export function InlineMath({ math }: InlineMathProps) {
  return (
    <span className="guide-inline-math">
      <KatexBlock math={math} display={false} />
    </span>
  );
}
