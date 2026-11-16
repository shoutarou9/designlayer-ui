"use client";

import * as React from "react";
import { Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type SyncPulseItem = {
  id: string;
  label: string;
  /** Shown after "Last synced", e.g. "4m ago". */
  timestamp: string;
};

export const SYNC_PULSE_DEFAULT_ITEMS: readonly SyncPulseItem[] = [
  { id: "crm", label: "CRM contacts", timestamp: "4m ago" },
  { id: "warehouse", label: "Data warehouse", timestamp: "12m ago" },
  { id: "payments", label: "Payments", timestamp: "1h ago" },
  { id: "support", label: "Support inbox", timestamp: "3h ago" },
];

export type SyncPulseCardProps = React.ComponentPropsWithoutRef<"div"> & {
  items?: readonly SyncPulseItem[];
  /** Time each source spends syncing before the next one starts (ms). */
  intervalMs?: number;
  title?: string;
  syncingLabel?: string;
  lastSyncedLabel?: string;
  /** Replaces the timestamp of a source that just finished. */
  justNowLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SWATCHES = ["#7dd3fc", "#c4b5fd", "#86efac", "#fcd34d", "#f9a8d4"];

const CSS = `
@keyframes sync-pulse-card-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes sync-pulse-card-ring { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes sync-pulse-card-spin { to { transform: rotate(360deg); } }
.sync-pulse-card-sweep { animation: sync-pulse-card-sweep 1.4s cubic-bezier(0.45, 0, 0.25, 1) infinite; }
.sync-pulse-card-ring { animation: sync-pulse-card-ring 1.4s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.sync-pulse-card-spin { animation: sync-pulse-card-spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .sync-pulse-card-sweep, .sync-pulse-card-ring { display: none; }
  .sync-pulse-card-spin { animation: none; }
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
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export const SyncPulseCard = React.forwardRef<HTMLDivElement, SyncPulseCardProps>(
  (
    {
      items = SYNC_PULSE_DEFAULT_ITEMS,
      intervalMs = 2400,
      title = "Connected sources",
      syncingLabel = "Syncing",
      lastSyncedLabel = "Last synced",
      justNowLabel = "just now",
      className,
      ...props
    },
    ref,
  ) => {
    const rows = items.length > 0 ? items : SYNC_PULSE_DEFAULT_ITEMS;
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [tick, setTick] = React.useState(0);
    const running = inView && !reduced;
    const count = rows.length;

    React.useEffect(() => {
      if (!running) return;
      const timer = window.setInterval(() => setTick((t) => t + 1), Math.max(900, intervalMs));
      return () => window.clearInterval(timer);
    }, [running, intervalMs]);

    const active = tick % count;
    const justFinished = tick > 0 ? (tick - 1) % count : -1;
    const syncingIndex = running ? active : -1;
    const syncedCount = rows.length - (syncingIndex >= 0 ? 1 : 0);

    return (
      <div
        ref={localRef}
        data-tsuna-id="sync-pulse-card"
        className={cn(
          "w-[380px] max-w-full rounded-[26px] bg-[#101114] p-2 text-white",
          "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75),inset_0_0_0_1px_rgba(255,255,255,0.07)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-center justify-between px-3 pt-2.5 pb-3">
          <span className="text-[14px] font-semibold tracking-[-0.01em]">{title}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white/65">
            <RefreshCw
              aria-hidden
              className={cn("size-3", syncingIndex >= 0 && "sync-pulse-card-spin")}
              strokeWidth={2.4}
            />
            {syncedCount}/{rows.length}
          </span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {rows.map((row, i) => {
            const syncing = i === syncingIndex;
            const swatch = SWATCHES[i % SWATCHES.length];
            const stamp = i === justFinished ? justNowLabel : row.timestamp;
            return (
              <li
                key={row.id}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-[18px] px-3 py-3",
                  "transition-[background-color] duration-500 motion-reduce:transition-none",
                  syncing ? "bg-white/[0.07]" : "bg-transparent",
                )}
              >
                {syncing ? (
                  <span
                    aria-hidden
                    className="sync-pulse-card-sweep pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)]"
                  />
                ) : null}
                <span className="relative grid size-8 shrink-0 place-items-center">
                  {syncing ? (
                    <span
                      aria-hidden
                      className="sync-pulse-card-ring absolute inset-0 rounded-[10px]"
                      style={{ boxShadow: `0 0 0 1.5px ${swatch}` }}
                    />
                  ) : null}
                  <span
                    className="grid size-8 place-items-center rounded-[10px] text-[13px] font-bold text-[#101114]"
                    style={{ backgroundColor: swatch }}
                  >
                    {row.label.charAt(0).toUpperCase()}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-medium tracking-[-0.01em]">{row.label}</span>
                  <span className="relative mt-0.5 h-4 overflow-hidden text-[12px] text-white/45">
                    <span
                      className="absolute inset-0 truncate motion-reduce:!transition-none"
                      style={{
                        opacity: syncing ? 1 : 0,
                        transform: syncing ? "translateY(0)" : "translateY(-100%)",
                        transition: `opacity 320ms ${EASE}, transform 420ms ${EASE}`,
                      }}
                    >
                      {syncingLabel}…
                    </span>
                    <span
                      className="absolute inset-0 truncate motion-reduce:!transition-none"
                      style={{
                        opacity: syncing ? 0 : 1,
                        transform: syncing ? "translateY(100%)" : "translateY(0)",
                        transition: `opacity 320ms ${EASE}, transform 420ms ${EASE}`,
                      }}
                    >
                      {lastSyncedLabel} {stamp}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-500 motion-reduce:transition-none",
                    syncing ? "bg-white/[0.08] text-white/70" : "bg-emerald-400/15 text-emerald-300",
                  )}
                >
                  {syncing ? (
                    <RefreshCw className="sync-pulse-card-spin size-3" strokeWidth={2.6} />
                  ) : (
                    <Check className="size-3.5" strokeWidth={3} />
                  )}
                </span>
                <span className="sr-only">
                  {syncing ? syncingLabel : `${lastSyncedLabel} ${stamp}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

SyncPulseCard.displayName = "SyncPulseCard";
