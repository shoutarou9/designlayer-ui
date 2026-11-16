"use client";

import * as React from "react";
import { Check, CreditCard, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type BillingSeatsLabels = {
  title?: string;
  /** Plural unit, used in the breakdown ("8 seats × $12") and the change line ("+2 seats"). */
  seatUnit?: string;
  /** Singular unit for a change of one ("+1 seat"). */
  seatUnitOne?: string;
  /** Caption under the product name, after the price ("$12 per seat / month"). */
  perSeat?: string;
  /** Group label for the stepper. */
  seats?: string;
  /** Joins the label and the date ("Next invoice on Dec 1"). */
  on?: string;
  proratedToday?: string;
  tax?: string;
  nextInvoice?: string;
  chargedTo?: string;
  paymentMethod?: string;
  change?: string;
  cancel?: string;
  update?: string;
  updated?: string;
  decrease?: string;
  increase?: string;
};

export type BillingSeatsPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** Shown as a small pill on the right of the title, e.g. "Team · Monthly". */
  planName?: string;
  /** Product name under the logo. */
  productName?: string;
  /** Mark in the logo tile. Defaults to the DesignLayer mark. */
  logo?: React.ReactNode;
  /** Seats on the current invoice. The button stays disabled while `seats` equals it. */
  currentSeats?: number;
  seats?: number;
  defaultSeats?: number;
  onSeatsChange?: (seats: number) => void;
  minSeats?: number;
  maxSeats?: number;
  /** Price of one seat per month. */
  seatPrice?: number;
  /** Share of the billing period that is left, 0–1. Added seats are charged this share today. */
  prorationRatio?: number;
  /** Tax as a share of seats + proration, e.g. 0.1. */
  taxRate?: number;
  /** e.g. "Dec 1". */
  nextInvoiceDate?: string;
  currency?: string;
  /** e.g. "Visa". */
  cardBrand?: string;
  /** Last four digits of the card. */
  cardLast4?: string;
  onChangePaymentMethod?: () => void;
  onCancel?: () => void;
  onConfirm?: (seats: number) => void;
  labels?: BillingSeatsLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes billing-seats-panel-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes billing-seats-panel-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes billing-seats-panel-slide-in { from { opacity: 0; transform: translateY(var(--billing-seats-panel-from)); } to { opacity: 1; transform: none; } }
@keyframes billing-seats-panel-slide-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(var(--billing-seats-panel-to)); } }
.billing-seats-panel-fade-in { animation: billing-seats-panel-fade-in 120ms ${EASE} both; }
.billing-seats-panel-fade-out { animation: billing-seats-panel-fade-out 120ms ${EASE} both; }
.billing-seats-panel-slide-in { animation: billing-seats-panel-slide-in 160ms ${EASE} both; }
.billing-seats-panel-slide-out { animation: billing-seats-panel-slide-out 160ms ${EASE} both; }
.billing-seats-panel-delta { opacity: 0; transition: opacity 160ms ${EASE}; }
.billing-seats-panel-delta[data-open] { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .billing-seats-panel-fade-in, .billing-seats-panel-slide-in { animation: none; }
  .billing-seats-panel-fade-out, .billing-seats-panel-slide-out { animation: none; opacity: 0; }
  .billing-seats-panel-delta { transition: none; }
}
`;

const DEFAULT_LABELS: Required<BillingSeatsLabels> = {
  title: "Update seats",
  seatUnit: "seats",
  seatUnitOne: "seat",
  perSeat: "per seat / month",
  seats: "Seats",
  on: "on",
  proratedToday: "Prorated today",
  tax: "Tax",
  nextInvoice: "Next invoice",
  chargedTo: "Charged to",
  paymentMethod: "Payment method",
  change: "Change",
  cancel: "Cancel",
  update: "Update seats",
  updated: "Seats updated",
  decrease: "Remove a seat",
  increase: "Add a seat",
};

/** The DesignLayer mark, path for path the same as the site header logo (SiteLogoMark). */
function DesignLayerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="204 86 442 284" fill="none" strokeLinecap="round" strokeWidth={15} className={className} aria-hidden="true">
      <path
        stroke="#1F9BE0"
        d="M268 354C225 330 214 290 219 262C226 215 262 186 304 183C322 138 360 100 420 98C480 98 530 135 548 190"
      />
      <path
        stroke="#4CB8F0"
        d="M266 352C245 332 238 300 245 272C254 238 285 224 318 218C352 210 364 170 405 156C460 138 520 155 546 193"
      />
      <path
        stroke="#14B4CA"
        d="M270 354C266 315 285 275 330 268C380 262 390 250 430 230C475 206 520 198 560 200C600 200 628 225 630 258L632 290"
      />
      <path stroke="#94A3B8" d="M278 358L560 358C600 358 632 330 632 292" />
      <path stroke="#94A3B8" d="M302 352C302 322 325 305 360 302C420 298 470 285 500 252" />
    </svg>
  );
}

/** The old value fades out while the new one fades in, in the same grid cell. */
function Crossfade({ value, className }: { value: string; className?: string }) {
  const [pair, setPair] = React.useState({ prev: value, current: value });
  if (pair.current !== value) setPair({ prev: pair.current, current: value });
  const changed = pair.prev !== pair.current;
  return (
    <span className={cn("inline-grid tabular-nums", className)}>
      {changed ? (
        <span key={`out-${pair.prev}-${pair.current}`} aria-hidden className="billing-seats-panel-fade-out col-start-1 row-start-1">
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={cn("col-start-1 row-start-1", changed && "billing-seats-panel-fade-in")}>
        {pair.current}
      </span>
    </span>
  );
}

/** The seat count slides up when it grows and down when it shrinks. */
function SlideNumber({ value }: { value: number }) {
  const [pair, setPair] = React.useState({ prev: value, current: value });
  if (pair.current !== value) setPair({ prev: pair.current, current: value });
  const changed = pair.prev !== pair.current;
  const up = pair.current > pair.prev;
  const style = {
    "--billing-seats-panel-from": up ? "6px" : "-6px",
    "--billing-seats-panel-to": up ? "-6px" : "6px",
  } as React.CSSProperties;
  return (
    <span className="inline-grid overflow-hidden tabular-nums" style={style}>
      {changed ? (
        <span key={`out-${pair.prev}-${pair.current}`} aria-hidden className="billing-seats-panel-slide-out col-start-1 row-start-1">
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={cn("col-start-1 row-start-1", changed && "billing-seats-panel-slide-in")}>
        {pair.current}
      </span>
    </span>
  );
}

export const BillingSeatsPanel = React.forwardRef<HTMLDivElement, BillingSeatsPanelProps>(
  (
    {
      planName = "Team · Monthly",
      productName = "DesignLayer Team",
      logo,
      currentSeats = 8,
      seats,
      defaultSeats,
      onSeatsChange,
      minSeats = 1,
      maxSeats = 50,
      seatPrice = 12,
      prorationRatio = 0.6,
      taxRate = 0,
      nextInvoiceDate = "Dec 1",
      currency = "$",
      cardBrand = "Visa",
      cardLast4 = "4242",
      onChangePaymentMethod,
      onCancel,
      onConfirm,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const [ownSeats, setOwnSeats] = React.useState(defaultSeats ?? currentSeats);
    const [committed, setCommitted] = React.useState(currentSeats);
    const [confirmed, setConfirmed] = React.useState(false);
    const count = Math.min(maxSeats, Math.max(minSeats, seats ?? ownSeats));
    const delta = count - committed;
    const changed = delta !== 0;
    const seatsTotal = count * seatPrice;
    const prorated = Math.max(0, delta) * seatPrice * prorationRatio;
    const tax = (seatsTotal + prorated) * taxRate;
    const total = seatsTotal + prorated + tax;
    const timer = React.useRef(0);
    // Keeps the last delta on screen while the pill fades out.
    const [shownDelta, setShownDelta] = React.useState(delta);
    if (changed && shownDelta !== delta) setShownDelta(delta);

    React.useEffect(() => () => window.clearTimeout(timer.current), []);

    const money = (value: number) =>
      `${currency}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const price = money(seatPrice).replace(/\.00$/, "");

    const setCount = (next: number) => {
      const bounded = Math.min(maxSeats, Math.max(minSeats, next));
      if (bounded === count) return;
      setConfirmed(false);
      if (seats === undefined) setOwnSeats(bounded);
      onSeatsChange?.(bounded);
    };

    const cancel = () => {
      setCount(committed);
      onCancel?.();
    };

    const confirm = () => {
      if (!changed) return;
      setCommitted(count);
      setConfirmed(true);
      onConfirm?.(count);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setConfirmed(false), 1800);
    };

    const stepClass = cn(
      "grid size-6 shrink-0 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-zinc-500",
      "transition-colors [transition-duration:160ms] hover:bg-zinc-100 hover:text-zinc-950 motion-reduce:transition-none",
      "disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent",
      FOCUS,
    );

    const deltaSeats = Math.abs(shownDelta);
    const deltaText = `${shownDelta < 0 ? "−" : "+"}${deltaSeats} ${deltaSeats === 1 ? text.seatUnitOne : text.seatUnit}`;

    const lines = [
      { key: "seats", label: `${count} ${count === 1 ? text.seatUnitOne : text.seatUnit} × ${price}`, value: seatsTotal },
      { key: "prorated", label: text.proratedToday, value: prorated },
      { key: "tax", label: text.tax, value: tax },
    ];

    return (
      <div
        ref={ref}
        data-tsuna-id="billing-seats-panel"
        data-changed={changed ? "" : undefined}
        data-confirmed={confirmed ? "" : undefined}
        className={cn(
          "w-[440px] max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>

        {/* Top zone: the seat count is the focus. */}
        <div className="px-5 pt-5 pb-4">
          <header className="flex items-center justify-between gap-3">
            <h2 className="m-0 min-w-0 truncate text-[15px] font-medium text-zinc-950">{text.title}</h2>
            <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-zinc-100 px-2 text-[12px] font-medium text-zinc-600">
              {planName}
            </span>
          </header>

          <div className="mt-4 flex flex-col items-center text-center">
            <span
              aria-hidden
              className="grid size-14 place-items-center rounded-[14px] bg-zinc-100 shadow-[0_0_0_1px_#e4e4e7]"
            >
              {logo ?? <DesignLayerMark className="h-auto w-7" />}
            </span>
            <p className="m-0 mt-2 text-[15px] font-medium text-zinc-950">{productName}</p>
            <p className="m-0 mt-1 text-[13px] text-zinc-500 tabular-nums">
              {price} {text.perSeat}
            </p>
          </div>
        </div>

        {/* Bottom zone: what it costs, then the actions. */}
        <div className="border-t border-zinc-200 bg-zinc-50 p-5">
          <dl className="m-0">
            {lines.map((line) => (
              <div key={line.key} className="flex h-[26px] items-center justify-between gap-4 text-[13px]">
                <dt className="min-w-0 truncate text-zinc-500">
                  {line.key === "seats" ? <Crossfade value={line.label} /> : line.label}
                </dt>
                <dd className="m-0 shrink-0 text-right text-zinc-900">
                  <Crossfade value={money(line.value)} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <p className="m-0 min-w-0 truncate text-[13px]">
              <span className="font-medium text-zinc-900">{text.nextInvoice}</span>{" "}
              <span className="text-zinc-500 tabular-nums">
                {text.on} {nextInvoiceDate}
              </span>
            </p>
            <p className="m-0 shrink-0 text-right text-[18px] leading-none font-semibold tracking-[-0.01em] text-zinc-950">
              <Crossfade value={money(total)} />
            </p>
          </div>
          {/* wrap-reverse: when the two don't fit on one line, the payment line drops below the stepper. */}
          <div className="mt-2 flex flex-wrap-reverse items-center justify-between gap-x-3 gap-y-1.5">
            <p className="m-0 flex min-w-0 items-center gap-1.5 text-[12px] text-zinc-500">
              <CreditCard aria-hidden size={14} strokeWidth={1.75} className="shrink-0 text-zinc-400" />
              <span className="min-w-0 truncate tabular-nums">
                {text.chargedTo} {cardBrand} •••• {cardLast4}
              </span>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={onChangePaymentMethod}
                aria-label={`${text.change} ${text.paymentMethod.toLowerCase()}`}
                className={cn(
                  "shrink-0 cursor-pointer rounded-[4px] border-0 bg-transparent p-0 text-[12px] text-zinc-500 underline-offset-2",
                  "hover:underline",
                  FOCUS,
                )}
              >
                {text.change}
              </button>
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden={!changed || undefined}
                data-open={changed ? "" : undefined}
                className="billing-seats-panel-delta text-[11px] text-zinc-500 tabular-nums"
              >
                {deltaText}
              </span>
              <div role="group" aria-label={text.seats} className="-mr-1 flex items-center">
                <button
                  type="button"
                  aria-label={text.decrease}
                  disabled={count <= minSeats}
                  onClick={() => setCount(count - 1)}
                  className={stepClass}
                >
                  <Minus aria-hidden size={14} strokeWidth={1.75} />
                </button>
                <output aria-live="polite" className="flex min-w-[56px] justify-center gap-1 text-[12px] font-medium text-zinc-900">
                  <SlideNumber value={count} />
                  <span>{count === 1 ? text.seatUnitOne : text.seatUnit}</span>
                </output>
                <button
                  type="button"
                  aria-label={text.increase}
                  disabled={count >= maxSeats}
                  onClick={() => setCount(count + 1)}
                  className={stepClass}
                >
                  <Plus aria-hidden size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancel}
              className={cn(
                "inline-flex h-[38px] w-full cursor-pointer items-center justify-center rounded-[10px] border border-zinc-200 bg-white px-4 text-[14px] font-medium whitespace-nowrap text-zinc-700",
                "transition-colors [transition-duration:160ms] hover:border-zinc-300 hover:text-zinc-950 motion-reduce:transition-none",
                FOCUS,
              )}
            >
              {text.cancel}
            </button>
            <button
              type="button"
              disabled={!changed && !confirmed}
              onClick={confirm}
              className={cn(
                "inline-flex h-[38px] w-full items-center justify-center rounded-[10px] border-0 bg-zinc-950 px-4 text-[14px] font-medium whitespace-nowrap text-white",
                "transition-[background-color,opacity] [transition-duration:180ms] motion-reduce:transition-none",
                "cursor-pointer hover:bg-zinc-800 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-950",
                FOCUS,
              )}
            >
              <span
                aria-hidden
                className="grid motion-reduce:!transition-none"
                style={{
                  gridTemplateColumns: confirmed ? "1fr" : "0fr",
                  opacity: confirmed ? 1 : 0,
                  transition: `grid-template-columns 420ms ${EASE}, opacity 260ms ${EASE}`,
                }}
              >
                <span className="min-w-0 overflow-hidden">
                  <Check
                    strokeWidth={2.6}
                    className="mr-1.5 size-4 motion-reduce:!transition-none"
                    style={{
                      transform: confirmed ? "scale(1)" : "scale(0.3)",
                      transition: `transform 420ms ${SPRING}`,
                    }}
                  />
                </span>
              </span>
              <span>{confirmed ? text.updated : text.update}</span>
            </button>
          </div>
        </div>

        <span aria-live="polite" className="sr-only">
          {confirmed ? text.updated : ""}
        </span>
      </div>
    );
  },
);

BillingSeatsPanel.displayName = "BillingSeatsPanel";
