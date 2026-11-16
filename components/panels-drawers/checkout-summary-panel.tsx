"use client";

import * as React from "react";
import { Lock, Minus, Plus, Tag, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CheckoutLineItem = {
  id: string;
  /** e.g. "Linen tote · Sand". Text after " · " is the variant. */
  name: string;
  /** Unit price. */
  price: number;
  quantity: number;
  /** Tile color. Initials sit on top. */
  swatch?: string;
};

export type CheckoutPromo = {
  /** Compared case-insensitively. */
  code: string;
  /** Share of the subtotal taken off, 0–1. */
  percentOff: number;
};

export type CheckoutSummaryLabels = {
  promoLabel?: string;
  promoPlaceholder?: string;
  apply?: string;
  remove?: string;
  invalid?: string;
  subtotal?: string;
  shipping?: string;
  discount?: string;
  total?: string;
  pay?: string;
  empty?: string;
  decrease?: string;
  increase?: string;
  removeItem?: string;
  secure?: string;
  item?: string;
  items?: string;
  each?: string;
  qty?: string;
};

export type CheckoutSummaryPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  items?: readonly CheckoutLineItem[];
  /** Flat shipping fee. */
  shipping?: number;
  /** Codes the promo field accepts. */
  promos?: readonly CheckoutPromo[];
  defaultPromoInput?: string;
  currency?: string;
  onItemsChange?: (items: CheckoutLineItem[]) => void;
  onPay?: (total: number) => void;
  labels?: CheckoutSummaryLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_CURVE = [0.22, 1, 0.36, 1] as const;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const INSET_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/35";

const CSS = `
@keyframes checkout-summary-panel-shake-a { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
@keyframes checkout-summary-panel-shake-b { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
.checkout-summary-panel-shake-a { animation: checkout-summary-panel-shake-a 360ms ${EASE}; }
.checkout-summary-panel-shake-b { animation: checkout-summary-panel-shake-b 360ms ${EASE}; }
@media (prefers-reduced-motion: reduce) {
  .checkout-summary-panel-shake-a, .checkout-summary-panel-shake-b { animation: none; }
}
`;

const DEFAULT_ITEMS: readonly CheckoutLineItem[] = [
  { id: "c1", name: "Linen tote · Sand", price: 48, quantity: 1, swatch: "#e7e0d4" },
  { id: "c2", name: "Ceramic mug · Oat", price: 24, quantity: 2, swatch: "#e4e4e7" },
  { id: "c3", name: "Notebook set · Graphite", price: 18, quantity: 1, swatch: "#d4d4d8" },
];

const DEFAULT_PROMOS: readonly CheckoutPromo[] = [{ code: "WELCOME10", percentOff: 0.1 }];

const DEFAULT_LABELS: Required<CheckoutSummaryLabels> = {
  promoLabel: "Promo code",
  promoPlaceholder: "Promo code",
  apply: "Apply",
  remove: "Remove",
  invalid: "That code isn’t valid.",
  subtotal: "Subtotal",
  shipping: "Shipping",
  discount: "Discount",
  total: "Total",
  pay: "Pay",
  empty: "Your cart is empty.",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  removeItem: "Remove",
  secure: "Payments are encrypted.",
  item: "item",
  items: "items",
  each: "each",
  qty: "Qty",
};

function initials(name: string) {
  return name
    .split(/[\s·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function splitName(name: string) {
  const cut = name.indexOf(" · ");
  if (cut === -1) return { product: name, variant: "" };
  return { product: name.slice(0, cut), variant: name.slice(cut + 3) };
}

function moneyText(value: number, currency: string, negative = false) {
  const amount = value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${negative ? "−" : ""}${currency}${amount}`;
}

const ROLL = { duration: 0.2, ease: EASE_CURVE };
const COLLAPSE = { duration: 0.18, ease: EASE_CURVE };

function RollingMoney({
  value,
  currency,
  negative,
  reduced,
  className,
}: {
  value: number;
  currency: string;
  negative?: boolean;
  reduced: boolean;
  className?: string;
}) {
  const text = moneyText(value, currency, negative);
  const prev = React.useRef(value);
  const dir = value < prev.current ? -1 : 1;
  prev.current = value;
  const transition = reduced ? { duration: 0 } : ROLL;

  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={text}
          aria-hidden
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={reduced ? false : { opacity: 0, y: dir > 0 ? "100%" : "-100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: dir > 0 ? "-100%" : "100%" }}
          transition={transition}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const CheckoutSummaryPanel = React.forwardRef<HTMLDivElement, CheckoutSummaryPanelProps>(
  (
    {
      title = "Order summary",
      items = DEFAULT_ITEMS,
      shipping = 6,
      promos = DEFAULT_PROMOS,
      defaultPromoInput = "WELCOME10",
      currency = "$",
      onItemsChange,
      onPay,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const uid = React.useId();
    const [lines, setLines] = React.useState<CheckoutLineItem[]>(() => items.map((item) => ({ ...item })));
    const [code, setCode] = React.useState(defaultPromoInput);
    const [promo, setPromo] = React.useState<CheckoutPromo | null>(null);
    const [error, setError] = React.useState(false);
    const [shake, setShake] = React.useState(0);

    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const discount = promo ? Math.round(subtotal * promo.percentOff * 100) / 100 : 0;
    const shippingFee = lines.length > 0 ? shipping : 0;
    const total = Math.max(0, subtotal + shippingFee - discount);
    const collapse = reduced ? { duration: 0 } : COLLAPSE;

    const commit = (next: CheckoutLineItem[]) => {
      setLines(next);
      onItemsChange?.(next);
    };

    const setQuantity = (id: string, quantity: number) =>
      commit(lines.map((line) => (line.id === id ? { ...line, quantity: Math.min(99, Math.max(1, quantity)) } : line)));

    const applyPromo = (event: React.FormEvent) => {
      event.preventDefault();
      const match = promos.find((entry) => entry.code.toLowerCase() === code.trim().toLowerCase());
      if (!match) {
        setError(true);
        setShake((value) => value + 1);
        return;
      }
      setError(false);
      setPromo(match);
      setCode(match.code);
    };

    const stepClass = cn(
      "grid size-6 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400",
      "hover:bg-zinc-200 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent",
      INSET_FOCUS,
    );

    return (
      <div
        ref={ref}
        data-tsuna-id="checkout-summary-panel"
        data-promo={promo ? promo.code : undefined}
        className={cn(
          "flex w-[440px] max-w-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
          <p className="m-0 text-[13px] text-zinc-500 tabular-nums">
            {count} {count === 1 ? text.item : text.items}
          </p>
        </div>

          <ul className={cn("m-0 list-none p-0", lines.length > 0 && "-mb-4")}>
            <AnimatePresence initial={false}>
              {lines.map((line) => {
                const { product, variant } = splitName(line.name);
                return (
                  <motion.li
                    key={line.id}
                    layout
                    initial={false}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={collapse}
                    className="group overflow-hidden"
                  >
                    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-x-2 gap-y-1 pb-4">
                      <span
                        aria-hidden
                        className="row-span-2 grid size-11 self-start place-items-center rounded-[10px] text-[12px] font-semibold text-zinc-600"
                        style={{ backgroundColor: line.swatch ?? "#f4f4f5" }}
                      >
                        {initials(line.name)}
                      </span>
                      <p className="m-0 self-baseline truncate text-[14px] font-medium leading-5 text-zinc-900">{product}</p>
                      <RollingMoney
                        value={line.price * line.quantity}
                        currency={currency}
                        reduced={reduced}
                        className="self-baseline text-[14px] font-medium leading-5 text-zinc-900"
                      />
                      <div className="flex min-w-0 items-center text-[13px] text-zinc-500">
                        <span className="truncate">
                          {variant ? `${variant} · ` : ""}
                          {text.qty}
                        </span>
                        <span role="group" aria-label={product} className="relative ml-1 inline-flex items-center">
                          <button
                            type="button"
                            aria-label={`${text.decrease}: ${product}`}
                            disabled={line.quantity <= 1}
                            onClick={() => setQuantity(line.id, line.quantity - 1)}
                            className={stepClass}
                          >
                            <Minus aria-hidden className="size-3.5" />
                          </button>
                          <output aria-live="polite" className="block min-w-4 text-center text-[13px] tabular-nums">
                            {line.quantity}
                          </output>
                          <button
                            type="button"
                            aria-label={`${text.increase}: ${product}`}
                            onClick={() => setQuantity(line.id, line.quantity + 1)}
                            className={stepClass}
                          >
                            <Plus aria-hidden className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`${text.removeItem}: ${product}`}
                            onClick={() => commit(lines.filter((entry) => entry.id !== line.id))}
                            className={cn(
                              stepClass,
                              "absolute left-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
                            )}
                          >
                            <X aria-hidden className="size-3.5" />
                          </button>
                        </span>
                      </div>
                      {line.quantity > 1 ? (
                        <p className="m-0 self-center text-[12px] text-zinc-500 tabular-nums">
                          {moneyText(line.price, currency)} {text.each}
                        </p>
                      ) : (
                        <span />
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {lines.length === 0 ? (
              <li className="py-4 text-center text-[13px] text-zinc-400">{text.empty}</li>
            ) : null}
        </ul>

        <form onSubmit={applyPromo} noValidate>
          <AnimatePresence mode="wait" initial={false}>
            {promo ? (
              <motion.div
                key="chip"
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={collapse}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 text-[13px]">
                  <Tag aria-hidden className="size-3.5 shrink-0 text-zinc-400" />
                  <span className="font-medium tracking-[0.02em] text-zinc-900">{promo.code}</span>
                  <button
                    type="button"
                    aria-label={`${text.remove} ${promo.code}`}
                    onClick={() => {
                      setPromo(null);
                      setCode("");
                      setError(false);
                    }}
                    className={cn(
                      "grid size-4 cursor-pointer place-items-center border-0 bg-transparent p-0 text-zinc-400 hover:text-zinc-600",
                      INSET_FOCUS,
                    )}
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="field"
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={collapse}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    "flex h-10 items-center rounded-xl border bg-white",
                    "focus-within:ring-2 focus-within:ring-zinc-900/35 focus-within:ring-offset-2",
                    shake > 0 && error && `checkout-summary-panel-shake-${shake % 2 ? "a" : "b"}`,
                    error ? "border-rose-500" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <Tag aria-hidden className="ml-3 size-4 shrink-0 text-zinc-400" />
                  <input
                    id={`${uid}-promo`}
                    type="text"
                    value={code}
                    aria-label={text.promoLabel}
                    aria-invalid={error || undefined}
                    aria-describedby={error ? `${uid}-promo-error` : undefined}
                    placeholder={text.promoPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => {
                      setCode(event.target.value.toUpperCase());
                      if (error) setError(false);
                    }}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[14px] font-medium tracking-[0.02em] text-zinc-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={code.trim() === ""}
                    className={cn(
                      "h-full shrink-0 cursor-pointer border-0 bg-transparent px-3 text-[13px] font-medium text-zinc-900",
                      "disabled:cursor-default disabled:text-zinc-400",
                      INSET_FOCUS,
                    )}
                  >
                    {text.apply}
                  </button>
                </div>
                <p id={`${uid}-promo-error`} role="alert" className="m-0 text-[12.5px] text-rose-600">
                  {error ? <span className="block pt-2">{text.invalid}</span> : null}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <dl className="m-0 border-t border-zinc-200 pt-4 text-[13px]">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">{text.subtotal}</dt>
            <dd className="m-0 text-zinc-900">
              <RollingMoney value={subtotal} currency={currency} reduced={reduced} />
            </dd>
          </div>
          <AnimatePresence initial={false}>
            {promo ? (
              <motion.div
                key="discount"
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={collapse}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between pt-2 text-[13px]">
                  <dt className="text-zinc-500">{text.discount}</dt>
                  <dd className="m-0 text-zinc-900">
                    <RollingMoney value={discount} currency={currency} reduced={reduced} negative />
                  </dd>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="flex items-center justify-between pt-2">
            <dt className="text-zinc-500">{text.shipping}</dt>
            <dd className="m-0 text-zinc-900">
              <RollingMoney value={shippingFee} currency={currency} reduced={reduced} />
            </dd>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <dt className="text-[14px] font-semibold text-zinc-950">{text.total}</dt>
            <dd className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-zinc-950">
              <RollingMoney value={total} currency={currency} reduced={reduced} />
            </dd>
          </div>
        </dl>

        <div>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={() => onPay?.(total)}
            className={cn(
              "flex h-11 w-full cursor-pointer items-center justify-center rounded-[10px] border-0 bg-zinc-950 text-[14px] font-medium text-white",
              "transition-transform duration-150 ease-out hover:bg-zinc-800 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
              "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-950 disabled:active:scale-100",
              FOCUS,
            )}
          >
            <span>
              {text.pay}
              {"\u00A0"}
              <RollingMoney value={total} currency={currency} reduced={reduced} />
            </span>
          </button>
          <p className="m-0 mt-2 flex items-center justify-center gap-1 text-[12px] text-zinc-400">
            <Lock aria-hidden className="size-3" />
            {text.secure}
          </p>
        </div>
      </div>
    );
  },
);

CheckoutSummaryPanel.displayName = "CheckoutSummaryPanel";
