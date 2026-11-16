"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SoftSwitchProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "onChange" | "type" | "role"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visible text next to the switch. Pass "" to hide it (then set aria-label). */
  label?: string;
  /** Small secondary line under the label. */
  description?: string;
  disabled?: boolean;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const SoftSwitch = React.forwardRef<HTMLButtonElement, SoftSwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      label = "Email digest",
      description,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultChecked);
    const on = checked ?? uncontrolled;
    const labelId = React.useId();

    const toggle = () => {
      if (disabled) return;
      const next = !on;
      if (checked === undefined) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    return (
      <span
        data-tsuna-id="soft-switch"
        className={cn(
          "inline-flex items-center gap-3",
          disabled && "opacity-50",
          className,
        )}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={label ? labelId : undefined}
          disabled={disabled}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) toggle();
          }}
          className={cn(
            "group relative h-[30px] w-[52px] shrink-0 cursor-pointer overflow-hidden rounded-full border-0 p-0",
            "bg-zinc-300 shadow-[inset_0_1px_3px_rgba(15,23,42,0.18)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        >
          {/* "on" track crossfades over the neutral track */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#1f2937_0%,#0a0a0a_100%)] motion-reduce:!transition-none"
            style={{ opacity: on ? 1 : 0, transition: `opacity 420ms ${EASE}` }}
          />
          <span
            aria-hidden
            className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.28),0_0_0_0.5px_rgba(15,23,42,0.06)] motion-reduce:!transition-none"
            style={{
              transform: on ? "translateX(22px)" : "translateX(0)",
              transition: `transform 420ms ${EASE}`,
            }}
          />
        </button>
        {label ? (
          <span className="flex flex-col">
            <span
              id={labelId}
              onClick={toggle}
              className="cursor-pointer text-[14px] leading-tight font-medium tracking-[-0.01em] text-zinc-900 select-none"
            >
              {label}
            </span>
            {description ? (
              <span className="mt-0.5 text-[12px] leading-tight text-zinc-500">{description}</span>
            ) : null}
          </span>
        ) : null}
      </span>
    );
  },
);

SoftSwitch.displayName = "SoftSwitch";
