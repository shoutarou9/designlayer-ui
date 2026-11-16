"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type UsageMeterCardProps = React.ComponentPropsWithoutRef<"div"> & {
  value: number;
  max: number;
  label?: string;
  /** Unit after the max, e.g. "seats" or "GB". */
  unit?: string;
  /** Line under the meter. Defaults to "{max - value} {unit} left". */
  caption?: string;
  /** Plan or account name in the header. */
  planLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SWEEP = 270;
const RADIUS = 78;
const CENTER = 100;
const FILL_MS = 1300;

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function polar(angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(CENTER + RADIUS * Math.cos(a)), y: round(CENTER + RADIUS * Math.sin(a)) };
}

/** 270° arc that opens at the bottom. */
const ARC_PATH = (() => {
  const start = polar(-SWEEP / 2);
  const end = polar(SWEEP / 2);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;
})();

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

export const UsageMeterCard = React.forwardRef<HTMLDivElement, UsageMeterCardProps>(
  (
    { value, max, label = "Seats used", unit = "seats", caption, planLabel = "Team plan", className, ...props },
    ref,
  ) => {
    const safeMax = Math.max(1, max);
    const target = Math.min(Math.max(value, 0), safeMax);
    const ratio = target / safeMax;
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
        const eased = 1 - Math.pow(1 - t, 3);
        setCount(Math.round(target * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, target]);

    const filled = started ? ratio : 0;
    const high = ratio >= 0.85;
    const left = Math.max(0, Math.round(safeMax - target));
    const line = caption ?? `${left} ${unit} left`;
    const gradientId = React.useId().replace(/:/g, "");

    return (
      <div
        ref={localRef}
        data-tsuna-id="usage-meter-card"
        className={cn(
          "w-[340px] max-w-full rounded-[28px] bg-white p-6 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold tracking-[-0.01em]">{label}</span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11.5px] font-medium text-zinc-500">
            {planLabel}
          </span>
        </div>

        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={target}
          aria-valuetext={`${target} of ${safeMax} ${unit}`}
          className="relative mx-auto mt-3 aspect-square w-[220px] max-w-full"
        >
          <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={high ? "#fb7185" : "#6366f1"} />
                <stop offset="100%" stopColor={high ? "#f43f5e" : "#0ea5e9"} />
              </linearGradient>
            </defs>
            <path
              d={ARC_PATH}
              fill="none"
              stroke="#eef0f3"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <path
              d={ARC_PATH}
              pathLength={100}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={14}
              strokeLinecap="round"
              className="motion-reduce:!transition-none"
              style={{
                strokeDasharray: "100 100",
                strokeDashoffset: 100 - filled * 100,
                opacity: filled > 0 ? 1 : 0,
                transition: `stroke-dashoffset ${FILL_MS}ms ${EASE}, opacity 200ms linear`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[52px] leading-none font-semibold tabular-nums tracking-[-0.05em]">
              {count}
            </span>
            <span className="mt-1.5 text-[13px] font-medium text-zinc-400">
              of {safeMax} {unit}
            </span>
          </div>
        </div>

        <div className="-mt-4 flex items-center justify-center gap-2 text-[13px] text-zinc-500">
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", high ? "bg-rose-500" : "bg-emerald-500")}
          />
          {line}
        </div>
      </div>
    );
  },
);

UsageMeterCard.displayName = "UsageMeterCard";
