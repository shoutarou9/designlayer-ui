"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingChecklistItem = {
  id: string;
  label: string;
  /** Marks the item as done from the start. */
  done?: boolean;
};

export type OnboardingChecklistCardProps =
  React.ComponentPropsWithoutRef<"div"> & {
    title?: string;
    /** Small line under the title. Pass "" to hide it. */
    subtitle?: string;
    items?: readonly OnboardingChecklistItem[];
    /**
     * Number of finished items (from the top). When set the card stays still;
     * leave unset to tick the rest off one by one and start over.
     */
    current?: number;
    /** Time between ticks in the demo loop (ms). */
    intervalMs?: number;
    /** "{done} of {total}". */
    progressLabel?: string;
    nextLabel?: string;
  };

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const ONBOARDING_DEFAULT_ITEMS: readonly OnboardingChecklistItem[] = [
  { id: "account", label: "Create your workspace", done: true },
  { id: "invite", label: "Invite two teammates", done: true },
  { id: "connect", label: "Connect a data source" },
  { id: "dashboard", label: "Build your first dashboard" },
  { id: "share", label: "Share a report" },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useInView<T extends Element>(ref: React.RefObject<T | null>) {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.25,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export const OnboardingChecklistCard = React.forwardRef<
  HTMLDivElement,
  OnboardingChecklistCardProps
>(
  (
    {
      title = "Get started",
      subtitle = "A few steps to set up your workspace.",
      items = ONBOARDING_DEFAULT_ITEMS,
      current,
      intervalMs = 1400,
      progressLabel = "{done} of {total}",
      nextLabel = "Up next",
      className,
      ...props
    },
    ref,
  ) => {
    const list = (items.length > 0 ? items : ONBOARDING_DEFAULT_ITEMS).slice(
      0,
      7,
    );
    const total = list.length;
    const initial = Math.min(
      total,
      list.findIndex((item) => !item.done) === -1
        ? total
        : list.findIndex((item) => !item.done),
    );
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [ticked, setTicked] = React.useState(initial);
    const looping = current === undefined && !reduced;
    const done =
      current !== undefined
        ? Math.max(0, Math.min(total, current))
        : reduced
          ? initial
          : ticked;

    React.useEffect(() => {
      if (!looping || !inView) return;
      // Hold longer on the finished list, then start over from the first open item.
      const wait = ticked >= total ? intervalMs * 2.2 : intervalMs;
      const timer = window.setTimeout(
        () => setTicked((count) => (count >= total ? initial : count + 1)),
        wait,
      );
      return () => window.clearTimeout(timer);
    }, [looping, inView, ticked, total, initial, intervalMs]);

    const ratio = total === 0 ? 0 : done / total;

    return (
      <div
        ref={localRef}
        data-tsuna-id="onboarding-checklist-card"
        data-done-count={done}
        className={cn(
          "w-[380px] max-w-full rounded-[26px] bg-white p-5 text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="m-0 text-[17px] font-semibold tracking-[-0.02em]">
              {title}
            </h3>
            {subtitle ? (
              <p className="m-0 mt-1 text-[13px] leading-5 text-zinc-500">
                {subtitle}
              </p>
            ) : null}
          </div>
          <span
            aria-live="polite"
            className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-semibold text-zinc-700 tabular-nums"
          >
            {progressLabel
              .replace("{done}", String(done))
              .replace("{total}", String(total))}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            className="h-full origin-left rounded-full bg-zinc-900 motion-reduce:!transition-none"
            style={{
              transform: `scaleX(${ratio})`,
              transition: `transform 620ms ${EASE}`,
            }}
          />
        </div>

        <ul className="m-0 mt-3 list-none p-0">
          {list.map((item, index) => {
            const isDone = index < done;
            const isNext = index === done;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[12px] px-2 transition-colors duration-500 motion-reduce:transition-none",
                  isNext ? "bg-zinc-50" : "bg-transparent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative grid size-[22px] shrink-0 place-items-center rounded-full transition-colors duration-500 motion-reduce:transition-none",
                    isDone
                      ? "bg-emerald-500"
                      : "bg-white shadow-[inset_0_0_0_1.5px_rgba(15,23,42,0.18)]",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="size-3 text-white"
                    fill="none"
                  >
                    <path
                      d="M3.4 8.3 6.6 11.3 12.6 4.9"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={isDone ? 0 : 1}
                      className="motion-reduce:!transition-none"
                      style={{
                        transition: `stroke-dashoffset 420ms ${EASE} ${isDone ? "120ms" : "0ms"}`,
                      }}
                    />
                  </svg>
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[14px] tracking-[-0.01em] transition-colors duration-500 motion-reduce:transition-none",
                    isDone
                      ? "text-zinc-400 line-through decoration-zinc-300"
                      : "font-medium text-zinc-800",
                  )}
                >
                  <span className="sr-only">{isDone ? "Done: " : ""}</span>
                  {item.label}
                </span>
                {isNext ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-zinc-500">
                    {nextLabel}
                    <ArrowRight
                      aria-hidden
                      className="size-3.5"
                      strokeWidth={2.4}
                    />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

OnboardingChecklistCard.displayName = "OnboardingChecklistCard";
