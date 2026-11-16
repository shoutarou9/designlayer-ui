"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TagInputRowProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  /** Controlled tags. */
  tags?: readonly string[];
  defaultTags?: readonly string[];
  placeholder?: string;
  /** Upper limit. The input hides its placeholder and shows the count once reached. */
  max?: number;
  onTagsChange?: (tags: string[]) => void;
  /** Accessible name for the text field. */
  ariaLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const LEAVE_MS = 220;

const CSS = `
@keyframes tag-input-row-in { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: none; } }
@keyframes tag-input-row-nudge { 0%, 100% { transform: none; } 30% { transform: translateX(-3px); } 60% { transform: translateX(3px); } }
.tag-input-row-in { animation: tag-input-row-in 340ms ${EASE} both; }
.tag-input-row-nudge { animation: tag-input-row-nudge 320ms ${EASE}; }
.tag-input-row-out { opacity: 0; transform: scale(0.7); transition: opacity ${LEAVE_MS}ms ${EASE}, transform ${LEAVE_MS}ms ${EASE}; }
@media (prefers-reduced-motion: reduce) {
  .tag-input-row-in, .tag-input-row-nudge { animation: none; }
  .tag-input-row-out { transition: none; }
}
`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const TagInputRow = React.forwardRef<HTMLDivElement, TagInputRowProps>(
  (
    {
      tags,
      defaultTags = ["design", "react"],
      placeholder = "Add a tag…",
      max,
      onTagsChange,
      ariaLabel = "Add tag",
      className,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState<string[]>(() => [
      ...defaultTags,
    ]);
    const list = tags ? [...tags] : uncontrolled;
    const [draft, setDraft] = React.useState("");
    const [armed, setArmed] = React.useState(false);
    const [leaving, setLeaving] = React.useState<string | null>(null);
    const [nudged, setNudged] = React.useState<string | null>(null);
    const initialTags = React.useRef(new Set(list));
    const inputRef = React.useRef<HTMLInputElement>(null);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const full = max !== undefined && list.length >= max;

    React.useEffect(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
      },
      [],
    );

    const emit = (next: string[]) => {
      if (!tags) setUncontrolled(next);
      onTagsChange?.(next);
    };

    const add = (raw: string) => {
      const pieces = raw
        .split(",")
        .map((piece) => piece.trim())
        .filter(Boolean);
      if (pieces.length === 0) return;
      const next = [...list];
      for (const piece of pieces) {
        if (max !== undefined && next.length >= max) break;
        const existing = next.find(
          (tag) => tag.toLowerCase() === piece.toLowerCase(),
        );
        if (existing) {
          setNudged(existing);
          continue;
        }
        next.push(piece);
      }
      if (next.length !== list.length) emit(next);
    };

    const remove = (tag: string) => {
      setArmed(false);
      if (prefersReducedMotion()) {
        emit(list.filter((item) => item !== tag));
        return;
      }
      setLeaving(tag);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setLeaving(null);
        emit(list.filter((item) => item !== tag));
      }, LEAVE_MS);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        add(draft);
        setDraft("");
        setArmed(false);
        return;
      }
      if (event.key === "Backspace" && draft === "" && list.length > 0) {
        event.preventDefault();
        // First press highlights the last chip, the second press removes it.
        if (armed) {
          const last = list[list.length - 1];
          if (last) remove(last);
        } else {
          setArmed(true);
        }
        return;
      }
      if (event.key === "Escape") setArmed(false);
    };

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      setArmed(false);
      if (text.includes(",")) {
        const parts = text.split(",");
        const rest = parts.pop() ?? "";
        add(parts.join(","));
        setDraft(rest);
        return;
      }
      setDraft(text);
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="tag-input-row"
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
        className={cn(
          "flex w-[420px] max-w-full cursor-text flex-wrap items-center gap-1.5 rounded-[16px] bg-white p-2",
          "shadow-[0_14px_32px_-20px_rgba(15,23,42,0.4),inset_0_0_0_1px_rgba(15,23,42,0.09)]",
          "transition-shadow duration-300 motion-reduce:transition-none",
          "focus-within:shadow-[0_16px_34px_-20px_rgba(15,23,42,0.45),inset_0_0_0_1.5px_rgba(24,24,27,0.75)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <ul className="contents" aria-label="Tags">
          {list.map((tag, index) => {
            const isLast = index === list.length - 1;
            return (
              <li
                key={tag}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-[10px] py-0 pr-1 pl-2.5 text-[13px] font-medium tracking-[-0.01em]",
                  "transition-colors duration-300 motion-reduce:transition-none",
                  !initialTags.current.has(tag) && "tag-input-row-in",
                  leaving === tag && "tag-input-row-out",
                  nudged === tag && "tag-input-row-nudge",
                  armed && isLast
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-800",
                )}
                onAnimationEnd={(event) => {
                  if (event.animationName === "tag-input-row-nudge")
                    setNudged(null);
                }}
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => remove(tag)}
                  className={cn(
                    "grid size-6 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent",
                    "transition-colors duration-200 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                    armed && isLast
                      ? "text-white/70 hover:bg-white/15 hover:text-white"
                      : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800",
                  )}
                >
                  <X aria-hidden className="size-3.5" strokeWidth={2.4} />
                </button>
              </li>
            );
          })}
        </ul>
        <span className="flex min-w-[112px] flex-1 items-center">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            aria-label={ariaLabel}
            enterKeyHint="enter"
            readOnly={full}
            placeholder={full ? "" : placeholder}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={() => setArmed(false)}
            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1.5 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 read-only:cursor-default"
          />
          {max !== undefined ? (
            <span
              aria-live="polite"
              className={cn(
                "shrink-0 pr-1.5 pl-2 text-[12px] font-medium tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                full ? "text-zinc-900" : "text-zinc-400",
              )}
            >
              {list.length}/{max}
            </span>
          ) : null}
        </span>
      </div>
    );
  },
);

TagInputRow.displayName = "TagInputRow";
