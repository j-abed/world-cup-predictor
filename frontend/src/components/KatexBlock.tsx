import katex from "katex";
import "katex/dist/katex.min.css";

interface KatexBlockProps {
  math: string;
  display?: boolean;
}

export function KatexBlock({ math, display = true }: KatexBlockProps) {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: display,
  });

  return (
    <div
      className={
        display
          ? "methodology-prose__katex methodology-prose__katex--display"
          : "methodology-prose__katex"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
