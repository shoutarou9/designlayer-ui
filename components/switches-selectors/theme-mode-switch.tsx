"use client";

import * as React from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeModeOption = {
  value: string;
  /** Used as the accessible name and tooltip. */
  label: string;
  icon?: LucideIcon;
};

export const THEME_MODE_DEFAULT_OPTIONS: readonly ThemeModeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export type ThemeModeSwitchProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  options?: readonly ThemeModeOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SIZE = 32;
const PAD = 4;

/**
 * Visual-only theme picker for a header. It reports the chosen value;
 * wire `onValueChange` to your own theme provider.
 */
export const ThemeModeSwitch = React.forwardRef<HTMLDivElement, ThemeModeSwitchProps>(
  (
    {
      options = THEME_MODE_DEFAULT_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      ariaLabel = "Theme",
      className,
      ...props
    },
    ref,
  ) => {
    const items = options.length > 0 ? options : THEME_MODE_DEFAULT_OPTIONS;
    const [uncontrolled, setUncontrolled] = React.useState(
      defaultValue ?? items[0]?.value ?? "",
    );
    const selected = value ?? uncontrolled;
    const index = Math.max(
      0,
      items.findIndex((item) => item.value === selected),
    );
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
    const dark = items[index]?.value === "dark";

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
        data-tsuna-id="theme-mode-switch"
        data-mode={items[index]?.value}
        onKeyDown={onKeyDown}
        className={cn(
          "relative inline-flex rounded-full p-1 transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none",
          dark
            ? "bg-zinc-900 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "bg-white shadow-[0_10px_28px_-14px_rgba(15,23,42,0.35),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full motion-reduce:!transition-none",
            dark ? "bg-white" : "bg-zinc-950",
          )}
          style={{
            top: PAD,
            left: PAD,
            width: SIZE,
            height: SIZE,
            transform: `translateX(${index * SIZE}px)`,
            transition: `transform 460ms ${EASE}, background-color 460ms ${EASE}`,
          }}
        />
        {items.map((item, i) => {
          const active = i === index;
          const Icon = item.icon ?? Monitor;
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70",
                active
                  ? dark
                    ? "text-zinc-950"
                    : "text-white"
                  : dark
                    ? "text-zinc-500 hover:text-zinc-200"
                    : "text-zinc-400 hover:text-zinc-700",
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
    );
  },
);

ThemeModeSwitch.displayName = "ThemeModeSwitch";
