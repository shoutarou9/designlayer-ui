"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LockToggleProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "type" | "value" | "defaultValue"
> & {
  locked?: boolean;
  defaultLocked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  /** Label while unlocked. */
  lockLabel?: string;
  /** Label while locked. */
  lockedLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes lock-toggle-snap { 0% { transform: translateY(0); } 40% { transform: translateY(1.2px); } 70% { transform: translateY(-0.4px); } 100% { transform: translateY(0); } }
@keyframes lock-toggle-thud { 0% { transform: scale(1); } 40% { transform: scale(0.9); } 100% { transform: scale(1); } }
.lock-toggle-snap { animation: lock-toggle-snap 320ms ${EASE} 180ms both; transform-box: fill-box; }
.lock-toggle-thud { animation: lock-toggle-thud 420ms ${EASE} 140ms both; }
@media (prefers-reduced-motion: reduce) { .lock-toggle-snap, .lock-toggle-thud { animation: none; } }
`;

export const LockToggle = React.forwardRef<HTMLButtonElement, LockToggleProps>(
  (
    {
      locked,
      defaultLocked = false,
      onLockedChange,
      lockLabel = "Lock",
      lockedLabel = "Locked",
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const [own, setOwn] = React.useState(defaultLocked);
    const on = locked ?? own;
    const [snapKey, setSnapKey] = React.useState(0);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !on;
      if (locked === undefined) setOwn(next);
      if (next) setSnapKey((k) => k + 1);
      onLockedChange?.(next);
    };

    const swap = (visible: boolean, from: "up" | "down"): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible
        ? "translateY(0)"
        : `translateY(${from === "up" ? "-70%" : "70%"})`,
      filter: visible ? "blur(0)" : "blur(3px)",
      transition: `opacity 360ms ${EASE}, transform 420ms ${EASE}, filter 360ms ${EASE}`,
    });

    const snapping = snapKey > 0 && on;

    return (
      <button
        ref={ref}
        type="button"
        data-tsuna-id="lock-toggle"
        data-locked={on ? "" : undefined}
        aria-pressed={on}
        aria-label={lockLabel}
        onClick={handleClick}
        className={cn(
          "group inline-flex h-12 cursor-pointer items-center gap-3 rounded-full border-0 py-[6px] pr-6 pl-[6px]",
          "text-[15px] font-medium tracking-[-0.01em]",
          "transition-[background-color,color,box-shadow,transform] duration-500 active:scale-[0.97]",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8eaed]",
          on
            ? "bg-zinc-950 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55),0_4px_12px_-8px_rgba(0,0,0,0.3)]"
            : "bg-white text-zinc-900 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <span
          aria-hidden
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            "transition-colors duration-500 motion-reduce:transition-none",
            on ? "bg-white text-zinc-950" : "bg-zinc-100 text-zinc-900 group-hover:bg-zinc-200",
          )}
        >
          <span key={snapKey} className={cn("grid place-items-center", snapping && "lock-toggle-thud")}>
            <svg
              viewBox="0 0 24 24"
              className="size-[17px] overflow-visible"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Shackle: lifted and swung open when unlocked, drops shut when locked. */}
              <g
                className="motion-reduce:!transition-none"
                style={{
                  transformBox: "view-box",
                  transformOrigin: "16px 11px",
                  transform: on ? "translateY(0) rotate(0deg)" : "translateY(-3px) rotate(18deg)",
                  transition: `transform 420ms ${EASE}`,
                }}
              >
                <path d="M8 11V7.5a4 4 0 0 1 8 0V11" className={cn(snapping && "lock-toggle-snap")} />
              </g>
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2.4"
                className="transition-[fill] duration-300 motion-reduce:transition-none"
                fill={on ? "currentColor" : "transparent"}
              />
              <circle
                cx="12"
                cy="16"
                r="1.3"
                stroke="none"
                className="transition-[fill] duration-300 motion-reduce:transition-none"
                fill={on ? "white" : "currentColor"}
              />
            </svg>
          </span>
        </span>
        <span aria-hidden className="grid overflow-hidden text-left leading-none">
          <span className="col-start-1 row-start-1 py-1 motion-reduce:!transition-none" style={swap(!on, "up")}>
            {lockLabel}
          </span>
          <span className="col-start-1 row-start-1 py-1 motion-reduce:!transition-none" style={swap(on, "down")}>
            {lockedLabel}
          </span>
        </span>
      </button>
    );
  },
);

LockToggle.displayName = "LockToggle";
