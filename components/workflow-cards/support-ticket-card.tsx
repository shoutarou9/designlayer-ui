"use client";

import * as React from "react";
import { CircleCheck, CircleDashed, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SupportTicketStatus = "waiting" | "in-progress" | "resolved";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketCardProps = React.ComponentPropsWithoutRef<"div"> & {
  title?: string;
  ticketId?: string;
  priority?: SupportTicketPriority;
  /** Fixed status. Leave unset to step Waiting → In progress → Resolved on a loop. */
  status?: SupportTicketStatus;
  statuses?: Partial<Record<SupportTicketStatus, string>>;
  priorities?: Partial<Record<SupportTicketPriority, string>>;
  /** Latest customer message, shown as a quote. Pass "" to hide it. */
  message?: string;
  requester?: string;
  /** Pre-formatted, e.g. "Updated 4m ago". */
  updatedLabel?: string;
  /** Time on each status in the demo loop (ms). */
  intervalMs?: number;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ORDER: readonly SupportTicketStatus[] = [
  "waiting",
  "in-progress",
  "resolved",
];

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  waiting: "Waiting",
  "in-progress": "In progress",
  resolved: "Resolved",
};

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_TONE: Record<SupportTicketPriority, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-sky-50 text-sky-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-rose-50 text-rose-700",
};

const STATUS_STYLE: Record<
  SupportTicketStatus,
  { pill: string; icon: typeof Clock3; bar: string }
> = {
  waiting: {
    pill: "bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]",
    icon: Clock3,
    bar: "#f59e0b",
  },
  "in-progress": {
    pill: "bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]",
    icon: CircleDashed,
    bar: "#6366f1",
  },
  resolved: {
    pill: "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]",
    icon: CircleCheck,
    bar: "#10b981",
  },
};

const CSS = `
@keyframes support-ticket-card-spin { to { transform: rotate(360deg); } }
.support-ticket-card-spin { animation: support-ticket-card-spin 2.4s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .support-ticket-card-spin { animation: none; }
}
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
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.25,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export const SupportTicketCard = React.forwardRef<
  HTMLDivElement,
  SupportTicketCardProps
>(
  (
    {
      title = "Export to CSV drops the last row",
      ticketId = "#4821",
      priority = "high",
      status,
      statuses,
      priorities,
      message = "When I export the March report, the final row is missing every time.",
      requester = "Lena Fischer",
      updatedLabel = "Updated 4m ago",
      intervalMs = 2400,
      className,
      ...props
    },
    ref,
  ) => {
    const statusLabels = { ...STATUS_LABELS, ...statuses };
    const priorityLabels = { ...PRIORITY_LABELS, ...priorities };
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [step, setStep] = React.useState(0);
    const shown: SupportTicketStatus =
      status ?? (reduced ? "in-progress" : (ORDER[step] ?? "waiting"));
    const index = ORDER.indexOf(shown);

    React.useEffect(() => {
      if (status !== undefined || reduced || !inView) return;
      const timer = window.setTimeout(
        () => setStep((current) => (current + 1) % ORDER.length),
        step === ORDER.length - 1 ? intervalMs * 1.6 : intervalMs,
      );
      return () => window.clearTimeout(timer);
    }, [status, reduced, inView, step, intervalMs]);

    return (
      <div
        ref={localRef}
        data-tsuna-id="support-ticket-card"
        data-status={shown}
        className={cn(
          "w-[380px] max-w-full rounded-[26px] bg-white p-5 text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[12.5px] text-zinc-500">
            {ticketId}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[12px] font-semibold",
              PRIORITY_TONE[priority],
            )}
          >
            {priorityLabels[priority]}
          </span>
        </div>
        <h3 className="m-0 mt-2 text-[16.5px] leading-snug font-semibold tracking-[-0.02em]">
          {title}
        </h3>

        {message ? (
          <blockquote className="m-0 mt-3.5 flex gap-2.5 rounded-[14px] bg-zinc-50 p-3">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-300 to-sky-500 text-[11px] font-semibold text-white"
            >
              {requester.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[12.5px] font-semibold text-zinc-800">
                {requester}
              </span>
              <span className="text-[13px] leading-[1.45] text-zinc-600">
                {message}
              </span>
            </span>
          </blockquote>
        ) : null}

        <div aria-hidden className="mt-4 grid grid-cols-3 gap-1.5">
          {ORDER.map((key, i) => (
            <span
              key={key}
              className="h-1 overflow-hidden rounded-full bg-zinc-100"
            >
              <span
                className="block h-full origin-left rounded-full motion-reduce:!transition-none"
                style={{
                  background: STATUS_STYLE[shown].bar,
                  transform: `scaleX(${i <= index ? 1 : 0})`,
                  transition: `transform 520ms ${EASE} ${i <= index ? i * 80 : 0}ms, background-color 400ms ${EASE}`,
                }}
              />
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="relative grid" aria-live="polite">
            {ORDER.map((key) => {
              const Icon = STATUS_STYLE[key].icon;
              const visible = key === shown;
              return (
                <span
                  key={key}
                  aria-hidden={!visible}
                  className={cn(
                    "col-start-1 row-start-1 inline-flex w-fit items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-[12.5px] font-semibold whitespace-nowrap motion-reduce:!transition-none",
                    STATUS_STYLE[key].pill,
                  )}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "none" : "translateX(-6px)",
                    transition: `opacity 300ms ${EASE}, transform 440ms ${EASE}`,
                  }}
                >
                  <Icon
                    className={cn(
                      "size-3.5",
                      key === "in-progress" && "support-ticket-card-spin",
                    )}
                    strokeWidth={2.4}
                  />
                  {statusLabels[key]}
                </span>
              );
            })}
          </span>
          <span className="truncate text-[12px] text-zinc-400">
            {updatedLabel}
          </span>
        </div>
      </div>
    );
  },
);

SupportTicketCard.displayName = "SupportTicketCard";
