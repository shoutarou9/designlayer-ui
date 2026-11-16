"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type RatingStarRowProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  value?: number;
  defaultValue?: number;
  /** Number of stars. */
  max?: number;
  onValueChange?: (value: number) => void;
  readOnly?: boolean;
  /** Visible label above the stars. Pass "" to hide it (it stays as the accessible name). */
  label?: string;
  /** Words shown for each rating, index 0 = 1 star. */
  hints?: readonly string[];
};

const RATING_STAR_DEFAULT_HINTS = ["Poor", "Fair", "Good", "Great", "Excellent"] as const;

const CSS = `
@keyframes rating-star-row-pop { 0% { transform: scale(1); } 40% { transform: scale(1.32) rotate(-8deg); } 100% { transform: scale(1) rotate(0deg); } }
.rating-star-row-pop { animation: rating-star-row-pop 460ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) { .rating-star-row-pop { animation: none; } }
`;

export const RatingStarRow = React.forwardRef<HTMLDivElement, RatingStarRowProps>(
  (
    {
      value,
      defaultValue = 4,
      max = 5,
      onValueChange,
      readOnly = false,
      label = "Your rating",
      hints = RATING_STAR_DEFAULT_HINTS,
      className,
      ...props
    },
    ref,
  ) => {
    const count = Math.max(1, Math.round(max));
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const rating = Math.min(Math.max(value ?? uncontrolled, 0), count);
    const [hover, setHover] = React.useState<number | null>(null);
    const [popKey, setPopKey] = React.useState(0);
    const stars = React.useRef<(HTMLButtonElement | null)[]>([]);
    const labelId = React.useId();
    const shown = readOnly ? rating : (hover ?? rating);

    const commit = (next: number) => {
      if (readOnly) return;
      const bounded = Math.min(Math.max(next, 1), count);
      if (value === undefined) setUncontrolled(bounded);
      setPopKey((k) => k + 1);
      onValueChange?.(bounded);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (readOnly) return;
      let next: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = rating + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = rating - 1;
      if (event.key === "Home") next = 1;
      if (event.key === "End") next = count;
      if (next === null) return;
      event.preventDefault();
      const bounded = Math.min(Math.max(next, 1), count);
      commit(bounded);
      stars.current[bounded - 1]?.focus();
    };

    const hint = shown > 0 ? (hints[shown - 1] ?? `${shown} / ${count}`) : "";

    return (
      <div
        ref={ref}
        data-tsuna-id="rating-star-row"
        className={cn("inline-flex flex-col gap-2", className)}
        {...props}
      >
        <style>{CSS}</style>
        {label ? (
          <span id={labelId} className="text-[13px] leading-none font-medium text-zinc-500">
            {label}
          </span>
        ) : null}
        <div className="flex items-center gap-3">
          <div
            role={readOnly ? "img" : "radiogroup"}
            aria-labelledby={label ? labelId : undefined}
            aria-label={
              readOnly ? `${rating} out of ${count}` : label ? undefined : "Rating"
            }
            onKeyDown={onKeyDown}
            onMouseLeave={() => setHover(null)}
            className="flex items-center"
          >
            {Array.from({ length: count }, (_, i) => {
              const n = i + 1;
              const filled = n <= shown;
              const preview = hover !== null && !readOnly;
              const icon = (
                <Star
                  key={n <= rating ? `on-${popKey}` : "off"}
                  aria-hidden
                  className={cn(
                    "size-7 transition-[color,fill,transform] duration-300 motion-reduce:transition-none",
                    filled
                      ? preview
                        ? "fill-amber-300 text-amber-300"
                        : "fill-amber-400 text-amber-400"
                      : "fill-transparent text-zinc-300",
                    popKey > 0 && n <= rating && !preview && "rating-star-row-pop",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                  strokeWidth={1.6}
                />
              );
              if (readOnly) {
                return (
                  <span key={n} className="p-0.5">
                    {icon}
                  </span>
                );
              }
              return (
                <button
                  key={n}
                  ref={(node) => {
                    stars.current[i] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={n === rating}
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  tabIndex={n === Math.max(rating, 1) ? 0 : -1}
                  onClick={() => commit(n)}
                  onMouseEnter={() => setHover(n)}
                  onFocus={() => setHover(null)}
                  className="cursor-pointer rounded-md border-0 bg-transparent p-0.5 transition-transform duration-200 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                >
                  {icon}
                </button>
              );
            })}
          </div>
          <span
            aria-hidden
            className="min-w-[4.5rem] text-[14px] font-semibold tracking-[-0.01em] text-zinc-800"
          >
            {hint}
          </span>
        </div>
      </div>
    );
  },
);

RatingStarRow.displayName = "RatingStarRow";
