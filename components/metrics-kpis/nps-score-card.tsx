"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const NPS_SCORE_DEFAULT_SCORE = 47;

export type NpsScoreCardProps = React.ComponentPropsWithoutRef<"div"> & {
  label?: string;
  /** −100 to 100. Counts up (or down) from 0. */
  score?: number;
  /** Sample size on the right of the header, e.g. "420 responses". */
  caption?: string;
  /** Percent of promoters (9–10). */
  promoters?: number;
  /** Percent of passives (7–8). */
  passives?: number;
  /** Percent of detractors (0–6). */
  detractors?: number;
  promotersLabel?: string;
  passivesLabel?: string;
  detractorsLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const COUNT_MS = 1000;
const SEGMENT_MS = 600;
const STAGGER_MS = 80;

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

export const NpsScoreCard = React.forwardRef<HTMLDivElement, NpsScoreCardProps>(
  (
    {
      label = "NPS",
      score = NPS_SCORE_DEFAULT_SCORE,
      caption = "420 responses",
      promoters = 58,
      passives = 31,
      detractors = 11,
      promotersLabel = "Promoters",
      passivesLabel = "Passives",
      detractorsLabel = "Detractors",
      className,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const [started, setStarted] = React.useState(false);
    const [count, setCount] = React.useState(0);
    const groups = [
      { key: "promoters", name: promotersLabel, share: Math.max(0, promoters), color: "#10b981" },
      { key: "passives", name: passivesLabel, share: Math.max(0, passives), color: "#d4d4d8" },
      { key: "detractors", name: detractorsLabel, share: Math.max(0, detractors), color: "#f43f5e" },
    ];
    const total = groups.reduce((sum, group) => sum + group.share, 0) || 1;

    React.useEffect(() => {
      const node = localRef.current;
      if (!node || typeof IntersectionObserver === "undefined") {
        setStarted(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
      if (!started) return;
      if (reduced) {
        setCount(score);
        return;
      }
      let frame = 0;
      const from = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - from) / COUNT_MS);
        setCount(Math.round(score * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, score]);

    const summary = groups.map((group) => `${group.name} ${Math.round(group.share)}%`).join(", ");

    return (
      <div
        ref={localRef}
        data-tsuna-id="nps-score-card"
        className={cn(
          "w-[340px] max-w-full rounded-[26px] bg-white p-5 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-zinc-500">{label}</span>
          {caption ? <span className="text-[12px] text-zinc-400 tabular-nums">{caption}</span> : null}
        </div>
        <div className="mt-1.5 text-[48px] leading-none font-semibold tabular-nums tracking-[-0.05em]">
          {count < 0 ? `−${Math.abs(count)}` : count}
        </div>

        <div role="img" aria-label={`${label} ${score}: ${summary}`} className="mt-5 flex h-2.5 gap-[3px]">
          {groups.map((group, index) =>
            group.share > 0 ? (
              <span
                key={group.key}
                className="h-full min-w-0"
                style={{ width: `${(group.share / total) * 100}%` }}
              >
                <span
                  className="block h-full w-full origin-left rounded-full motion-reduce:!transition-none"
                  style={{
                    backgroundColor: group.color,
                    transform: `scaleX(${started ? 1 : 0})`,
                    transition: `transform ${SEGMENT_MS}ms ${EASE} ${index * (STAGGER_MS + 220)}ms`,
                  }}
                />
              </span>
            ) : null,
          )}
        </div>

        <ul className="m-0 mt-4 grid list-none grid-cols-3 gap-3 p-0">
          {groups.map((group, index) => (
            <li
              key={group.key}
              className="min-w-0 motion-reduce:!transition-none"
              style={{
                opacity: started ? 1 : 0,
                transition: `opacity 400ms ${EASE} ${index * (STAGGER_MS + 220) + 200}ms`,
              }}
            >
              <span className="block text-[17px] leading-none font-semibold tabular-nums tracking-[-0.02em]">
                {Math.round(group.share)}%
              </span>
              <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-zinc-500">
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate">{group.name}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

NpsScoreCard.displayName = "NpsScoreCard";
