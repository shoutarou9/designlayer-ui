"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const RADIAL_SCORE_GAUGE_DEFAULT_VALUE = 86;

export type RadialScoreGaugeProps = React.ComponentPropsWithoutRef<"div"> & {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  /** Line under the number, e.g. "Good · last 24h". */
  caption?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SWEEP_MS = 1100;
const SWEEP = 210;
const CX = 110;
const CY = 104;
const RADIUS = 84;
const TICKS = 21;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function polar(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(CX + radius * Math.cos(a)), y: round(CY + radius * Math.sin(a)) };
}

/** 210° dial that opens at the bottom. */
const DIAL_PATH = (() => {
  const start = polar(-SWEEP / 2, RADIUS);
  const end = polar(SWEEP / 2, RADIUS);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;
})();

const TICK_MARKS = Array.from({ length: TICKS }, (_, index) => {
  const angle = -SWEEP / 2 + (index / (TICKS - 1)) * SWEEP;
  const major = index % 5 === 0;
  return { from: polar(angle, major ? 66 : 70), to: polar(angle, 75), major };
});

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

export const RadialScoreGauge = React.forwardRef<HTMLDivElement, RadialScoreGaugeProps>(
  (
    {
      label = "Performance score",
      value = RADIAL_SCORE_GAUGE_DEFAULT_VALUE,
      min = 0,
      max = 100,
      caption = "Good · last 24h",
      className,
      ...props
    },
    ref,
  ) => {
    const safeMax = max > min ? max : min + 1;
    const target = Math.min(Math.max(value, min), safeMax);
    const ratio = (target - min) / (safeMax - min);
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const [started, setStarted] = React.useState(false);
    const [count, setCount] = React.useState(min);

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
        const t = Math.min(1, (now - from) / SWEEP_MS);
        setCount(Math.round(min + (target - min) * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [started, reduced, target, min]);

    const shown = started ? ratio : 0;
    const angle = -SWEEP / 2 + shown * SWEEP;
    const minPoint = polar(-SWEEP / 2, RADIUS);
    const maxPoint = polar(SWEEP / 2, RADIUS);

    return (
      <div
        ref={localRef}
        data-tsuna-id="radial-score-gauge"
        className={cn(
          "w-[340px] max-w-full rounded-[28px] bg-white p-6 text-zinc-950",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.05)]",
          className,
        )}
        {...props}
      >
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>

        <div
          role="meter"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={safeMax}
          aria-valuenow={target}
          aria-valuetext={`${target} of ${safeMax}`}
          className="mx-auto mt-2 w-[240px] max-w-full"
        >
          <svg aria-hidden viewBox="0 0 220 142" className="block h-auto w-full">
            {TICK_MARKS.map((tick, index) => (
              <line
                key={index}
                x1={tick.from.x}
                y1={tick.from.y}
                x2={tick.to.x}
                y2={tick.to.y}
                stroke={tick.major ? "#a1a1aa" : "#d4d4d8"}
                strokeWidth={tick.major ? 1.6 : 1.2}
                strokeLinecap="round"
              />
            ))}
            <path d={DIAL_PATH} fill="none" stroke="#f1f1f3" strokeWidth={6} strokeLinecap="round" />
            <path
              d={DIAL_PATH}
              pathLength={100}
              fill="none"
              stroke="#10b981"
              strokeWidth={6}
              strokeLinecap="round"
              className="motion-reduce:!transition-none"
              style={{
                strokeDasharray: "100 100",
                strokeDashoffset: 100 - shown * 100,
                opacity: shown > 0 ? 1 : 0,
                transition: `stroke-dashoffset ${SWEEP_MS}ms ${EASE}, opacity 200ms linear`,
              }}
            />
            <text x={minPoint.x} y={minPoint.y + 14} textAnchor="middle" fontSize={10} fill="#a1a1aa">
              {min}
            </text>
            <text x={maxPoint.x} y={maxPoint.y + 14} textAnchor="middle" fontSize={10} fill="#a1a1aa">
              {safeMax}
            </text>
            <g
              className="motion-reduce:!transition-none"
              style={{
                transform: `rotate(${round(angle)}deg)`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: `transform ${SWEEP_MS}ms ${EASE}`,
              }}
            >
              <path
                d={`M ${CX - 3} ${CY} L ${CX} ${CY - 62} L ${CX + 3} ${CY} Z`}
                fill="#09090b"
                stroke="#09090b"
                strokeWidth={1}
                strokeLinejoin="round"
              />
            </g>
            <circle cx={CX} cy={CY} r={6.5} fill="#fff" stroke="#09090b" strokeWidth={3} />
          </svg>
        </div>

        <div className="-mt-6 flex flex-col items-center">
          <span className="text-[44px] leading-none font-semibold tabular-nums tracking-[-0.05em]">
            {count}
          </span>
          {caption ? <span className="mt-2 text-[12px] text-zinc-400">{caption}</span> : null}
        </div>
      </div>
    );
  },
);

RadialScoreGauge.displayName = "RadialScoreGauge";
