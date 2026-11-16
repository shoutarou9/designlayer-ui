"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type LikeHeartButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "type" | "value" | "defaultValue"
> & {
  liked?: boolean;
  defaultLiked?: boolean;
  /** Called with the new liked state and the count that goes with it. */
  onLikedChange?: (liked: boolean, count: number) => void;
  /** Controlled total. When omitted, the button keeps its own count. */
  count?: number;
  /** Starting total for the uncontrolled count (already includes a default like). */
  defaultCount?: number;
  /** Accessible name while liked. */
  likedLabel?: string;
  /** Accessible name while not liked. */
  unlikedLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes like-heart-button-pop { 0% { transform: scale(1); } 40% { transform: scale(1.34) rotate(-10deg); } 100% { transform: scale(1) rotate(0deg); } }
@keyframes like-heart-button-settle { 0% { transform: scale(1); } 45% { transform: scale(0.78); } 100% { transform: scale(1); } }
@keyframes like-heart-button-ring { 0% { transform: scale(0.55); opacity: 0.55; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes like-heart-button-in-up { from { transform: translateY(70%); opacity: 0; filter: blur(3px); } to { transform: translateY(0); opacity: 1; filter: blur(0); } }
@keyframes like-heart-button-in-down { from { transform: translateY(-70%); opacity: 0; filter: blur(3px); } to { transform: translateY(0); opacity: 1; filter: blur(0); } }
@keyframes like-heart-button-out-up { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-70%); opacity: 0; filter: blur(3px); } }
@keyframes like-heart-button-out-down { from { transform: translateY(0); opacity: 1; } to { transform: translateY(70%); opacity: 0; filter: blur(3px); } }
.like-heart-button-icon { animation-duration: 460ms; animation-timing-function: ${EASE}; animation-fill-mode: both; }
.like-heart-button-ring { animation: like-heart-button-ring 520ms ${EASE} both; }
.like-heart-button-digit { grid-area: 1 / 1; animation-duration: 420ms; animation-timing-function: ${EASE}; animation-fill-mode: both; }
@media (prefers-reduced-motion: reduce) {
  .like-heart-button-icon, .like-heart-button-digit { animation: none !important; }
  .like-heart-button-ring, .like-heart-button-digit[data-leaving] { display: none; }
}
`;

const formatCount = (n: number) => n.toLocaleString("en-US");

export const LikeHeartButton = React.forwardRef<HTMLButtonElement, LikeHeartButtonProps>(
  (
    {
      liked,
      defaultLiked = false,
      onLikedChange,
      count,
      defaultCount = 24,
      likedLabel = "Liked",
      unlikedLabel = "Like",
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const [ownLiked, setOwnLiked] = React.useState(defaultLiked);
    const [ownCount, setOwnCount] = React.useState(defaultCount);
    const isLiked = liked ?? ownLiked;
    const total = Math.max(0, count ?? ownCount);
    // popKey > 0 means the user has acted at least once, so the heart may animate.
    const [popKey, setPopKey] = React.useState(0);

    // Track the outgoing number during render so the swap starts on the same frame.
    const [reel, setReel] = React.useState<{
      value: number;
      prev: number | null;
      direction: "up" | "down";
      key: number;
    }>({ value: total, prev: null, direction: "up", key: 0 });
    if (reel.value !== total) {
      setReel({
        value: total,
        prev: reel.value,
        direction: total > reel.value ? "up" : "down",
        key: reel.key + 1,
      });
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !isLiked;
      const nextCount = Math.max(0, total + (next ? 1 : -1));
      if (liked === undefined) setOwnLiked(next);
      if (count === undefined) setOwnCount(nextCount);
      setPopKey((k) => k + 1);
      onLikedChange?.(next, nextCount);
    };

    return (
      <button
        ref={ref}
        type="button"
        data-tsuna-id="like-heart-button"
        data-liked={isLiked ? "" : undefined}
        aria-pressed={isLiked}
        onClick={handleClick}
        className={cn(
          "group inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full border-0 bg-white py-[6px] pr-5 pl-[6px]",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8eaed]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <span
          aria-hidden
          className={cn(
            "relative grid size-9 shrink-0 place-items-center rounded-full",
            "transition-colors duration-300 motion-reduce:transition-none",
            isLiked
              ? "bg-zinc-950 text-white"
              : "bg-zinc-100 text-zinc-900 group-hover:bg-zinc-200",
          )}
        >
          {popKey > 0 && isLiked ? (
            <span
              key={`ring-${popKey}`}
              className="like-heart-button-ring pointer-events-none absolute inset-0 rounded-full ring-2 ring-zinc-950/60"
            />
          ) : null}
          <Heart
            key={`heart-${popKey}`}
            className={cn(
              "like-heart-button-icon size-[17px] transition-[fill] duration-300 motion-reduce:transition-none",
              isLiked ? "fill-current" : "fill-transparent",
            )}
            style={
              popKey > 0
                ? {
                    animationName: isLiked
                      ? "like-heart-button-pop"
                      : "like-heart-button-settle",
                  }
                : undefined
            }
            strokeWidth={2.2}
          />
        </span>
        <span className="sr-only">{isLiked ? likedLabel : unlikedLabel}</span>
        <span
          className={cn(
            "grid min-w-[2ch] overflow-hidden py-1 text-left text-[15px] leading-none font-semibold tabular-nums tracking-[-0.02em]",
            "transition-colors duration-300 motion-reduce:transition-none",
            isLiked ? "text-zinc-950" : "text-zinc-700",
          )}
        >
          {reel.prev !== null ? (
            <span
              key={`out-${reel.key}`}
              aria-hidden
              data-leaving=""
              className="like-heart-button-digit"
              style={{ animationName: `like-heart-button-out-${reel.direction}` }}
              onAnimationEnd={() => {
                const done = reel.key;
                setReel((cur) => (cur.key === done ? { ...cur, prev: null } : cur));
              }}
            >
              {formatCount(reel.prev)}
            </span>
          ) : null}
          <span
            key={`in-${reel.key}`}
            className="like-heart-button-digit"
            style={
              reel.key > 0
                ? { animationName: `like-heart-button-in-${reel.direction}` }
                : undefined
            }
          >
            {formatCount(total)}
          </span>
        </span>
      </button>
    );
  },
);

LikeHeartButton.displayName = "LikeHeartButton";
