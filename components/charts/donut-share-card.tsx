"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DonutShareSegment = {
  label: string;
  value: number;
  /** Any CSS color. Falls back to a zinc step by position. */
  color?: string;
};

export const DONUT_SHARE_DEFAULT_SEGMENTS: readonly DonutShareSegment[] = [
  { label: "Team", value: 42, color: "#09090b" },
  { label: "Pro", value: 35, color: "#71717a" },
  { label: "Free", value: 23, color: "#e4e4e7" },
];

export type DonutShareCardProps = React.ComponentPropsWithoutRef<"div"> & {
  title?: string;
  /** Number in the hole. Counts up from 0. */
  value?: number;
  /** Small line under the number. */
  caption?: string;
  /** Largest first reads best. Shares are computed from the values. */
  segments?: readonly DonutShareSegment[];
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DRAW_MS = 1200;
const COUNT_MS = 1000;
const FALLBACK_COLORS = ["#09090b", "#71717a", "#a1a1aa", "#e4e4e7"];
const RADIUS = 46;
const STROKE = 13;
// pathLength makes dash gaps on a circle render at unequal angles.
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Gap between segments, in percent of the ring. */
const GAP = 1.4;

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

export const DonutShareCard = React.forwardRef<HTMLDivElement, DonutShareCardProps>(
  (
    {
      title = "Plan mix",
      value = 1842,
      caption = "customers",
      segments = DONUT_SHARE_DEFAULT_SEGMENTS,
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
    const maskId = React.useId().replace(/:/g, "");

    const arcs = React.useMemo(() => {
      const visible = segments.filter((segment) => segment.value > 0);
      const total = visible.reduce((sum, segment) => sum + segment.value, 0) || 1;
      const gap = visible.length > 1 ? (GAP / 100) * CIRCUMFERENCE : 0;
      let offset = 0;
      return visible.map((segment, index) => {
        const share = (segment.value / total) * 100;
        const span = (share / 100) * CIRCUMFERENCE;
        const arc = {
          label: segment.label,
          share,
          start: offset,
          length: Math.max((0.5 / 100) * CIRCUMFERENCE, span - gap),
          color: segment.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? "#09090b",
        };
        offset += span;
        return arc;
      });
    }, [segments]);

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
        setCount(value);
        return;
      }
      let frame = 0;
      const from = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - from) / COUNT_MS);
        setCount(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, value]);

    const summary = arcs.map((arc) => `${arc.label} ${Math.round(arc.share)}%`).join(", ");

    return (
      <div
        ref={localRef}
        data-tsuna-id="donut-share-card"
        className={cn(
          "w-[340px] max-w-full rounded-[28px] bg-white p-6 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <span className="text-[13px] font-medium text-zinc-500">{title}</span>

        <div className="mt-4 flex items-center gap-6">
          <div
            role="img"
            aria-label={`${title}: ${summary}`}
            className="relative aspect-square w-[148px] shrink-0"
          >
            <svg aria-hidden viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
                  <circle
                    cx={60}
                    cy={60}
                    r={RADIUS}
                    pathLength={100}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={STROKE + 2}
                    className="motion-reduce:!transition-none"
                    style={{
                      // The mask shares the ring's rotated space, so it also starts at 12 o'clock.
                      // The dash runs slightly past a full turn so no seam shows once drawn.
                      strokeDasharray: "100.5 102",
                      strokeDashoffset: started ? 0 : 101,
                      transition: `stroke-dashoffset ${DRAW_MS}ms ${EASE}`,
                    }}
                  />
                </mask>
              </defs>
              <g mask={`url(#${maskId})`} transform="rotate(-90 60 60)">
                {arcs.map((arc) => (
                  <circle
                    key={arc.label}
                    cx={60}
                    cy={60}
                    r={RADIUS}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                    strokeDashoffset={-arc.start}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px] leading-none font-semibold tabular-nums tracking-[-0.04em]">
                {count.toLocaleString("en-US")}
              </span>
              {caption ? (
                <span className="mt-1.5 text-[11.5px] text-zinc-400">{caption}</span>
              ) : null}
            </div>
          </div>

          <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-3 p-0">
            {arcs.map((arc, index) => (
              <li
                key={arc.label}
                className="flex items-center gap-2 motion-reduce:!transition-none"
                style={{
                  opacity: started ? 1 : 0,
                  transition: `opacity 400ms ${EASE} ${500 + index * 40}ms`,
                }}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-500">{arc.label}</span>
                <span className="text-[13px] font-semibold tabular-nums">{Math.round(arc.share)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  },
);

DonutShareCard.displayName = "DonutShareCard";
