"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LatencyRegion = {
  id: string;
  label: string;
  /** Latency in milliseconds. */
  ms: number;
  /** Small secondary tag, e.g. "us-east-1". */
  tag?: string;
};

export const LATENCY_HEAT_DEFAULT_REGIONS: readonly LatencyRegion[] = [
  { id: "us", label: "US", tag: "us-east-1", ms: 42 },
  { id: "eu", label: "EU", tag: "eu-west-2", ms: 88 },
  { id: "apac", label: "APAC", tag: "ap-northeast-1", ms: 164 },
];

export type LatencyHeatCardProps = React.ComponentPropsWithoutRef<"div"> & {
  regions?: readonly LatencyRegion[];
  title?: string;
  /** Small caption above the title. */
  periodLabel?: string;
  /** Right end of the scale (ms). Defaults to a round number above the slowest region. */
  scaleMs?: number;
  /** Under this, bars are green; under `slowMs`, amber; otherwise red. */
  fastMs?: number;
  slowMs?: number;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GROW_MS = 1100;

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

function heat(ms: number, fast: number, slow: number) {
  if (ms < fast) return { bar: "linear-gradient(90deg,#065f46,#34d399)", text: "text-emerald-300" };
  if (ms < slow) return { bar: "linear-gradient(90deg,#78350f,#fbbf24)", text: "text-amber-200" };
  return { bar: "linear-gradient(90deg,#7f1d1d,#fb7185)", text: "text-rose-300" };
}

export const LatencyHeatCard = React.forwardRef<HTMLDivElement, LatencyHeatCardProps>(
  (
    {
      regions = LATENCY_HEAT_DEFAULT_REGIONS,
      title = "p95 latency",
      periodLabel = "Last 5 min",
      scaleMs,
      fastMs = 80,
      slowMs = 150,
      className,
      ...props
    },
    ref,
  ) => {
    const rows = regions.length > 0 ? regions : LATENCY_HEAT_DEFAULT_REGIONS;
    const slowest = Math.max(...rows.map((r) => r.ms), 1);
    const scale = scaleMs ?? Math.ceil((slowest * 1.15) / 50) * 50;
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const [started, setStarted] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

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
        setProgress(1);
        return;
      }
      let frame = 0;
      const from = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - from) / (GROW_MS + rows.length * 120));
        setProgress(t);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, rows.length]);

    const ticks = [0, scale / 2, scale];
    const average = Math.round(rows.reduce((sum, r) => sum + r.ms, 0) / rows.length);

    return (
      <div
        ref={localRef}
        data-tsuna-id="latency-heat-card"
        className={cn(
          "w-[400px] max-w-full rounded-[26px] bg-[#0d0b0b] p-6 text-white",
          "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.07)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-end justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[12.5px] font-medium text-white/45">{periodLabel}</span>
            <span className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">{title}</span>
          </span>
          <span className="text-right">
            <span className="block text-[28px] leading-none font-semibold tabular-nums tracking-[-0.03em]">
              {Math.round(average * Math.min(1, progress * 1.4))}
              <span className="ml-0.5 text-[14px] font-medium text-white/45">ms avg</span>
            </span>
          </span>
        </div>

        <ul className="m-0 mt-6 flex list-none flex-col gap-4 p-0">
          {rows.map((row, i) => {
            const tone = heat(row.ms, fastMs, slowMs);
            const width = Math.min(1, row.ms / scale);
            const delay = i * 120;
            const local = Math.min(1, Math.max(0, (progress * (GROW_MS + rows.length * 120) - delay) / GROW_MS));
            const eased = 1 - Math.pow(1 - local, 3);
            return (
              <li key={row.id} className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="text-[14px] font-semibold">{row.label}</span>
                    {row.tag ? (
                      <span className="truncate font-mono text-[11px] text-white/35">{row.tag}</span>
                    ) : null}
                  </span>
                  <span className={cn("shrink-0 text-[13px] font-semibold tabular-nums", tone.text)}>
                    {Math.round(row.ms * eased)} ms
                  </span>
                </span>
                <span
                  role="img"
                  aria-label={`${row.label}: ${row.ms} ms`}
                  className="relative block h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full motion-reduce:!transition-none"
                    style={{
                      width: `${width * 100}%`,
                      background: tone.bar,
                      transform: `scaleX(${started ? 1 : 0})`,
                      transformOrigin: "left center",
                      transition: `transform ${GROW_MS}ms ${EASE} ${delay}ms`,
                    }}
                  />
                </span>
              </li>
            );
          })}
        </ul>

        <div aria-hidden className="mt-4 flex justify-between font-mono text-[10.5px] text-white/30">
          {ticks.map((t) => (
            <span key={t}>{Math.round(t)}ms</span>
          ))}
        </div>
      </div>
    );
  },
);

LatencyHeatCard.displayName = "LatencyHeatCard";
