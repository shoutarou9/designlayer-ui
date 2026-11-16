"use client";

import * as React from "react";
import { LayoutGrid, LayoutList, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewModeOption = {
  value: string;
  /** Shown beside the icons and used as the accessible name. */
  label: string;
  icon?: LucideIcon;
};

export const VIEW_MODE_DEFAULT_OPTIONS: readonly ViewModeOption[] = [
  { value: "list", label: "List", icon: LayoutList },
  { value: "grid", label: "Grid", icon: LayoutGrid },
];

export type ViewModeSwitchProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  options?: readonly ViewModeOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  /** Show the current option's label after the icons. */
  showLabel?: boolean;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SIZE = 32;
const PAD = 3;

export const ViewModeSwitch = React.forwardRef<HTMLDivElement, ViewModeSwitchProps>(
  (
    {
      options = VIEW_MODE_DEFAULT_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      ariaLabel = "View",
      showLabel = true,
      className,
      ...props
    },
    ref,
  ) => {
    const items = options.length > 0 ? options : VIEW_MODE_DEFAULT_OPTIONS;
    const [own, setOwn] = React.useState(defaultValue ?? items[0]?.value ?? "");
    const selected = value ?? own;
    const index = Math.max(
      0,
      items.findIndex((item) => item.value === selected),
    );
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

    const choose = (next: string) => {
      if (next === items[index]?.value) return;
      if (value === undefined) setOwn(next);
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
        data-tsuna-id="view-mode-switch"
        data-view={items[index]?.value}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-white p-[6px]",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          className="relative inline-flex rounded-full bg-zinc-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]"
          style={{ padding: PAD }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-white shadow-[0_4px_10px_-4px_rgba(15,23,42,0.3),0_0_0_1px_rgba(15,23,42,0.04)] motion-reduce:!transition-none"
            style={{
              top: PAD,
              left: PAD,
              width: SIZE,
              height: SIZE,
              transform: `translateX(${index * SIZE}px)`,
              transition: `transform 460ms ${EASE}`,
            }}
          />
          {items.map((item, i) => {
            const active = i === index;
            const Icon = item.icon ?? LayoutGrid;
            return (
              <button
                key={item.value}
                ref={(node) => {
                  buttons.current[i] = node;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={item.label}
                title={item.label}
                tabIndex={active ? 0 : -1}
                onClick={() => choose(item.value)}
                className={cn(
                  "relative z-10 grid cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0",
                  "transition-colors duration-300 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35",
                  active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-700",
                )}
                style={{ width: SIZE, height: SIZE }}
              >
                <Icon
                  aria-hidden
                  className="size-[15px] motion-reduce:!transition-none"
                  strokeWidth={2.2}
                  style={{
                    transform: active ? "scale(1)" : "scale(0.86)",
                    transition: `transform 520ms ${EASE}`,
                  }}
                />
              </button>
            );
          })}
        </div>
        {showLabel ? (
          <span
            aria-hidden
            className="grid overflow-hidden pr-3 pl-2 text-[13.5px] leading-none font-medium tracking-[-0.01em] text-zinc-900"
          >
            {items.map((item, i) => {
              const offset = i - index;
              return (
                <span
                  key={item.value}
                  className="col-start-1 row-start-1 py-1 whitespace-nowrap motion-reduce:!transition-none"
                  style={{
                    opacity: offset === 0 ? 1 : 0,
                    transform: `translateY(${Math.sign(offset) * 70}%)`,
                    filter: offset === 0 ? "blur(0)" : "blur(3px)",
                    transition: `opacity 360ms ${EASE}, transform 420ms ${EASE}, filter 360ms ${EASE}`,
                  }}
                >
                  {item.label}
                </span>
              );
            })}
          </span>
        ) : null}
      </div>
    );
  },
);

ViewModeSwitch.displayName = "ViewModeSwitch";
