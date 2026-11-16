"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const P95_LATENCY_DEFAULT_P95: readonly number[] = [
  162, 158, 171, 166, 180, 174, 169, 188, 176, 181, 179, 184,
];

export const P95_LATENCY_DEFAULT_P50: readonly number[] = [
  96, 94, 101, 98, 106, 102, 99, 110, 103, 107, 104, 108,
];

export type P95LatencyCardProps = React.ComponentPropsWithoutRef<"div"> & {
  label?: string;
  /** Pre-formatted figure, e.g. "184 ms". */
  value?: React.ReactNode;
  /** Change text, e.g. "+12 ms". A leading minus flips the arrow down. */
  delta?: string;
  /** Green when true (latency improved), red when false. */
  positive?: boolean;
  /** p95 series, oldest first. 2+ values. */
  p95?: readonly number[];
  /** p50 series, same length as p95. */
  p50?: readonly number[];
  /** Caption under the figure, e.g. "vs last hour". */
  comparison?: string;
  /** Legend text for the line. */
  p95Label?: string;
  /** Legend text for the band. */
  bandLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const LINE_MS = 1200;
const W = 300;
const H = 92;
const PAD_Y = 8;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

type Pt = { x: number; y: number };

/** Curve with flat tangents at each point, so it never overshoots a reading. */
function curve(pts: readonly Pt[], move: boolean) {
  let d = "";
  pts.forEach((p, i) => {
    const prev = pts[i - 1];
    if (!prev) {
      d += `${move ? "M" : "L"} ${p.x} ${p.y}`;
      return;
    }
    const mid = round((prev.x + p.x) / 2);
    d += ` C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
  });
  return d;
}

function layout(upper: readonly number[], lower: readonly number[]) {
  const count = Math.min(upper.length, lower.length);
  const lo = Math.min(...lower.slice(0, count), ...upper.slice(0, count));
  const hi = Math.max(...upper.slice(0, count), ...lower.slice(0, count));
  const span = hi - lo || 1;
  const toPts = (values: readonly number[]) =>
    values.slice(0, count).map((v, i) => ({
      x: round((i / (count - 1)) * W),
      y: round(H - PAD_Y - ((v - lo) / span) * (H - PAD_Y * 2)),
    }));
  const top = toPts(upper);
  const bottom = toPts(lower);
  return {
    line: curve(top, true),
    floor: curve(bottom, true),
    band: `${curve(top, true)} ${curve([...bottom].reverse(), false)} Z`,
    count,
  };
}

export const P95LatencyCard = React.forwardRef<HTMLDivElement, P95LatencyCardProps>(
  (
    {
      label = "API p95",
      value = "184 ms",
      delta = "+12 ms",
      positive = false,
      p95 = P95_LATENCY_DEFAULT_P95,
      p50 = P95_LATENCY_DEFAULT_P50,
      comparison = "vs last hour",
      p95Label = "p95",
      bandLabel = "p50–p95",
      className,
      ...props
    },
    ref,
  ) => {
    const valid = p95.length >= 2 && p50.length >= 2;
    const upper = valid ? p95 : P95_LATENCY_DEFAULT_P95;
    const lower = valid ? p50 : P95_LATENCY_DEFAULT_P50;
    const { line, floor, band, count } = React.useMemo(() => layout(upper, lower), [upper, lower]);
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const [drawn, setDrawn] = React.useState(false);
    const tint = positive ? "#10b981" : "#f43f5e";
    const falling = delta ? /^\s*[-−]/.test(delta) : false;
    const Arrow = falling ? ArrowDownRight : ArrowUpRight;

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

    return (
      <div
        ref={localRef}
        data-tsuna-id="p95-latency-card"
        className={cn(
          "w-[340px] max-w-full rounded-[26px] bg-white p-5 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[34px] leading-none font-semibold tabular-nums tracking-[-0.04em]">
            {value}
          </span>
          {delta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[12px] font-semibold tabular-nums",
                positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              )}
            >
              <Arrow aria-hidden className="size-3.5" strokeWidth={2.6} />
              {delta}
            </span>
          ) : null}
        </div>
        {delta && comparison ? (
          <span className="mt-1.5 block text-[12px] text-zinc-400">{comparison}</span>
        ) : null}

        <svg
          role="img"
          aria-label={`${label}, ${count} points, with the p50 to p95 band`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="mt-4 block h-[92px] w-full overflow-visible"
        >
          <g
            className="motion-reduce:!transition-none"
            style={{ opacity: drawn ? 1 : 0, transition: `opacity 800ms ${EASE} 200ms` }}
          >
            <path d={band} fill={tint} fillOpacity={0.12} />
            <path
              d={floor}
              fill="none"
              stroke="#a1a1aa"
              strokeWidth={1.25}
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          </g>
          <path
            d={line}
            pathLength={100}
            fill="none"
            stroke="#09090b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="motion-reduce:!transition-none"
            style={{
              strokeDasharray: "100 100",
              strokeDashoffset: drawn ? 0 : 100,
              transition: `stroke-dashoffset ${LINE_MS}ms ${EASE}`,
            }}
          />
        </svg>

        <div aria-hidden className="mt-3 flex items-center gap-4 text-[11.5px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full bg-zinc-950" />
            {p95Label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: tint, opacity: 0.22 }} />
            {bandLabel}
          </span>
        </div>
      </div>
    );
  },
);

P95LatencyCard.displayName = "P95LatencyCard";
