import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export const INTERACTIVE_ROW_CLASS =
  "cursor-pointer transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function activateOnEnterOrSpace(
  event: ReactKeyboardEvent,
  action: () => void,
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}
