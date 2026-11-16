"use client";

import * as React from "react";
import { BookOpen, Landmark, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceFlowSource = {
  id: string;
  label: string;
  /** Any small node: a lucide icon, an <img>, an inline SVG. */
  icon?: React.ReactNode;
};

const ICON_CLASS = "size-[14px]";

export const SOURCE_FLOW_DEFAULT_SOURCES: readonly SourceFlowSource[] = [
  { id: "banks", label: "Banks", icon: <Landmark className={ICON_CLASS} strokeWidth={2} /> },
  { id: "ledger", label: "Ledger", icon: <BookOpen className={ICON_CLASS} strokeWidth={2} /> },
  { id: "billing", label: "Billing", icon: <Receipt className={ICON_CLASS} strokeWidth={2} /> },
];

export type SourceFlowCardProps = React.ComponentPropsWithoutRef<"div"> & {
  /** 2–4 rows read best. */
  sources?: readonly SourceFlowSource[];
  /** Small caption under the hub. Pass "" to hide it. */
  hubLabel?: string;
  /** Optional photo behind the UI (a dark wash keeps the type readable). */
  backgroundImage?: string;
};

/** Diagram coordinates (viewBox). HTML is positioned with the same percentages. */
const VB_W = 400;
const VB_H = 240;
const PILL_LEFT = 18;
const PILL_WIDTH = 132;
const LINE_START = PILL_LEFT + PILL_WIDTH - 14;
const HUB_X = 316;
const HUB_Y = VB_H / 2;

const CSS = `
@keyframes source-flow-card-travel {
  0% { stroke-dashoffset: 2; opacity: 0; }
  12% { opacity: 1; }
  82% { opacity: 1; }
  100% { stroke-dashoffset: -100; opacity: 0; }
}
@keyframes source-flow-card-spin { to { transform: rotate(360deg); } }
.source-flow-card-dot {
  stroke-dasharray: 0.6 300;
  animation: source-flow-card-travel 2.6s cubic-bezier(0.45, 0, 0.25, 1) infinite;
}
.source-flow-card-spinner {
  transform-origin: 50% 50%;
  animation: source-flow-card-spin 1.1s steps(12) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .source-flow-card-dot { animation: none; stroke-dashoffset: -62; opacity: 1; }
  .source-flow-card-spinner { animation: none; }
}
`;

/** Fixed precision keeps server and client markup identical. */
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function pct(n: number, total: number) {
  return `${round((n / total) * 100)}%`;
}

export const SourceFlowCard = React.forwardRef<HTMLDivElement, SourceFlowCardProps>(
  (
    {
      sources = SOURCE_FLOW_DEFAULT_SOURCES,
      hubLabel = "Syncing",
      backgroundImage,
      className,
      ...props
    },
    ref,
  ) => {
    const rows = (sources.length > 0 ? sources : SOURCE_FLOW_DEFAULT_SOURCES).slice(0, 5);
    const rowY = (i: number) => ((i + 1) / (rows.length + 1)) * VB_H;
    const curve = (y: number) => {
      const mid = LINE_START + (HUB_X - LINE_START) * 0.55;
      const ry = round(y);
      const rm = round(mid);
      return `M${LINE_START} ${ry} C ${rm} ${ry}, ${round(mid - 24)} ${HUB_Y}, ${HUB_X} ${HUB_Y}`;
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="source-flow-card"
        className={cn(
          "relative isolate w-[400px] max-w-full text-white",
          backgroundImage &&
            "overflow-hidden rounded-[28px] bg-[#14122a] shadow-[0_30px_60px_-30px_rgba(10,8,30,0.7),inset_0_0_0_1px_rgba(255,255,255,0.08)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        {backgroundImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(9,8,20,0.62) 0%, rgba(9,8,20,0.34) 55%, rgba(9,8,20,0.7) 100%)",
              }}
            />
          </>
        ) : null}

        <div className="relative p-4">
          <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
            >
              {rows.map((row, i) => (
                <path
                  key={`line-${row.id}`}
                  d={curve(rowY(i))}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1.25}
                />
              ))}
              {rows.map((row, i) => (
                <g key={`dot-${row.id}`}>
                  {/* soft halo + bright core share one timing (no SVG filter, so every dot repaints) */}
                  <path
                    className="source-flow-card-dot"
                    d={curve(rowY(i))}
                    pathLength={100}
                    fill="none"
                    stroke="rgba(255,176,120,0.35)"
                    strokeWidth={14}
                    strokeLinecap="round"
                    style={{ animationDelay: `${i * 0.62}s` }}
                  />
                  <path
                    className="source-flow-card-dot"
                    d={curve(rowY(i))}
                    pathLength={100}
                    fill="none"
                    stroke="rgba(255,214,176,0.6)"
                    strokeWidth={8}
                    strokeLinecap="round"
                    style={{ animationDelay: `${i * 0.62}s` }}
                  />
                  <path
                    className="source-flow-card-dot"
                    d={curve(rowY(i))}
                    pathLength={100}
                    fill="none"
                    stroke="#fffaf2"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    style={{ animationDelay: `${i * 0.62}s` }}
                  />
                </g>
              ))}
            </svg>

            <ul className="m-0 list-none p-0">
              {rows.map((row, i) => (
                <li
                  key={row.id}
                  className={cn(
                    "absolute flex h-9 -translate-y-1/2 items-center gap-2 rounded-full py-1 pr-3 pl-1",
                    "bg-white/[0.12] text-[13.5px] font-medium tracking-[-0.01em] text-white backdrop-blur-md",
                    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_10px_24px_-14px_rgba(0,0,0,0.7)]",
                  )}
                  style={{
                    left: pct(PILL_LEFT, VB_W),
                    width: pct(PILL_WIDTH, VB_W),
                    top: pct(rowY(i), VB_H),
                  }}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                    {row.icon ?? <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="truncate">{row.label}</span>
                </li>
              ))}
            </ul>

            <div
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: pct(HUB_X, VB_W), top: pct(HUB_Y, VB_H) }}
            >
              <div
                className={cn(
                  "grid size-[72px] place-items-center rounded-[22px] bg-white text-zinc-900",
                  "shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_16px_40px_-10px_rgba(255,180,130,0.65)]",
                )}
              >
                <svg
                  role="img"
                  aria-label={hubLabel || "Syncing"}
                  className="source-flow-card-spinner size-9"
                  viewBox="0 0 40 40"
                >
                  {Array.from({ length: 12 }, (_, k) => {
                    const a = (k / 12) * Math.PI * 2;
                    return (
                      <circle
                        key={k}
                        cx={round(20 + Math.cos(a) * 14)}
                        cy={round(20 + Math.sin(a) * 14)}
                        r={2.1}
                        fill="currentColor"
                        opacity={round(0.12 + (k / 11) * 0.88)}
                      />
                    );
                  })}
                </svg>
              </div>
              {hubLabel ? (
                <span className="absolute top-full mt-2.5 text-[11.5px] font-medium tracking-[0.02em] whitespace-nowrap text-white/75">
                  {hubLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SourceFlowCard.displayName = "SourceFlowCard";
