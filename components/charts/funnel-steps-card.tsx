"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FunnelStep = {
  label: string;
  value: number;
};

export const FUNNEL_STEPS_DEFAULT_STEPS: readonly FunnelStep[] = [
  { label: "Visited", value: 12440 },
  { label: "Signed up", value: 3180 },
  { label: "Activated", value: 1462 },
  { label: "Paid", value: 384 },
];

export type FunnelStepsCardProps = React.ComponentPropsWithoutRef<"div"> & {
  title?: string;
  /** Top of the funnel first. */
  steps?: readonly FunnelStep[];
  /** Word after the end-to-end rate in the header, e.g. "overall". */
  overallLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const BAR_MS = 800;
const STAGGER_MS = 90;
/** Smallest bar width in percent, so the last step never disappears. */
const MIN_WIDTH = 3;

function percent(part: number, whole: number) {
  if (whole <= 0) return "0%";
  const p = (part / whole) * 100;
  return `${p >= 10 ? Math.round(p) : Math.round(p * 10) / 10}%`;
}

export const FunnelStepsCard = React.forwardRef<HTMLDivElement, FunnelStepsCardProps>(
  (
    {
      title = "Signup funnel",
      steps = FUNNEL_STEPS_DEFAULT_STEPS,
      overallLabel = "overall",
      className,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const [drawn, setDrawn] = React.useState(false);
    const top = Math.max(1, ...steps.map((step) => step.value));
    const first = steps[0];
    const last = steps[steps.length - 1];

    React.useEffect(() => {
      const node = localRef.current;
      if (!node || typeof IntersectionObserver === "undefined") {
        setDrawn(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setDrawn(true);
            observer.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    const summary = steps
      .map((step) => `${step.label} ${step.value.toLocaleString("en-US")}`)
      .join(", ");

    return (
      <div
        ref={localRef}
        data-tsuna-id="funnel-steps-card"
        className={cn(
          "w-[340px] max-w-full rounded-[26px] bg-white p-5 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-zinc-500">{title}</span>
          {first && last && steps.length > 1 ? (
            <span className="text-[12px] text-zinc-400 tabular-nums">
              <span className="font-semibold text-zinc-950">{percent(last.value, first.value)}</span>{" "}
              {overallLabel}
            </span>
          ) : null}
        </div>

        <ol
          role="img"
          aria-label={`${title}: ${summary}`}
          className="m-0 mt-4 flex list-none flex-col gap-3 p-0"
        >
          {steps.map((step, index) => {
            const width = Math.max(MIN_WIDTH, (step.value / top) * 100);
            const delay = index * STAGGER_MS;
            const isLast = index === steps.length - 1 && steps.length > 1;
            return (
              <li key={step.label}>
                <div
                  className="flex items-baseline justify-between gap-3 motion-reduce:!transition-none"
                  style={{
                    opacity: drawn ? 1 : 0,
                    transition: `opacity 400ms ${EASE} ${delay + 120}ms`,
                  }}
                >
                  <span className="truncate text-[13px] text-zinc-500">{step.label}</span>
                  <span className="text-[13px] font-semibold tabular-nums">
                    {step.value.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="mt-1.5 h-[22px] rounded-[7px] bg-zinc-100">
                  <div
                    className="h-full origin-left rounded-[7px] motion-reduce:!transition-none"
                    style={{
                      width: `${width}%`,
                      backgroundColor: isLast ? "#10b981" : "#09090b",
                      transform: `scaleX(${drawn ? 1 : 0})`,
                      transition: `transform ${BAR_MS}ms ${EASE} ${delay}ms`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  },
);

FunnelStepsCard.displayName = "FunnelStepsCard";
