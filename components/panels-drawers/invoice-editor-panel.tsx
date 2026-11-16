"use client";

import * as React from "react";
import { Calendar, ChevronDown, Eye, Plus, Send, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type InvoiceEditorLine = {
  id: string;
  description: string;
  quantity: number;
  /** Price of one unit. */
  rate: number;
};

export type InvoiceEditorValue = {
  billTo: string;
  number: string;
  /** YYYY-MM-DD. */
  dueDate: string;
  lines: InvoiceEditorLine[];
  /** 0–1. */
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
};

export type InvoiceEditorLabels = {
  title?: string;
  billTo?: string;
  number?: string;
  dueDate?: string;
  due?: string;
  description?: string;
  quantity?: string;
  rate?: string;
  amount?: string;
  addLine?: string;
  removeLine?: string;
  descriptionPlaceholder?: string;
  tax?: string;
  subtotal?: string;
  total?: string;
  send?: string;
  preview?: string;
  saved?: string;
  draft?: string;
  line?: string;
};

export type InvoiceEditorPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {
  defaultBillTo?: string;
  defaultNumber?: string;
  defaultDueDate?: string;
  defaultLines?: readonly InvoiceEditorLine[];
  /** Offered in the tax select, as shares 0–1. */
  taxRates?: readonly number[];
  defaultTaxRate?: number;
  currency?: string;
  onChange?: (value: InvoiceEditorValue) => void;
  onSend?: (value: InvoiceEditorValue) => void;
  labels?: InvoiceEditorLabels;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-0";
const FIELD = cn(
  "w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 text-[14px] text-zinc-900 outline-none",
  "placeholder:text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50 focus:border-zinc-200 focus:bg-zinc-50",
  FOCUS,
);
const COLS = "grid grid-cols-[minmax(0,1fr)_72px_104px_112px_28px] gap-x-2";

const CLIENTS = ["Harbor Labs KK", "Northwind Studio", "Aiko Mori"] as const;

const DEFAULT_LINES: readonly InvoiceEditorLine[] = [
  { id: "l1", description: "Brand refresh, discovery", quantity: 1, rate: 2400 },
  { id: "l2", description: "Design system audit (hours)", quantity: 12, rate: 150 },
  { id: "l3", description: "Illustration set", quantity: 3, rate: 320 },
];

const DEFAULT_LABELS: Required<InvoiceEditorLabels> = {
  title: "Invoice",
  billTo: "Bill to",
  number: "Invoice #",
  dueDate: "Due date",
  due: "Due",
  description: "Description",
  quantity: "Qty",
  rate: "Rate",
  amount: "Amount",
  addLine: "Add line",
  removeLine: "Remove line",
  descriptionPlaceholder: "Item or service",
  tax: "Tax",
  subtotal: "Subtotal",
  total: "Total",
  send: "Send invoice",
  preview: "Preview",
  saved: "Last saved just now",
  draft: "Draft",
  line: "Line",
};

function percent(rate: number) {
  const value = Math.round(rate * 1000) / 10;
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatDue(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(value: number, currency: string) {
  return `${currency}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Counts from the value on screen to `target`. */
function useCountTo(target: number, reduced: boolean) {
  const [shown, setShown] = React.useState(target);
  const live = React.useRef(target);
  React.useEffect(() => {
    if (reduced || live.current === target) {
      live.current = target;
      setShown(target);
      return;
    }
    const from = live.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 200);
      const value = from + (target - from) * (1 - Math.pow(1 - t, 3));
      live.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return shown;
}

function Money({ value, currency, reduced, className }: { value: number; currency: string; reduced: boolean; className?: string }) {
  const shown = useCountTo(value, reduced);
  return <span className={cn("tabular-nums", className)}>{money(shown, currency)}</span>;
}

type Row = { id: string; description: string; quantity: string; rate: string };

const toNumber = (raw: string) => {
  const value = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

function RateField({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  const shown = focused
    ? value
    : toNumber(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      aria-label={label}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onChange(toNumber(value).toFixed(2));
      }}
      onChange={(event) => onChange(event.target.value.replace(/,/g, ""))}
      className={cn(FIELD, "h-8 px-2 text-right tabular-nums")}
    />
  );
}

export const InvoiceEditorPanel = React.forwardRef<HTMLDivElement, InvoiceEditorPanelProps>(
  (
    {
      defaultBillTo = "Harbor Labs KK",
      defaultNumber = "INV-0087",
      defaultDueDate = "2026-12-01",
      defaultLines = DEFAULT_LINES,
      taxRates = [0, 0.08, 0.1, 0.2],
      defaultTaxRate = 0.1,
      currency = "$",
      onChange,
      onSend,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const uid = React.useId();
    const [billTo, setBillTo] = React.useState(defaultBillTo);
    const [number, setNumber] = React.useState(defaultNumber);
    const [editingNumber, setEditingNumber] = React.useState(false);
    const [clientsOpen, setClientsOpen] = React.useState(false);
    const [dueDate, setDueDate] = React.useState(defaultDueDate);
    const [taxRate, setTaxRate] = React.useState(defaultTaxRate);
    const [rows, setRows] = React.useState<Row[]>(() =>
      defaultLines.map((line) => ({
        id: line.id,
        description: line.description,
        quantity: String(line.quantity),
        rate: line.rate.toFixed(2),
      })),
    );
    const numberRef = React.useRef<HTMLInputElement>(null);
    const clientRoot = React.useRef<HTMLDivElement>(null);
    const inputs = React.useRef(new Map<string, HTMLInputElement>());
    const focusId = React.useRef<string | null>(null);
    const counter = React.useRef(0);
    const addButton = React.useRef<HTMLButtonElement>(null);
    const clients = (CLIENTS as readonly string[]).includes(defaultBillTo) ? [...CLIENTS] : [defaultBillTo, ...CLIENTS];

    const subtotal = rows.reduce((sum, row) => sum + toNumber(row.quantity) * toNumber(row.rate), 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + tax;

    const snapshot = (): InvoiceEditorValue => ({
      billTo,
      number,
      dueDate,
      lines: rows.map((row) => ({
        id: row.id,
        description: row.description,
        quantity: toNumber(row.quantity),
        rate: toNumber(row.rate),
      })),
      taxRate,
      subtotal,
      tax,
      total,
    });
    const notify = React.useRef(onChange);
    notify.current = onChange;
    const current = React.useRef(snapshot);
    current.current = snapshot;
    const mounted = React.useRef(false);

    React.useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      notify.current?.(current.current());
    }, [billTo, number, dueDate, taxRate, rows]);

    React.useEffect(() => {
      const id = focusId.current;
      if (!id) return;
      focusId.current = null;
      inputs.current.get(id)?.focus({ preventScroll: true });
    }, [rows]);

    React.useEffect(() => {
      if (editingNumber) numberRef.current?.select();
    }, [editingNumber]);

    React.useEffect(() => {
      if (!clientsOpen) return;
      const close = (event: MouseEvent) => {
        if (!clientRoot.current?.contains(event.target as Node)) setClientsOpen(false);
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [clientsOpen]);

    const patch = (id: string, change: Partial<Row>) =>
      setRows((list) => list.map((row) => (row.id === id ? { ...row, ...change } : row)));

    const addLine = () => {
      counter.current += 1;
      const id = `new-${counter.current}`;
      focusId.current = id;
      setRows((list) => [...list, { id, description: "", quantity: "1", rate: "0.00" }]);
    };

    const removeLine = (id: string) => {
      setRows((list) => list.filter((row) => row.id !== id));
      addButton.current?.focus({ preventScroll: true });
    };

    const enter = reduced ? { duration: 0 } : { duration: 0.18, ease: EASE };

    return (
      <div
        ref={ref}
        data-tsuna-id="invoice-editor-panel"
        className={cn(
          "flex w-[720px] max-w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="m-0 min-w-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">
              {editingNumber ? (
                <span className="inline-flex items-baseline gap-1">
                  <span>{text.title}</span>
                  <input
                    ref={numberRef}
                    aria-label={text.number}
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    onBlur={() => setEditingNumber(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
                    }}
                    style={{ width: `${Math.max(number.length, 4)}ch` }}
                    className={cn(FIELD, "h-7 px-1.5 font-semibold tabular-nums tracking-[-0.01em]")}
                  />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNumber(true)}
                  className={cn(
                    "-ml-1 cursor-text rounded-md border-0 bg-transparent px-1 py-0.5 text-left font-semibold tracking-[-0.01em] text-zinc-950 tabular-nums hover:bg-zinc-50",
                    FOCUS,
                  )}
                >
                  {text.title} {number}
                </button>
              )}
            </h2>
            <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-2 text-[12px] font-medium text-zinc-600">
              <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />
              {text.draft}
            </span>
          </div>
          <label className="relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-transparent px-2 text-[13px] text-zinc-900 hover:bg-zinc-100 focus-within:bg-zinc-100 focus-within:ring-2 focus-within:ring-zinc-900/35">
            <Calendar aria-hidden className="size-3.5" />
            <span aria-hidden className="whitespace-nowrap">
              {text.due} {formatDue(dueDate)}
            </span>
            <input
              type="date"
              value={dueDate}
              aria-label={`${text.due} ${formatDue(dueDate)}`}
              onChange={(event) => setDueDate(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[12px] text-zinc-500">{text.billTo}</span>
          <div ref={clientRoot} className="relative flex min-w-0 items-center gap-1">
          <span className="inline-grid min-w-0 items-center">
            <span aria-hidden className="invisible col-start-1 row-start-1 px-2 text-[14px] font-medium whitespace-pre">
              {billTo || text.billTo}
            </span>
            <input
              type="text"
              value={billTo}
              aria-label={text.billTo}
              onChange={(event) => setBillTo(event.target.value)}
              className={cn(FIELD, "col-start-1 row-start-1 h-8 font-medium")}
            />
          </span>
          <button
            type="button"
            aria-expanded={clientsOpen}
            aria-controls={`${uid}-clients`}
            aria-label={text.billTo}
            onClick={() => setClientsOpen((open) => !open)}
            className={cn("grid size-6 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900", FOCUS)}
          >
            <ChevronDown aria-hidden className="size-3" />
          </button>
          {clientsOpen ? (
            <ul
              id={`${uid}-clients`}
              role="listbox"
              aria-label={text.billTo}
              className="absolute top-full left-0 z-10 mt-1 min-w-48 rounded-lg border border-zinc-200 bg-white py-1"
            >
              {clients.map((name) => (
                <li key={name} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={name === billTo}
                    onClick={() => {
                      setBillTo(name);
                      setClientsOpen(false);
                    }}
                    className="block w-full cursor-pointer border-0 bg-transparent px-3 py-1.5 text-left text-[14px] text-zinc-900 hover:bg-zinc-50"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className={cn(COLS, "border-b border-zinc-100 pb-2 text-[12px] text-zinc-500")}>
              <span>{text.description}</span>
              <span className="pr-2 text-right">{text.quantity}</span>
              <span className="pr-2 text-right">{text.rate}</span>
              <span className="text-right">{text.amount}</span>
              <span className="sr-only">{text.removeLine}</span>
            </div>

            <AnimatePresence initial={false}>
              {rows.map((row, index) => {
                const label = `${text.line} ${index + 1}`;
                return (
                  <motion.div
                    key={row.id}
                    layout={reduced ? false : "position"}
                    initial={reduced ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={enter}
                    className="overflow-hidden"
                  >
                    <div className={cn(COLS, "group h-11 items-center border-b border-zinc-100")}>
                    <input
                      ref={(node) => {
                        if (node) inputs.current.set(row.id, node);
                        else inputs.current.delete(row.id);
                      }}
                      type="text"
                      value={row.description}
                      aria-label={`${label}: ${text.description}`}
                      placeholder={text.descriptionPlaceholder}
                      onChange={(event) => patch(row.id, { description: event.target.value })}
                      className={cn(FIELD, "-mx-2 h-8")}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.quantity}
                      aria-label={`${label}: ${text.quantity}`}
                      onChange={(event) => patch(row.id, { quantity: event.target.value.replace(/[^\d.]/g, "") })}
                      className={cn(FIELD, "h-8 text-right tabular-nums")}
                    />
                    <RateField
                      value={row.rate}
                      label={`${label}: ${text.rate}`}
                      onChange={(rate) => patch(row.id, { rate })}
                    />
                    <span className="text-right text-[14px] font-medium text-zinc-900">
                      <Money value={toNumber(row.quantity) * toNumber(row.rate)} currency={currency} reduced={reduced} />
                    </span>
                    <button
                      type="button"
                      aria-label={`${text.removeLine}: ${row.description || label}`}
                      onClick={() => removeLine(row.id)}
                      className={cn(
                        "grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400",
                        "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-zinc-900",
                        "motion-reduce:transition-none",
                        FOCUS,
                      )}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className={cn(COLS, "pt-2")}>
              <div>
                <button
                  ref={addButton}
                  type="button"
                  onClick={addLine}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-zinc-500 hover:text-zinc-900",
                    FOCUS,
                  )}
                >
                  <Plus aria-hidden className="size-3.5" />
                  {text.addLine}
                </button>
              </div>
              <div className="col-span-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-zinc-500">{text.subtotal}</span>
                  <span className="text-zinc-900">
                    <Money value={subtotal} currency={currency} reduced={reduced} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="relative inline-flex items-center text-zinc-500">
                    <select
                      id={`${uid}-tax`}
                      aria-label={text.tax}
                      value={String(taxRate)}
                      onChange={(event) => setTaxRate(Number(event.target.value))}
                      className={cn(
                        "cursor-pointer appearance-none border-0 bg-transparent pr-4 text-[13px] text-zinc-500 outline-none",
                        FOCUS,
                      )}
                    >
                      {(taxRates.includes(taxRate) ? taxRates : [taxRate, ...taxRates]).map((rate) => (
                        <option key={rate} value={String(rate)}>
                          {text.tax} {percent(rate)}%
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden className="pointer-events-none absolute right-0 size-3 text-zinc-400" />
                  </span>
                  <span className="text-zinc-900">
                    <Money value={tax} currency={currency} reduced={reduced} />
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                  <span className="text-[14px] font-semibold text-zinc-950">{text.total}</span>
                  <span className="text-[20px] font-semibold text-zinc-950" aria-live="polite">
                    <Money value={total} currency={currency} reduced={reduced} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[12px] text-zinc-500">{text.saved}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 text-[13px] font-medium text-zinc-900",
                "hover:bg-zinc-100",
                FOCUS,
              )}
            >
              <Eye aria-hidden className="size-4" />
              {text.preview}
            </button>
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={() => onSend?.(snapshot())}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-zinc-950 px-3 text-[13px] font-medium text-white",
                "hover:bg-zinc-800 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-950",
                FOCUS,
              )}
            >
              <Send aria-hidden className="size-4" />
              {text.send}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceEditorPanel.displayName = "InvoiceEditorPanel";
