import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type HintPlacement = "top" | "bottom";
type HintAlign = "start" | "center" | "end";

interface HoverHintProps {
  label: ReactNode;
  hint: ReactNode;
  className?: string;
  triggerClassName?: string;
  placement?: HintPlacement;
  align?: HintAlign;
  compact?: boolean;
  /** When false, only the label is the trigger (no ? icon). Better for tight table headers. */
  showIcon?: boolean;
}

function alignClass(align: HintAlign): string {
  switch (align) {
    case "start":
      return "hover-hint--align-start";
    case "end":
      return "hover-hint--align-end";
    case "center":
      return "hover-hint--align-center";
    default: {
      const _exhaustive: never = align;
      return _exhaustive;
    }
  }
}

function placementClass(placement: HintPlacement): string {
  switch (placement) {
    case "top":
      return "hover-hint--top";
    case "bottom":
      return "hover-hint--bottom";
    default: {
      const _exhaustive: never = placement;
      return _exhaustive;
    }
  }
}

const POPOVER_GAP_PX = 6;
const VIEWPORT_PADDING_PX = 8;

const HIDDEN_POPOVER_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  pointerEvents: "none",
};

export function HoverHint({
  label,
  hint,
  className = "",
  triggerClassName = "",
  placement = "top",
  align = "center",
  compact = false,
  showIcon = true,
}: HoverHintProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] =
    useState<CSSProperties>(HIDDEN_POPOVER_STYLE);

  const positioned = popoverStyle.visibility === "visible";

  const computePosition = useCallback((): CSSProperties | null => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;

    if (!trigger || !popover) {
      return null;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const maxWidth = Math.min(224, window.innerWidth - VIEWPORT_PADDING_PX * 2);

    if (popoverRect.width <= 0 || popoverRect.height <= 0) {
      return null;
    }

    let top =
      placement === "bottom"
        ? triggerRect.bottom + POPOVER_GAP_PX
        : triggerRect.top - popoverRect.height - POPOVER_GAP_PX;

    let left = triggerRect.left;

    if (align === "center") {
      left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
    } else if (align === "end") {
      left = triggerRect.right - popoverRect.width;
    }

    const viewportMinLeft = VIEWPORT_PADDING_PX;
    const viewportMaxLeft =
      window.innerWidth - popoverRect.width - VIEWPORT_PADDING_PX;

    left = Math.max(viewportMinLeft, Math.min(left, viewportMaxLeft));

    if (placement === "top" && top < VIEWPORT_PADDING_PX) {
      top = triggerRect.bottom + POPOVER_GAP_PX;
    }

    if (
      placement === "bottom" &&
      top + popoverRect.height > window.innerHeight - VIEWPORT_PADDING_PX
    ) {
      top = triggerRect.top - popoverRect.height - POPOVER_GAP_PX;
    }

    return {
      position: "fixed",
      top,
      left,
      maxWidth,
      visibility: "visible",
      pointerEvents: "none",
    };
  }, [align, placement]);

  const updatePosition = useCallback(() => {
    const nextStyle = computePosition();
    if (!nextStyle) {
      return false;
    }

    setPopoverStyle(nextStyle);
    return true;
  }, [computePosition]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    let rafId = 0;
    let attempts = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) {
        return;
      }

      if (updatePosition()) {
        return;
      }

      attempts += 1;
      if (attempts >= 4) {
        return;
      }

      rafId = window.requestAnimationFrame(measure);
    };

    rafId = window.requestAnimationFrame(measure);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [open, updatePosition, hint]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  const show = () => {
    setPopoverStyle(HIDDEN_POPOVER_STYLE);
    setOpen(true);
  };

  const hide = () => {
    setOpen(false);
    setPopoverStyle(HIDDEN_POPOVER_STYLE);
  };

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            id={tooltipId}
            ref={popoverRef}
            role="tooltip"
            className={`hover-hint__popover hover-hint__popover--floating${compact ? " hover-hint__popover--compact" : ""}${positioned ? "" : " hover-hint__popover--measuring"}`}
            style={popoverStyle}
          >
            {typeof hint === "string" ? (
              <span className="hover-hint__text">{hint}</span>
            ) : (
              hint
            )}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        className={`hover-hint ${placementClass(placement)} ${alignClass(align)}${compact ? " hover-hint--compact" : ""}${showIcon ? "" : " hover-hint--label-only"}${className ? ` ${className}` : ""}`}
      >
        <button
          ref={triggerRef}
          type="button"
          className={`hover-hint__trigger${triggerClassName ? ` ${triggerClassName}` : ""}`}
          aria-describedby={open && positioned ? tooltipId : undefined}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
        >
          <span className="hover-hint__label">{label}</span>
          {showIcon ? (
            <span className="hover-hint__icon" aria-hidden>
              ?
            </span>
          ) : null}
        </button>
      </span>
      {popover}
    </>
  );
}
