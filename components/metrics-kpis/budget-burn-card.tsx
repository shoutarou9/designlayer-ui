"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const BUDGET_BURN_DEFAULT_VALUE = 6420;
export const BUDGET_BURN_DEFAULT_MAX = 8000;

export type BudgetBurnCardProps = React.ComponentPropsWithoutRef<"div"> & {
  label?: string;
  /** Amount spent so far. Counts up from 0. */
  value?: number;
  /** The budget. */
  max?: number;
  /** Burn rate under the bar, e.g. "$214 / day". */
  burnLabel?: string;
  /** Time left under the bar, e.g. "16 days left". */
  caption?: string;
  /** Text before each amount, e.g. "$". */
  prefix?: string;
  /** Word between the amount and the budget. */
  ofLabel?: string;
  /** Turns the bar and the percent rose. Off by default. */
  overBudget?: boolean;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FILL_MS = 1100;

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

export const BudgetBurnCard = React.forwardRef<HTMLDivElement, BudgetBurnCardProps>(
  (
    {
      label = "November ads",
      value = BUDGET_BURN_DEFAULT_VALUE,
      max = BUDGET_BURN_DEFAULT_MAX,
      burnLabel = "$214 / day",
      caption = "16 days left",
      prefix = "$",
      ofLabel = "of",
      overBudget = false,
      className,
      ...props
    },
    ref,
  ) => {
    const safeMax = Math.max(1, max);
    const target = Math.max(0, value);
    const ratio = Math.min(1, target / safeMax);
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const [started, setStarted] = React.useState(false);
    const [count, setCount] = React.useState(0);

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
        setCount(target);
        return;
      }
      let frame = 0;
      const from = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - from) / FILL_MS);
        setCount(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, target]);

    const format = (n: number) => `${prefix}${n.toLocaleString("en-US")}`;

    return (
      <div
        ref={localRef}
        data-tsuna-id="budget-burn-card"
        className={cn(
          "w-[340px] max-w-full rounded-[26px] bg-white p-5 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[34px] leading-none font-semibold tabular-nums tracking-[-0.04em]">
            {format(count)}
          </span>
          <span className="text-[13px] text-zinc-400 tabular-nums">
            {ofLabel} {format(safeMax)}
          </span>
          <span
            className={cn(
              "ml-auto text-[13px] font-semibold tabular-nums",
              overBudget ? "text-rose-600" : "text-zinc-950",
            )}
          >
            {Math.round((count / safeMax) * 100)}%
          </span>
        </div>

        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={Math.min(target, safeMax)}
          aria-valuetext={`${format(target)} of ${format(safeMax)}`}
          className="mt-5 h-2.5 overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            className="h-full origin-left rounded-full motion-reduce:!transition-none"
            style={{
              width: `${ratio * 100}%`,
              backgroundColor: overBudget ? "#f43f5e" : "#09090b",
              transform: `scaleX(${started ? 1 : 0})`,
              transition: `transform ${FILL_MS}ms ${EASE}`,
            }}
          />
        </div>

        {burnLabel || caption ? (
          <div
            className="mt-3 flex items-center justify-between gap-3 text-[12px] motion-reduce:!transition-none"
            style={{ opacity: started ? 1 : 0, transition: `opacity 400ms ${EASE} 500ms` }}
          >
            <span className="font-medium text-zinc-500 tabular-nums">{burnLabel}</span>
            <span className="text-zinc-400 tabular-nums">{caption}</span>
          </div>
        ) : null}
      </div>
    );
  },
);

BudgetBurnCard.displayName = "BudgetBurnCard";
