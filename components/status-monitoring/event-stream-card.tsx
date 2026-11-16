"use client";

import * as React from "react";
import { Webhook } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventStreamTone = "success" | "info" | "warning" | "error";

export type EventStreamEvent = {
  id: string;
  /** Event name, e.g. "invoice.paid". */
  name: string;
  /** Time shown for the starting rows, e.g. "12s ago". */
  time: string;
  tone?: EventStreamTone;
  /** HTTP status shown on the right. Defaults by tone. */
  status?: number;
};

export const EVENT_STREAM_DEFAULT_EVENTS: readonly EventStreamEvent[] = [
  { id: "e1", name: "invoice.paid", time: "4s ago", tone: "success" },
  { id: "e2", name: "customer.created", time: "11s ago", tone: "info" },
  { id: "e3", name: "subscription.updated", time: "26s ago", tone: "success" },
  { id: "e4", name: "charge.failed", time: "41s ago", tone: "error" },
  { id: "e5", name: "checkout.completed", time: "1m ago", tone: "success" },
  { id: "e6", name: "payout.delayed", time: "2m ago", tone: "warning" },
];

export type EventStreamCardProps = React.ComponentPropsWithoutRef<"div"> & {
  events?: readonly EventStreamEvent[];
  /** Time between new rows (ms). */
  intervalMs?: number;
  title?: string;
  /** Endpoint shown in the header. */
  endpoint?: string;
  /** Time label for a row that just arrived. */
  nowLabel?: string;
  /** Rows kept on screen. */
  visibleRows?: number;
};

const TONE_DOT: Record<EventStreamTone, string> = {
  success: "bg-emerald-400",
  info: "bg-sky-400",
  warning: "bg-amber-300",
  error: "bg-rose-500",
};

const TONE_STATUS: Record<EventStreamTone, number> = {
  success: 200,
  info: 202,
  warning: 429,
  error: 500,
};

const ROW_H = 50;

const CSS = `
@keyframes event-stream-card-in {
  from { height: 0; opacity: 0; transform: translateY(-10px); }
  to { height: ${ROW_H}px; opacity: 1; transform: translateY(0); }
}
@keyframes event-stream-card-flash { from { background-color: rgba(255,255,255,0.07); } to { background-color: transparent; } }
@keyframes event-stream-card-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.event-stream-card-in { animation: event-stream-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both, event-stream-card-flash 1.6s ease-out both; }
.event-stream-card-live { animation: event-stream-card-live 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .event-stream-card-in, .event-stream-card-live { animation: none; }
}
`;

type Row = { key: string; event: EventStreamEvent; arrivedAt: number | null };

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

export const EventStreamCard = React.forwardRef<HTMLDivElement, EventStreamCardProps>(
  (
    {
      events = EVENT_STREAM_DEFAULT_EVENTS,
      intervalMs = 2200,
      title = "Webhook events",
      endpoint = "POST /api/webhooks",
      nowLabel = "now",
      visibleRows = 4,
      className,
      ...props
    },
    ref,
  ) => {
    const source = events.length > 0 ? events : EVENT_STREAM_DEFAULT_EVENTS;
    const limit = Math.max(2, visibleRows);
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const running = inView && !reduced;

    const [state, setState] = React.useState(() => ({
      rows: source.slice(0, limit).map<Row>((event) => ({ key: event.id, event, arrivedAt: null })),
      cursor: limit % source.length,
      tick: 0,
    }));

    React.useEffect(() => {
      if (!running) return;
      const timer = window.setInterval(() => {
        setState((prev) => {
          const event = source[prev.cursor] ?? source[0];
          if (!event) return prev;
          const tick = prev.tick + 1;
          return {
            // One extra row stays mounted below the fold so it slides out instead of vanishing.
            rows: [{ key: `${event.id}-${tick}`, event, arrivedAt: tick }, ...prev.rows].slice(0, limit + 1),
            cursor: (prev.cursor + 1) % source.length,
            tick,
          };
        });
      }, Math.max(800, intervalMs));
      return () => window.clearInterval(timer);
    }, [running, intervalMs, source, limit]);

    const ageLabel = (row: Row) => {
      if (row.arrivedAt === null) return row.event.time;
      const seconds = Math.round(((state.tick - row.arrivedAt) * intervalMs) / 1000);
      return seconds <= 0 ? nowLabel : `${seconds}s ago`;
    };

    return (
      <div
        ref={localRef}
        data-tsuna-id="event-stream-card"
        className={cn(
          "w-[400px] max-w-full rounded-[26px] bg-[#0c0c0e] p-2 text-white",
          "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.07)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-center justify-between gap-3 px-3 pt-2.5 pb-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white/[0.07]">
              <Webhook aria-hidden className="size-4 text-white/80" strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">{title}</span>
              <span className="truncate font-mono text-[11px] text-white/40">{endpoint}</span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11.5px] font-medium text-emerald-300">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full bg-emerald-400", running && "event-stream-card-live")}
            />
            Live
          </span>
        </div>
        <ul
          aria-label={title}
          className="relative m-0 list-none overflow-hidden rounded-[18px] bg-white/[0.03] p-0"
          style={{
            height: ROW_H * limit,
            maskImage: "linear-gradient(180deg, black 70%, transparent)",
            WebkitMaskImage: "linear-gradient(180deg, black 70%, transparent)",
          }}
        >
          {state.rows.map((row) => {
            const tone = row.event.tone ?? "success";
            const status = row.event.status ?? TONE_STATUS[tone];
            return (
              <li
                key={row.key}
                className={cn(
                  "flex items-center gap-3 overflow-hidden px-3.5",
                  row.arrivedAt !== null && "event-stream-card-in",
                )}
                style={{ height: ROW_H }}
              >
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", TONE_DOT[tone])} />
                <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-white/90">
                  {row.event.name}
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-white/40">{ageLabel(row)}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
                    status < 300
                      ? "bg-emerald-400/10 text-emerald-300"
                      : status < 500
                        ? "bg-amber-300/10 text-amber-200"
                        : "bg-rose-500/15 text-rose-300",
                  )}
                >
                  {status}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

EventStreamCard.displayName = "EventStreamCard";
