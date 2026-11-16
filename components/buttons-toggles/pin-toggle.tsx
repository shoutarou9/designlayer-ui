"use client";

import * as React from "react";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export type PinToggleProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "type" | "value" | "defaultValue"
> & {
  pinned?: boolean;
  defaultPinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  /** Label while unpinned. Pass "" (with `pinnedLabel=""`) for an icon-only circle. */
  pinLabel?: string;
  pinnedLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes pin-toggle-press { 0% { transform: translate3d(0,0,0); } 45% { transform: translate3d(0,2.5px,0) scale(0.92); } 100% { transform: translate3d(0,0,0) scale(1); } }
.pin-toggle-press { animation: pin-toggle-press 420ms ${EASE} both; }
.pin-toggle-face {
  transform: translate3d(0, 0, 0);
  transition: transform 200ms ${EASE};
  will-change: transform;
}
.pin-toggle-btn:hover .pin-toggle-face { transform: translate3d(0, -2px, 0); }
.pin-toggle-btn:active .pin-toggle-face { transform: translate3d(0, 0, 0) scale(0.96); }
@media (prefers-reduced-motion: reduce) {
  .pin-toggle-press { animation: none; }
  .pin-toggle-face,
  .pin-toggle-btn:hover .pin-toggle-face,
  .pin-toggle-btn:active .pin-toggle-face {
    transform: none;
    transition: none;
    will-change: auto;
  }
}
`;

export const PinToggle = React.forwardRef<HTMLButtonElement, PinToggleProps>(
  (
    {
      pinned,
      defaultPinned = false,
      onPinnedChange,
      pinLabel = "Pin",
      pinnedLabel = "Pinned",
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const [own, setOwn] = React.useState(defaultPinned);
    const on = pinned ?? own;
    const [pressKey, setPressKey] = React.useState(0);
    const iconOnly = !pinLabel && !pinnedLabel;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !on;
      if (pinned === undefined) setOwn(next);
      if (next) setPressKey((k) => k + 1);
      onPinnedChange?.(next);
    };

    const fade = (visible: boolean, shift: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : `translateX(${shift}px)`,
      filter: visible ? "none" : "blur(3px)",
      transition: `opacity 320ms ${EASE}, transform 420ms ${EASE}, filter 320ms ${EASE}`,
    });

    return (
      <button
        ref={ref}
        type="button"
        data-tsuna-id="pin-toggle"
        data-pinned={on ? "" : undefined}
        aria-pressed={on}
        aria-label={pinLabel || "Pin"}
        onClick={handleClick}
        className={cn(
          "pin-toggle-btn group inline-flex cursor-pointer border-0 bg-transparent p-0",
          "focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <span
          className={cn(
            "pin-toggle-face inline-flex h-11 items-center justify-center rounded-full bg-white",
            iconOnly ? "w-11" : "gap-2 pr-5 pl-4",
            "text-[14px] leading-none font-medium tracking-[-0.01em]",
            "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
            "group-focus-visible:ring-2 group-focus-visible:ring-zinc-900/35 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#e8eaed]",
          )}
        >
          <span aria-hidden className="relative grid size-5 place-items-center">
            {/* The point where the pin meets the surface. */}
            <span className="pointer-events-none absolute inset-x-0 bottom-[-1px] flex justify-center">
              <span
                className="h-[3px] rounded-full bg-zinc-950/25 motion-reduce:!transition-none"
                style={{
                  width: on ? 10 : 3,
                  opacity: on ? 1 : 0,
                  transition: `opacity 300ms ${EASE}, width 420ms ${EASE}`,
                }}
              />
            </span>
            <span key={pressKey} className={cn("grid place-items-center", pressKey > 0 && on && "pin-toggle-press")}>
              <Pin
                className={cn(
                  "size-[17px] transition-[fill,color] duration-300 motion-reduce:!transition-none",
                  on ? "fill-current text-zinc-950" : "fill-transparent text-zinc-500",
                )}
                strokeWidth={2.1}
                style={{
                  transform: on ? "none" : "rotate(38deg)",
                  transition: `transform 460ms ${EASE}, fill 300ms ${EASE}, color 300ms ${EASE}`,
                }}
              />
            </span>
          </span>
          {iconOnly ? null : (
            <span aria-hidden className="grid overflow-hidden text-left">
              <span
                className="col-start-1 row-start-1 py-1 text-zinc-600 motion-reduce:!transition-none"
                style={fade(!on, -8)}
              >
                {pinLabel}
              </span>
              <span
                className="col-start-1 row-start-1 py-1 text-zinc-950 motion-reduce:!transition-none"
                style={fade(on, 8)}
              >
                {pinnedLabel}
              </span>
            </span>
          )}
        </span>
      </button>
    );
  },
);

PinToggle.displayName = "PinToggle";
