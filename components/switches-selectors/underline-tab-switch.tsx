"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type UnderlineTabOption = {
  value: string;
  label: string;
  /** Optional small count shown after the label. */
  count?: number;
};

export const UNDERLINE_TAB_DEFAULT_OPTIONS: readonly UnderlineTabOption[] = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity", count: 12 },
  { value: "members", label: "Members" },
  { value: "settings", label: "Settings" },
];

export type UnderlineTabSwitchProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  options?: readonly UnderlineTabOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const UnderlineTabSwitch = React.forwardRef<HTMLDivElement, UnderlineTabSwitchProps>(
  (
    {
      options = UNDERLINE_TAB_DEFAULT_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      ariaLabel = "Sections",
      className,
      ...props
    },
    ref,
  ) => {
    const items = options.length > 0 ? options : UNDERLINE_TAB_DEFAULT_OPTIONS;
    const [uncontrolled, setUncontrolled] = React.useState(
      defaultValue ?? items[0]?.value ?? "",
    );
    const selected = value ?? uncontrolled;
    const index = Math.max(
      0,
      items.findIndex((item) => item.value === selected),
    );
    const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
    const [bar, setBar] = React.useState<{ left: number; width: number } | null>(null);

    const measure = React.useCallback(() => {
      const node = tabs.current[index];
      if (!node) return;
      setBar({ left: node.offsetLeft, width: node.offsetWidth });
    }, [index]);

    React.useLayoutEffect(() => {
      measure();
    }, [measure, items]);

    React.useEffect(() => {
      const list = tabs.current[0]?.parentElement;
      if (!list || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(list);
      return () => observer.disconnect();
    }, [measure]);

    const choose = (next: string) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      let nextIndex: number | null = null;
      if (event.key === "ArrowRight") nextIndex = index + 1;
      if (event.key === "ArrowLeft") nextIndex = index - 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = items.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      const wrapped = (nextIndex + items.length) % items.length;
      const next = items[wrapped];
      if (!next) return;
      choose(next.value);
      tabs.current[wrapped]?.focus();
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        data-tsuna-id="underline-tab-switch"
        onKeyDown={onKeyDown}
        className={cn(
          "relative inline-flex max-w-full items-end gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgba(24,24,27,0.1)] [scrollbar-width:none]",
          className,
        )}
        {...props}
      >
        {items.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => choose(item.value)}
              className={cn(
                "relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 pt-2 pb-3",
                "text-[14px] leading-none font-medium tracking-[-0.01em] whitespace-nowrap",
                "transition-colors duration-300 motion-reduce:transition-none",
                "rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/30",
                active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-[3px] text-[11px] leading-none font-semibold tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                    active ? "bg-zinc-950 text-white" : "bg-zinc-900/[0.07] text-zinc-500",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-zinc-950 motion-reduce:!transition-none"
          style={{
            width: bar?.width ?? 0,
            transform: `translateX(${bar?.left ?? 0}px)`,
            opacity: bar ? 1 : 0,
            transition: `transform 460ms ${EASE}, width 460ms ${EASE}, opacity 200ms linear`,
          }}
        />
      </div>
    );
  },
);

UnderlineTabSwitch.displayName = "UnderlineTabSwitch";
