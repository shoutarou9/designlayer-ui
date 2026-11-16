"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusPipelineStage = {
  id: string;
  label: string;
  /** Short line under the label. */
  detail?: string;
  /** How long the highlight stays on this stage (ms). */
  durationMs?: number;
};

export const STATUS_PIPELINE_DEFAULT_STAGES: readonly StatusPipelineStage[] = [
  { id: "queued", label: "Queued", detail: "Waiting for a runner", durationMs: 1300 },
  { id: "running", label: "Running", detail: "npm run build · 214 modules", durationMs: 2300 },
  { id: "done", label: "Done", detail: "Finished in 38s", durationMs: 2600 },
];

export type StatusPipelineCardProps = React.ComponentPropsWithoutRef<"div"> & {
  stages?: readonly StatusPipelineStage[];
  /** Job name in the header. */
  title?: string;
  /** Short id or tag beside the title. */
  tag?: string;
  /** Start again after holding on the last stage. */
  loop?: boolean;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROW = 64;
/** Vertical centre of a stage node inside its row (mt-0.5 + half of size-7). */
const NODE_CENTER = 16;

const CSS = `
@keyframes status-pipeline-card-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(125,211,252,0.55); } 50% { box-shadow: 0 0 0 7px rgba(125,211,252,0); } }
.status-pipeline-card-glow { animation: status-pipeline-card-glow 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
@media (prefers-reduced-motion: reduce) { .status-pipeline-card-glow { animation: none; } }
`;

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
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export const StatusPipelineCard = React.forwardRef<HTMLDivElement, StatusPipelineCardProps>(
  (
    {
      stages = STATUS_PIPELINE_DEFAULT_STAGES,
      title = "Build",
      tag = "#1284",
      loop = true,
      className,
      ...props
    },
    ref,
  ) => {
    const items = stages.length > 0 ? stages : STATUS_PIPELINE_DEFAULT_STAGES;
    const last = items.length - 1;
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [step, setStep] = React.useState(0);
    const current = reduced ? last : step;

    React.useEffect(() => {
      if (reduced || !inView) return;
      if (step === last && !loop) return;
      const hold = items[step]?.durationMs ?? 1600;
      const timer = window.setTimeout(() => {
        setStep((s) => (s >= last ? 0 : s + 1));
      }, hold);
      return () => window.clearTimeout(timer);
    }, [step, last, loop, items, reduced, inView]);

    const finished = current === last;

    return (
      <div
        ref={localRef}
        data-tsuna-id="status-pipeline-card"
        className={cn(
          "relative w-[380px] max-w-full overflow-hidden rounded-[26px] bg-[#0b0f17] p-5 text-white",
          "shadow-[0_30px_60px_-30px_rgba(2,6,23,0.85),inset_0_0_0_1px_rgba(148,163,184,0.12)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            maskImage: "linear-gradient(180deg, black, transparent 75%)",
            WebkitMaskImage: "linear-gradient(180deg, black, transparent 75%)",
          }}
        />
        <div className="relative flex items-center justify-between">
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">{title}</span>
            <span className="font-mono text-[12px] text-slate-400">{tag}</span>
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors duration-500 motion-reduce:transition-none",
              finished ? "bg-emerald-400/15 text-emerald-300" : "bg-sky-400/15 text-sky-300",
            )}
            aria-live="polite"
          >
            {items[current]?.label}
          </span>
        </div>

        <ol className="relative m-0 mt-5 list-none p-0">
          <span
            aria-hidden
            className="absolute left-[13px] w-[2px] rounded-full bg-slate-500/25"
            style={{ top: NODE_CENTER, height: last * ROW }}
          />
          <span
            aria-hidden
            className="absolute left-[13px] w-[2px] origin-top rounded-full motion-reduce:!transition-none"
            style={{
              top: NODE_CENTER,
              height: last * ROW,
              transform: `scaleY(${last > 0 ? current / last : 1})`,
              background: finished
                ? "linear-gradient(180deg,#38bdf8,#34d399)"
                : "linear-gradient(180deg,#38bdf8,#7dd3fc)",
              transition: `transform 620ms ${EASE}`,
            }}
          />
          {items.map((stage, i) => {
            const past = i < current;
            const now = i === current;
            const done = past || (now && i === last);
            return (
              <li
                key={stage.id}
                className="relative flex items-start gap-3.5"
                style={{ height: i === last ? undefined : ROW }}
                aria-current={now ? "step" : undefined}
              >
                <span
                  className={cn(
                    "relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                    "transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none",
                    done && "bg-emerald-400 text-[#0b0f17]",
                    now && !done && "status-pipeline-card-glow bg-sky-400 text-[#0b0f17]",
                    !now && !done && "bg-[#0b0f17] text-slate-500 shadow-[inset_0_0_0_2px_rgba(100,116,139,0.45)]",
                  )}
                >
                  {done ? (
                    <Check aria-hidden className="size-3.5" strokeWidth={3.2} />
                  ) : (
                    <span
                      aria-hidden
                      className={cn("size-2 rounded-full", now ? "bg-[#0b0f17]" : "bg-slate-500/70")}
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-col pt-[3px]">
                  <span
                    className={cn(
                      "text-[14px] font-semibold tracking-[-0.01em] transition-colors duration-500 motion-reduce:transition-none",
                      now ? "text-white" : past ? "text-slate-300" : "text-slate-500",
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.detail ? (
                    <span
                      className={cn(
                        "mt-1 truncate font-mono text-[11.5px] transition-colors duration-500 motion-reduce:transition-none",
                        now ? "text-slate-300" : "text-slate-500",
                      )}
                    >
                      {stage.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  },
);

StatusPipelineCard.displayName = "StatusPipelineCard";
