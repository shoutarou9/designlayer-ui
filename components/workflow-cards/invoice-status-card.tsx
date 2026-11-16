"use client";

import * as React from "react";
import { Check, Clock3, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvoiceStatus = "open" | "paid" | "overdue";

export type InvoiceStatusLabels = Record<InvoiceStatus, string>;

export type InvoiceStatusCardProps = React.ComponentPropsWithoutRef<"div"> & {
  invoiceId?: string;
  /** Pre-formatted, e.g. "$1,280.00". */
  amount?: string;
  /** Pre-formatted date, e.g. "Due Nov 30, 2026". */
  date?: string;
  customer?: string;
  /** Fixed status. Leave unset to ease Open → Paid on a loop. */
  status?: InvoiceStatus;
  statuses?: Partial<InvoiceStatusLabels>;
  /** Replaces the date line once paid. Pass "" to keep the date. */
  paidDetail?: string;
  amountLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FILL_MS = 900;
/** Resting sliver while open, so the track still reads as a bar. */
const BAR_REST = 0.04;

function bezierAxis(t: number, c1: number, c2: number) {
  const u = 1 - t;
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t;
}

/** Matches the bar's CSS ease so the amount and the fill share one curve. */
function easeFill(x: number) {
  const clamped = Math.min(1, Math.max(0, x));
  let t = clamped;
  for (let i = 0; i < 6; i += 1) {
    const estimate = bezierAxis(t, 0.22, 0.36);
    const lo = Math.max(0, t - 0.001);
    const hi = Math.min(1, t + 0.001);
    const slope = (bezierAxis(hi, 0.22, 0.36) - bezierAxis(lo, 0.22, 0.36)) / (hi - lo || 0.001);
    if (Math.abs(slope) < 1e-6) break;
    t = Math.min(1, Math.max(0, t - (estimate - clamped) / slope));
  }
  return bezierAxis(t, 1, 1);
}

type ParsedAmount = {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
};

function parseAmount(amount: string): ParsedAmount | null {
  const match = amount.trim().match(/^(\D*?)(-?\d[\d,]*)(?:\.(\d+))?(\D*)$/);
  if (!match?.[2]) return null;
  const value = Number(`${match[2].replace(/,/g, "")}${match[3] ? `.${match[3]}` : ""}`);
  if (!Number.isFinite(value)) return null;
  return {
    prefix: match[1] ?? "",
    suffix: match[4] ?? "",
    value,
    decimals: match[3]?.length ?? 0,
  };
}

function formatAmount(parsed: ParsedAmount, ratio: number) {
  const body = (parsed.value * ratio).toLocaleString("en-US", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });
  return `${parsed.prefix}${body}${parsed.suffix}`;
}

function useFillProgress(filled: boolean, reduced: boolean) {
  const target = filled ? 1 : 0;
  const [progress, setProgress] = React.useState(0);
  const progressRef = React.useRef(0);

  React.useEffect(() => {
    if (reduced) {
      progressRef.current = target;
      setProgress(target);
      return;
    }
    const from = progressRef.current;
    if (Math.abs(from - target) < 0.001) {
      progressRef.current = target;
      setProgress(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FILL_MS);
      const next = from + (target - from) * easeFill(t);
      progressRef.current = next;
      setProgress(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  return reduced ? target : progress;
}

const DEFAULT_STATUSES: InvoiceStatusLabels = {
  open: "Open",
  paid: "Paid",
  overdue: "Overdue",
};

const TONE: Record<InvoiceStatus, { pill: string; dot: string }> = {
  open: {
    pill: "bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.25)]",
    dot: "bg-sky-500",
  },
  paid: {
    pill: "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]",
    dot: "bg-emerald-500",
  },
  overdue: {
    pill: "bg-rose-50 text-rose-700 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.28)]",
    dot: "bg-rose-500",
  },
};

const ICON: Record<InvoiceStatus, typeof Check> = {
  open: Clock3,
  paid: Check,
  overdue: TriangleAlert,
};

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

export const InvoiceStatusCard = React.forwardRef<
  HTMLDivElement,
  InvoiceStatusCardProps
>(
  (
    {
      invoiceId = "INV-2048",
      amount = "$1,280.00",
      date = "Due Nov 30, 2026",
      customer = "Northwind Studio",
      status,
      statuses,
      paidDetail = "Paid by card · just now",
      amountLabel = "Amount",
      className,
      ...props
    },
    ref,
  ) => {
    const labels = { ...DEFAULT_STATUSES, ...statuses };
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [demo, setDemo] = React.useState<InvoiceStatus>("open");
    const shown: InvoiceStatus = status ?? (reduced ? "paid" : demo);

    React.useEffect(() => {
      if (status !== undefined || reduced || !inView) return;
      const timer = window.setTimeout(
        () => setDemo((current) => (current === "open" ? "paid" : "open")),
        demo === "open" ? 1800 : 3600,
      );
      return () => window.clearTimeout(timer);
    }, [status, reduced, inView, demo]);

    const paid = shown === "paid";
    const fill = useFillProgress(shown !== "open", reduced);
    const parsedAmount = parseAmount(amount);
    const shownAmount = parsedAmount ? formatAmount(parsedAmount, fill) : amount;

    return (
      <div
        ref={localRef}
        data-tsuna-id="invoice-status-card"
        data-status={shown}
        className={cn(
          "relative w-[380px] max-w-full overflow-hidden rounded-[24px] bg-white text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(41,37,36,0.5),inset_0_0_0_1px_rgba(41,37,36,0.07)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-stone-900 text-[12px] font-semibold tracking-[0.02em] text-white"
            >
              {customer.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                {customer}
              </span>
              <span className="font-mono text-[12px] text-stone-500">
                {invoiceId}
              </span>
            </span>
          </div>
          <span className="relative grid shrink-0" aria-live="polite">
            {(Object.keys(TONE) as InvoiceStatus[]).map((key) => {
              const Icon = ICON[key];
              const visible = key === shown;
              return (
                <span
                  key={key}
                  aria-hidden={!visible}
                  className={cn(
                    "col-start-1 row-start-1 inline-flex items-center justify-self-end gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-[12px] font-semibold whitespace-nowrap motion-reduce:!transition-none",
                    TONE[key].pill,
                  )}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "none" : "translateY(6px) scale(0.92)",
                    transition: `opacity 320ms ${EASE}, transform 460ms ${EASE}`,
                  }}
                >
                  <Icon className="size-3.5" strokeWidth={2.4} />
                  {labels[key]}
                </span>
              );
            })}
          </span>
        </div>

        <div className="mt-5 px-5">
          <span className="text-[12px] font-medium tracking-[0.04em] text-stone-500 uppercase">
            {amountLabel}
          </span>
          <div
            aria-label={amount}
            className={cn(
              "mt-1 text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums transition-colors duration-500 motion-reduce:transition-none",
              paid
                ? "text-emerald-600"
                : shown === "overdue"
                  ? "text-rose-600"
                  : "text-zinc-900",
            )}
          >
            {shownAmount}
          </div>
        </div>

        <div
          aria-hidden
          className="mx-5 mt-5 border-t border-dashed border-stone-200"
        />

        <div className="px-5 pt-4 pb-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn(
                "h-full origin-left rounded-full",
                shown === "overdue" ? "bg-rose-500" : "bg-emerald-500",
              )}
              style={{
                transform: `scaleX(${BAR_REST + fill * (1 - BAR_REST)})`,
              }}
            />
          </div>
          <div className="relative mt-2.5 grid text-[12.5px]">
            <span
              className="col-start-1 row-start-1 truncate text-stone-500 motion-reduce:!transition-none"
              style={{
                opacity: paid && paidDetail ? 0 : 1,
                transition: `opacity 300ms ${EASE}`,
              }}
            >
              {date}
            </span>
            {paidDetail ? (
              <span
                className="col-start-1 row-start-1 truncate text-emerald-600 motion-reduce:!transition-none"
                style={{
                  opacity: paid ? 1 : 0,
                  transform: paid ? "none" : "translateY(4px)",
                  transition: `opacity 300ms ${EASE}, transform 420ms ${EASE}`,
                }}
              >
                {paidDetail}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

InvoiceStatusCard.displayName = "InvoiceStatusCard";
