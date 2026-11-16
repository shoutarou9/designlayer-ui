"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type IntervalSegOption = {
  value: string;
  label: string;
};

export const INTERVAL_SEG_DEFAULT_OPTIONS: readonly IntervalSegOption[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

export type IntervalSegControlProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  options?: readonly IntervalSegOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the group. */
  ariaLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const PAD = 3;

export const IntervalSegControl = React.forwardRef<HTMLDivElement, IntervalSegControlProps>(
  (
    {
      options = INTERVAL_SEG_DEFAULT_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      ariaLabel = "Time range",
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const items = options.length > 0 ? options : INTERVAL_SEG_DEFAULT_OPTIONS;
    const [uncontrolled, setUncontrolled] = React.useState(
      defaultValue ?? items[1]?.value ?? items[0]?.value ?? "",
    );
    const selected = value ?? uncontrolled;
    const index = Math.max(
      0,
      items.findIndex((item) => item.value === selected),
    );
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

    const choose = (next: string) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      let nextIndex: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = index + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = index - 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = items.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      const wrapped = (nextIndex + items.length) % items.length;
      const next = items[wrapped];
      if (!next) return;
      choose(next.value);
      buttons.current[wrapped]?.focus();
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        data-tsuna-id="interval-seg-control"
        onKeyDown={onKeyDown}
        className={cn(
          "relative inline-grid rounded-[12px] bg-zinc-900/[0.06] p-[3px]",
          "shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]",
          className,
        )}
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(3.25rem, 1fr))`, ...style }}
        {...props}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-[9px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_4px_10px_-4px_rgba(15,23,42,0.18)] motion-reduce:!transition-none"
          style={{
            top: PAD,
            left: PAD,
            height: `calc(100% - ${PAD * 2}px)`,
            width: `calc((100% - ${PAD * 2}px) / ${items.length})`,
            transform: `translateX(${index * 100}%)`,
            transition: `transform 420ms ${EASE}`,
          }}
        />
        {items.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.value}
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => choose(item.value)}
              className={cn(
                "relative z-10 h-8 cursor-pointer rounded-[9px] border-0 bg-transparent px-3",
                "text-[13px] leading-none font-semibold tabular-nums tracking-[-0.01em]",
                "transition-colors duration-300 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35",
                active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  },
);

IntervalSegControl.displayName = "IntervalSegControl";
