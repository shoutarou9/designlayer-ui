"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FollowPillButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "type" | "value" | "defaultValue"
> & {
  following?: boolean;
  defaultFollowing?: boolean;
  onFollowingChange?: (following: boolean) => void;
  followLabel?: string;
  followingLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const FollowPillButton = React.forwardRef<HTMLButtonElement, FollowPillButtonProps>(
  (
    {
      following,
      defaultFollowing = false,
      onFollowingChange,
      followLabel = "Follow",
      followingLabel = "Following",
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const [own, setOwn] = React.useState(defaultFollowing);
    const on = following ?? own;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !on;
      if (following === undefined) setOwn(next);
      onFollowingChange?.(next);
    };

    const swap = (visible: boolean, from: "up" | "down"): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible
        ? "translateY(0)"
        : `translateY(${from === "up" ? "-70%" : "70%"})`,
      filter: visible ? "blur(0)" : "blur(3px)",
      transition: `opacity 360ms ${EASE}, transform 420ms ${EASE}, filter 360ms ${EASE}`,
    });

    // Plus folds away and the check slides in, both through grid-template-columns.
    const slot = (visible: boolean): React.CSSProperties => ({
      gridTemplateColumns: visible ? "1fr" : "0fr",
      marginRight: visible ? 7 : 0,
      opacity: visible ? 1 : 0,
      transition: `grid-template-columns 380ms ${EASE}, margin 380ms ${EASE}, opacity 260ms ${EASE}`,
    });

    return (
      <button
        ref={ref}
        type="button"
        data-tsuna-id="follow-pill-button"
        data-following={on ? "" : undefined}
        aria-pressed={on}
        aria-label={followLabel}
        onClick={handleClick}
        className={cn(
          "inline-flex h-11 cursor-pointer items-center rounded-full border-0 px-5",
          "text-[15px] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap",
          "transition-[background-color,color,box-shadow,transform] duration-300 active:scale-[0.96]",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8eaed]",
          on
            ? "bg-zinc-950 text-white shadow-[0_14px_30px_-14px_rgba(15,23,42,0.6),0_4px_10px_-6px_rgba(15,23,42,0.3)] hover:bg-zinc-800"
            : "bg-white text-zinc-950 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)] hover:bg-zinc-50",
          className,
        )}
        {...props}
      >
        <span aria-hidden className="grid overflow-hidden motion-reduce:!transition-none" style={slot(!on)}>
          <span className="min-w-0">
            <Plus className="size-4" strokeWidth={2.6} />
          </span>
        </span>
        <span aria-hidden className="grid overflow-hidden motion-reduce:!transition-none" style={slot(on)}>
          <span className="min-w-0">
            <Check className="size-4" strokeWidth={2.8} />
          </span>
        </span>
        <span aria-hidden className="grid justify-items-center overflow-hidden">
          <span
            className="col-start-1 row-start-1 py-1 motion-reduce:!transition-none"
            style={swap(!on, "up")}
          >
            {followLabel}
          </span>
          <span
            className="col-start-1 row-start-1 py-1 motion-reduce:!transition-none"
            style={swap(on, "down")}
          >
            {followingLabel}
          </span>
        </span>
      </button>
    );
  },
);

FollowPillButton.displayName = "FollowPillButton";
