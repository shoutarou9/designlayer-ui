"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cloud,
  Coffee,
  Copy,
  Download,
  FileText,
  Landmark,
  MoreVertical,
  Package,
  Receipt,
  Share,
  ShoppingBasket,
  StickyNote,
  TrainFront,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TransactionLedgerMerchantInfo = {
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  phone?: string;
};

export type TransactionLedgerItem = {
  id: string;
  merchant: string;
  /** Also picks the tile icon (see CATEGORY_ICON). Unknown categories show a receipt. */
  category: string;
  /** Payment detail on line 2, e.g. "Visa •••• 4821" or "Bank transfer". */
  method?: string;
  /** Negative for money out, positive for income. */
  amount: number;
  /** Last four digits of the card. */
  card?: string;
  note?: string;
  /** Reference number shown in the details view, e.g. "TX-24811". */
  reference?: string;
  status?: "completed" | "pending";
  /** Pre-formatted date and time, e.g. "14 Nov 2026, 8:42 AM". Falls back to the group label. */
  date?: string;
  /** Short time zone pill next to the date, e.g. "JST". */
  timezone?: string;
  merchantInfo?: TransactionLedgerMerchantInfo;
  /** When present, the details view lists it under Attachments. */
  receipt?: { name?: string; size?: string };
};

export type TransactionLedgerGroup = {
  id: string;
  /** Sticky date header, e.g. "Today". */
  label: string;
  items: readonly TransactionLedgerItem[];
};

export type TransactionLedgerFilter = "all" | "income" | "expenses";

export type TransactionLedgerDetailAction = "download" | "share" | "more" | "attachmentDownload";

export type TransactionLedgerLabels = {
  all?: string;
  income?: string;
  expenses?: string;
  card?: string;
  paid?: string;
  received?: string;
  viewReceipt?: string;
  empty?: string;
  details?: string;
  amount?: string;
  reference?: string;
  category?: string;
  status?: string;
  completed?: string;
  pending?: string;
  merchant?: string;
  paymentMethod?: string;
  date?: string;
  note?: string;
  merchantDetails?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  phone?: string;
  attachments?: string;
  download?: string;
  share?: string;
  more?: string;
  close?: string;
  copy?: string;
  copied?: string;
};

export type TransactionLedgerListProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  groups?: readonly TransactionLedgerGroup[];
  filter?: TransactionLedgerFilter;
  defaultFilter?: TransactionLedgerFilter;
  onFilterChange?: (filter: TransactionLedgerFilter) => void;
  /** Symbol placed before every amount. */
  currency?: string;
  /** Clicking the attachment's file name. */
  onViewReceipt?: (item: TransactionLedgerItem) => void;
  /** Header buttons (Download, Share, More) and the attachment's download button in the details view. */
  onDetailAction?: (action: TransactionLedgerDetailAction, item: TransactionLedgerItem) => void;
  /** Fires with the transaction when the details view opens, and with null when it closes. */
  onOpenChange?: (item: TransactionLedgerItem | null) => void;
  labels?: TransactionLedgerLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
const OPEN_MS = 260;
const CLOSE_MS = 180;
/** Card height follows the view: list → details on open, back on close. */
const GROW_MS = 280;
const SHRINK_MS = 200;
const MERCHANT_MS = 260;
/** Top + bottom border of the card (border-box height = content + borders). */
const CARD_BORDER = 2;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes transaction-ledger-list-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.transaction-ledger-list-in { animation: transaction-ledger-list-in 420ms ${EASE} backwards; }
@media (prefers-reduced-motion: reduce) { .transaction-ledger-list-in { animation: none; } }
`;

const DEFAULT_GROUPS: readonly TransactionLedgerGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "t1",
        method: "Visa •••• 4821",
        merchant: "Blue Fern Café",
        category: "Dining",
        amount: -4.8,
        card: "4821",
        note: "Flat white and a pastry before stand-up.",
        reference: "TX-24811",
        status: "completed",
        date: "14 Nov 2026, 8:42 AM",
        timezone: "JST",
        merchantInfo: {
          address: "2-14-7 Jingumae",
          city: "Shibuya, Tokyo",
          country: "Japan",
          website: "bluefern.example",
          phone: "+81 3-5550-0142",
        },
        receipt: { size: "184 KB" },
      },
      {
        id: "t2",
        method: "Bank transfer",
        merchant: "Harbor Labs KK",
        category: "Salary",
        amount: 3200,
        note: "November payroll, deposited to Joint checking.",
        reference: "TX-24806",
        status: "completed",
        date: "14 Nov 2026, 6:00 AM",
        timezone: "JST",
        merchantInfo: {
          address: "1-8-3 Kaigan",
          city: "Minato, Tokyo",
          country: "Japan",
          website: "harborlabs.example",
          phone: "+81 3-5550-0388",
        },
      },
      {
        id: "t3",
        method: "Visa •••• 4821",
        merchant: "Kite Transit",
        category: "Transport",
        amount: -2.75,
        card: "4821",
        note: "Line 4, Central to Riverside.",
        reference: "TX-24803",
        status: "completed",
        date: "14 Nov 2026, 7:58 AM",
        timezone: "JST",
        merchantInfo: {
          address: "3-5-1 Toyosu",
          city: "Koto, Tokyo",
          country: "Japan",
          website: "kitetransit.example",
          phone: "+81 3-5550-0910",
        },
      },
    ],
  },
  {
    id: "yesterday",
    label: "Yesterday",
    items: [
      {
        id: "t4",
        method: "Visa •••• 4821",
        merchant: "Maple & Rye Market",
        category: "Groceries",
        amount: -64.12,
        card: "4821",
        note: "Weekly shop. Split with Adaeze.",
        reference: "TX-24797",
        status: "completed",
        date: "13 Nov 2026, 6:15 PM",
        timezone: "JST",
        merchantInfo: {
          address: "5-22-9 Kichijoji Honcho",
          city: "Musashino, Tokyo",
          country: "Japan",
          website: "mapleandrye.example",
          phone: "+81 422-55-0176",
        },
        receipt: { size: "236 KB" },
      },
      {
        id: "t5",
        method: "Debit •••• 0937",
        merchant: "Lumen Cloud",
        category: "Software",
        amount: -12,
        card: "0937",
        note: "Monthly storage plan, 200 GB.",
        reference: "TX-24795",
        status: "completed",
        date: "13 Nov 2026, 9:00 AM",
        timezone: "JST",
        merchantInfo: {
          address: "2-1-1 Nihonbashi",
          city: "Chuo, Tokyo",
          country: "Japan",
          website: "lumencloud.example",
          phone: "+81 3-5550-0657",
        },
        receipt: { size: "92 KB" },
      },
      {
        id: "t6",
        method: "Visa •••• 4821",
        merchant: "Parcel Post refund",
        category: "Refund",
        amount: 18.4,
        card: "4821",
        note: "Returned label fee for order #2291.",
        reference: "TX-24792",
        status: "completed",
        date: "13 Nov 2026, 11:24 AM",
        timezone: "JST",
        merchantInfo: {
          address: "1-9-1 Marunouchi",
          city: "Chiyoda, Tokyo",
          country: "Japan",
          website: "parcelpost.example",
          phone: "+81 3-5550-0221",
        },
      },
    ],
  },
  {
    id: "nov-10",
    label: "Nov 10",
    items: [
      {
        id: "t7",
        method: "Debit •••• 0937",
        merchant: "Orchard Books",
        category: "Shopping",
        amount: -27.5,
        card: "0937",
        note: "Two paperbacks for the trip.",
        reference: "TX-24770",
        status: "completed",
        date: "10 Nov 2026, 4:37 PM",
        timezone: "JST",
        merchantInfo: {
          address: "3-2-8 Kanda Jimbocho",
          city: "Chiyoda, Tokyo",
          country: "Japan",
          website: "orchardbooks.example",
          phone: "+81 3-5550-0473",
        },
        receipt: { size: "148 KB" },
      },
      {
        id: "t8",
        method: "Bank transfer",
        merchant: "Studio Vale",
        category: "Freelance",
        amount: 850,
        note: "Invoice INV-0087, brand refresh deposit.",
        reference: "TX-24768",
        status: "pending",
        date: "10 Nov 2026, 10:05 AM",
        timezone: "JST",
        merchantInfo: {
          address: "6-12-4 Nakameguro",
          city: "Meguro, Tokyo",
          country: "Japan",
          website: "studiovale.example",
          phone: "+81 3-5550-0765",
        },
      },
    ],
  },
];

const DEFAULT_LABELS: Required<TransactionLedgerLabels> = {
  all: "All",
  income: "Income",
  expenses: "Expenses",
  card: "Card",
  paid: "Paid",
  received: "Received",
  viewReceipt: "View receipt",
  empty: "No transactions match this filter.",
  details: "Transaction details",
  amount: "Amount",
  reference: "Reference no.",
  category: "Category",
  status: "Status",
  completed: "Completed",
  pending: "Pending",
  merchant: "Merchant",
  paymentMethod: "Payment method",
  date: "Date",
  note: "Note",
  merchantDetails: "Merchant details",
  address: "Address",
  city: "City",
  country: "Country",
  website: "Website",
  phone: "Phone",
  attachments: "Attachments",
  download: "Download",
  share: "Share",
  more: "More",
  close: "Close",
  copy: "Copy",
  copied: "Copied",
};

const FILTERS: readonly TransactionLedgerFilter[] = ["all", "income", "expenses"];

/** One place that maps a category (case-insensitive) to its tile icon. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  dining: Coffee,
  salary: Landmark,
  transport: TrainFront,
  groceries: ShoppingBasket,
  software: Cloud,
  refund: Package,
};

const iconFor = (category: string): LucideIcon => CATEGORY_ICON[category.trim().toLowerCase()] ?? Receipt;

const ROW_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/35";
const ICON_BUTTON = cn(
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent text-zinc-500",
  "transition-colors [transition-duration:160ms] hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none",
  FOCUS,
);
const ROW = "flex h-10 min-w-0 items-center justify-between gap-4";
const ROW_LABEL = "shrink-0 text-[13px] text-zinc-500";
const ROW_VALUE = "m-0 min-w-0 truncate text-right text-[13px] text-zinc-900";

const matches = (item: TransactionLedgerItem, filter: TransactionLedgerFilter) =>
  filter === "all" || (filter === "income" ? item.amount > 0 : item.amount < 0);

function formatAmount(amount: number, currency: string) {
  const abs = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${currency}${abs}`;
}

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

/** Observed border-box height of an element; null until first measured. */
function useHeight(node: HTMLElement | null) {
  const [height, setHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!node) {
      setHeight(null);
      return;
    }
    const measure = () => setHeight(node.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return height;
}

/** FLIP: rows that stay glide from their old spot to the new one whenever `key` changes. */
function useFlip(key: unknown, container: React.RefObject<HTMLElement | null>, reduced: boolean) {
  const nodes = React.useRef(new Map<string, HTMLElement>());
  const last = React.useRef(new Map<string, { x: number; y: number }>());
  const bind = React.useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    },
    [],
  );
  React.useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    nodes.current.forEach((node) => {
      node.style.transition = "none";
      node.style.transform = "";
    });
    const origin = root.getBoundingClientRect();
    const scale = root.offsetWidth > 0 ? origin.width / root.offsetWidth || 1 : 1;
    const next = new Map<string, { x: number; y: number }>();
    const moves: Array<[HTMLElement, number, number]> = [];
    nodes.current.forEach((node, id) => {
      const rect = node.getBoundingClientRect();
      const point = {
        x: (rect.left - origin.left) / scale + root.scrollLeft,
        y: (rect.top - origin.top) / scale + root.scrollTop,
      };
      next.set(id, point);
      const prev = last.current.get(id);
      if (!prev || reduced) return;
      const dx = prev.x - point.x;
      const dy = prev.y - point.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moves.push([node, dx, dy]);
    });
    last.current = next;
    if (moves.length === 0) return;
    moves.forEach(([node, dx, dy]) => {
      node.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    void root.offsetHeight;
    moves.forEach(([node]) => {
      node.style.transition = `transform 420ms ${EASE}`;
      node.style.transform = "";
    });
  }, [key, container, reduced]);
  return bind;
}

export const TransactionLedgerList = React.forwardRef<HTMLDivElement, TransactionLedgerListProps>(
  (
    {
      title = "Transactions",
      groups = DEFAULT_GROUPS,
      filter,
      defaultFilter = "all",
      onFilterChange,
      currency = "$",
      onViewReceipt,
      onDetailAction,
      onOpenChange,
      labels,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = usePrefersReducedMotion();
    const uid = React.useId();
    const [ownFilter, setOwnFilter] = React.useState<TransactionLedgerFilter>(defaultFilter);
    const current = filter ?? ownFilter;
    /** The filter the list is showing. It trails `current` while leaving rows fade out. */
    const [applied, setApplied] = React.useState<TransactionLedgerFilter>(current);
    /** Mounted transaction in the details view; `sheetIn` drives the slide. */
    const [detailId, setDetailId] = React.useState<string | null>(null);
    const [sheetIn, setSheetIn] = React.useState(false);
    const [merchantOpen, setMerchantOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    /** Which height transition is running on the card, if any. */
    const [resize, setResize] = React.useState<"grow" | "shrink" | null>(null);
    const [listBox, setListBox] = React.useState<HTMLDivElement | null>(null);
    const [detailBox, setDetailBox] = React.useState<HTMLDivElement | null>(null);
    const listHeight = useHeight(listBox);
    const detailHeight = useHeight(detailBox);
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current as HTMLDivElement);
    const scroller = React.useRef<HTMLDivElement>(null);
    const sheet = React.useRef<HTMLDivElement>(null);
    const copyTimer = React.useRef<number | undefined>(undefined);
    const resizeTimer = React.useRef<number | undefined>(undefined);
    const opener = React.useRef<HTMLButtonElement | null>(null);
    const closeTimer = React.useRef<number | undefined>(undefined);
    const frame = React.useRef<number | undefined>(undefined);
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
    const bind = useFlip(applied, scroller, reduced);
    const index = FILTERS.indexOf(current);

    React.useEffect(() => {
      if (current === applied) return;
      if (reduced) {
        setApplied(current);
        return;
      }
      const timer = window.setTimeout(() => setApplied(current), 180);
      return () => window.clearTimeout(timer);
    }, [current, applied, reduced]);

    React.useEffect(
      () => () => {
        window.clearTimeout(closeTimer.current);
        window.clearTimeout(copyTimer.current);
        window.clearTimeout(resizeTimer.current);
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      },
      [],
    );

    const allItems = groups.flatMap((group) => group.items.map((item) => ({ item, group })));
    const detail = allItems.find((entry) => entry.item.id === detailId) ?? null;

    const choose = (next: TransactionLedgerFilter) => {
      if (filter === undefined) setOwnFilter(next);
      onFilterChange?.(next);
    };

    const onFilterKeyDown = (event: React.KeyboardEvent) => {
      let next: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % FILTERS.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + FILTERS.length) % FILTERS.length;
      if (next === null) return;
      event.preventDefault();
      choose(FILTERS[next] ?? "all");
      buttons.current[next]?.focus();
    };

    const runResize = (kind: "grow" | "shrink", ms: number) => {
      if (reduced) return;
      window.clearTimeout(resizeTimer.current);
      setResize(kind);
      resizeTimer.current = window.setTimeout(() => setResize(null), ms + 40);
    };

    const openDetail = (item: TransactionLedgerItem, trigger: HTMLButtonElement) => {
      window.clearTimeout(closeTimer.current);
      opener.current = trigger;
      setDetailId(item.id);
      setMerchantOpen(false);
      setCopied(false);
      onOpenChange?.(item);
      if (reduced) {
        setSheetIn(true);
        return;
      }
      setSheetIn(false);
      // Two frames so the sheet is measured and painted off-canvas first, then slides in as the card grows.
      frame.current = requestAnimationFrame(() => {
        frame.current = requestAnimationFrame(() => {
          setSheetIn(true);
          runResize("grow", GROW_MS);
        });
      });
    };

    const closeDetail = () => {
      if (!detailId) return;
      setSheetIn(false);
      runResize("shrink", SHRINK_MS);
      onOpenChange?.(null);
      const finish = () => {
        setDetailId(null);
        opener.current?.focus({ preventScroll: true });
      };
      if (reduced) return finish();
      closeTimer.current = window.setTimeout(finish, CLOSE_MS);
    };

    // Move focus into the sheet once it is in place.
    React.useEffect(() => {
      if (sheetIn) sheet.current?.focus({ preventScroll: true });
    }, [sheetIn]);

    const shown = groups
      .map((group) => ({ ...group, items: group.items.filter((item) => matches(item, applied)) }))
      .filter((group) => group.items.length > 0);
    const filterLabel: Record<TransactionLedgerFilter, string> = {
      all: text.all,
      income: text.income,
      expenses: text.expenses,
    };
    let rowIndex = 0;
    const listHidden = detailId !== null && sheetIn;
    /** Border-box height for the card: the list's height, or the details' height while the sheet is in. */
    const contentHeight = detailId !== null && sheetIn && detailHeight !== null ? detailHeight : listHeight;
    const cardHeight = contentHeight === null ? null : contentHeight + CARD_BORDER;

    const copyReference = (value: string) => {
      const done = () => {
        setCopied(true);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1400);
      };
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, done);
      } else {
        done();
      }
    };

    const renderDetail = (item: TransactionLedgerItem, groupLabel: string) => {
      const income = item.amount > 0;
      const CategoryIcon = iconFor(item.category);
      const payment = item.method ?? (item.card ? `${text.card} •••• ${item.card}` : undefined);
      const info = item.merchantInfo;
      const infoRows = info
        ? ([
            [text.address, info.address],
            [text.city, info.city],
            [text.country, info.country],
            [text.website, info.website],
            [text.phone, info.phone],
          ].filter((row): row is [string, string] => Boolean(row[1])))
        : [];
      const fileName = item.receipt ? (item.receipt.name ?? `receipt-${item.reference ?? item.id}.pdf`) : "";
      const pending = item.status === "pending";
      const StatusIcon = pending ? Clock3 : CheckCircle2;
      const when = [item.date ?? groupLabel, item.timezone].filter(Boolean).join(" ");
      return (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 py-3.5 pr-3 pl-5">
            <h2 id={`${uid}-detail-title`} className="m-0 min-w-0 truncate text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">
              {text.details}
            </h2>
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" aria-label={text.download} title={text.download} onClick={() => onDetailAction?.("download", item)} className={ICON_BUTTON}>
                <Download aria-hidden size={16} strokeWidth={1.75} />
              </button>
              <button type="button" aria-label={text.share} title={text.share} onClick={() => onDetailAction?.("share", item)} className={ICON_BUTTON}>
                <Share aria-hidden size={16} strokeWidth={1.75} />
              </button>
              <button type="button" aria-label={text.more} title={text.more} onClick={() => onDetailAction?.("more", item)} className={ICON_BUTTON}>
                <MoreVertical aria-hidden size={16} strokeWidth={1.75} />
              </button>
              <span aria-hidden className="mx-1 hidden h-4 w-px bg-zinc-200 sm:block" />
              <button type="button" aria-label={text.close} title={text.close} onClick={closeDetail} className={ICON_BUTTON}>
                <X aria-hidden size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="mx-5 flex flex-col items-center border-b border-zinc-100 pt-6 pb-5 text-center">
            <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-zinc-100 text-zinc-600">
              <CategoryIcon aria-hidden size={20} strokeWidth={1.75} />
            </span>
            <p className="m-0 mt-3 max-w-full truncate text-[15px] font-medium text-zinc-900">{item.merchant}</p>
            <p
              className={cn(
                "m-0 mt-1 text-[36px] leading-[1.15] font-semibold tracking-[-0.03em] tabular-nums",
                income ? "text-emerald-600" : "text-zinc-900",
              )}
            >
              {formatAmount(item.amount, currency)}
            </p>
            <p className="m-0 mt-2 inline-flex max-w-full items-center gap-1.5 text-[13px] text-zinc-500 tabular-nums">
              {item.status ? (
                <>
                  <StatusIcon aria-hidden size={14} strokeWidth={1.75} className="shrink-0" />
                  <span>{pending ? text.pending : text.completed}</span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <span className="truncate">{when}</span>
            </p>
          </div>

          <div className="px-5 pb-5">
            <dl className="m-0 mt-2 divide-y divide-zinc-100">
              <div className={ROW}>
                <dt className={ROW_LABEL}>{text.category}</dt>
                <dd className={ROW_VALUE}>{item.category}</dd>
              </div>
              {payment ? (
                <div className={ROW}>
                  <dt className={ROW_LABEL}>{text.paymentMethod}</dt>
                  <dd className={cn(ROW_VALUE, "tabular-nums")}>{payment}</dd>
                </div>
              ) : null}
              {item.reference ? (
                <div className={cn(ROW, "group")}>
                  <dt className={ROW_LABEL}>{text.reference}</dt>
                  <dd className="m-0 flex min-w-0 items-center justify-end gap-1">
                    <button
                      type="button"
                      aria-label={copied ? text.copied : `${text.copy}: ${item.reference}`}
                      title={copied ? text.copied : text.copy}
                      onClick={() => copyReference(item.reference ?? "")}
                      className={cn(
                        "-my-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-zinc-400",
                        "opacity-0 transition-[opacity,background-color,color] [transition-duration:160ms] group-hover:opacity-100 focus-visible:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none [@media(hover:none)]:opacity-100",
                        copied && "opacity-100",
                        FOCUS,
                      )}
                    >
                      {copied ? (
                        <Check aria-hidden size={14} strokeWidth={2} />
                      ) : (
                        <Copy aria-hidden size={14} strokeWidth={1.75} />
                      )}
                    </button>
                    <span className="truncate text-[13px] text-zinc-900 tabular-nums">{item.reference}</span>
                  </dd>
                </div>
              ) : null}
            </dl>

            {item.note ? (
              <p className="m-0 mt-4 flex min-w-0 items-center gap-2 text-[13px] text-zinc-500" title={item.note}>
                <StickyNote aria-hidden size={14} strokeWidth={1.75} className="shrink-0 text-zinc-400" />
                <span className="truncate">{item.note}</span>
              </p>
            ) : null}

            {infoRows.length > 0 ? (
              <section className="mt-4 border-t border-zinc-100">
                <h3 className="m-0">
                  <button
                    type="button"
                    aria-expanded={merchantOpen}
                    aria-controls={`${uid}-merchant-info`}
                    onClick={() => setMerchantOpen((open) => !open)}
                    className={cn(
                      "flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border-0 bg-transparent p-0 text-left text-[13px] font-medium text-zinc-900",
                      FOCUS,
                    )}
                  >
                    {text.merchantDetails}
                    <ChevronDown
                      aria-hidden
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-zinc-400 motion-reduce:!transition-none"
                      style={{
                        transform: merchantOpen ? "rotate(180deg)" : "none",
                        transition: `transform 260ms ${EASE}`,
                      }}
                    />
                  </button>
                </h3>
                <div
                  id={`${uid}-merchant-info`}
                  aria-hidden={!merchantOpen || undefined}
                  inert={!merchantOpen || undefined}
                  className="grid motion-reduce:!transition-none"
                  style={{
                    gridTemplateRows: merchantOpen ? "1fr" : "0fr",
                    opacity: merchantOpen ? 1 : 0,
                    transition: reduced
                      ? "none"
                      : `grid-template-rows ${MERCHANT_MS}ms ${EASE}, opacity ${merchantOpen ? 220 : 140}ms ${EASE}`,
                  }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <dl className="m-0 divide-y divide-zinc-100 border-t border-zinc-100">
                      {infoRows.map(([label, value]) => (
                        <div key={label} className={ROW}>
                          <dt className={ROW_LABEL}>{label}</dt>
                          <dd className={ROW_VALUE}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </section>
            ) : null}

            {item.receipt ? (
              <div className="mt-4 flex h-11 items-center gap-2.5 rounded-[10px] border border-zinc-200 pr-1 pl-3">
                <FileText aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-zinc-500" />
                <button
                  type="button"
                  title={text.viewReceipt}
                  onClick={() => onViewReceipt?.(item)}
                  className={cn(
                    "min-w-0 flex-1 cursor-pointer truncate rounded-[6px] border-0 bg-transparent p-0 text-left text-[13px] text-zinc-800 hover:text-zinc-950 hover:underline",
                    FOCUS,
                  )}
                >
                  {fileName}
                </button>
                {item.receipt.size ? (
                  <span className="shrink-0 text-[13px] text-zinc-400 tabular-nums">{item.receipt.size}</span>
                ) : null}
                <button
                  type="button"
                  aria-label={`${text.download}: ${fileName}`}
                  title={text.download}
                  onClick={() => onDetailAction?.("attachmentDownload", item)}
                  className={ICON_BUTTON}
                >
                  <Download aria-hidden size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : null}
          </div>
        </>
      );
    };

    return (
      <div
        ref={root}
        data-tsuna-id="transaction-ledger-list"
        data-filter={current}
        data-detail={detailId ?? undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Escape" && detailId) {
            event.preventDefault();
            closeDetail();
          }
        }}
        className={cn(
          "relative w-[480px] max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
        style={{
          ...props.style,
          height: cardHeight === null ? undefined : cardHeight,
          transition:
            resize === "grow"
              ? `height ${GROW_MS}ms ${EASE_OUT}`
              : resize === "shrink"
                ? `height ${SHRINK_MS}ms ${EASE_OUT}`
                : "none",
        }}
      >
        <style>{CSS}</style>
        <div ref={setListBox} inert={listHidden || undefined} aria-hidden={listHidden || undefined}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3.5">
            <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
            <div
              role="radiogroup"
              aria-label={title}
              onKeyDown={onFilterKeyDown}
              className="relative grid rounded-xl bg-zinc-100 p-[3px]"
              style={{ gridTemplateColumns: `repeat(${FILTERS.length}, minmax(0, 1fr))` }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-[3px] left-[3px] rounded-[9px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] motion-reduce:!transition-none"
                style={{
                  height: "calc(100% - 6px)",
                  width: `calc((100% - 6px) / ${FILTERS.length})`,
                  transform: `translateX(${index * 100}%)`,
                  transition: `transform 420ms ${EASE}`,
                }}
              />
              {FILTERS.map((key, i) => (
                <button
                  key={key}
                  ref={(node) => {
                    buttons.current[i] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={key === current}
                  tabIndex={key === current ? 0 : -1}
                  onClick={() => choose(key)}
                  className={cn(
                    "relative z-10 h-8 cursor-pointer rounded-[9px] border-0 bg-transparent px-3 text-[13px] font-medium",
                    "transition-colors [transition-duration:180ms] motion-reduce:transition-none",
                    key === current ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
                    FOCUS,
                  )}
                >
                  {filterLabel[key]}
                </button>
              ))}
            </div>
          </div>

          <div ref={scroller} className="relative h-[452px] overflow-y-auto">
            {shown.map((group) => {
              const net = group.items.reduce((sum, item) => sum + item.amount, 0);
              return (
                <section key={group.id} aria-label={group.label}>
                  <h3
                    ref={bind(`group-${group.id}`)}
                    className="sticky top-0 z-10 m-0 flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/95 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400 backdrop-blur"
                  >
                    <span className="truncate">{group.label}</span>
                    <span className="shrink-0 tabular-nums">{formatAmount(net, currency)}</span>
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {group.items.map((item) => {
                      const fading = current !== applied && !matches(item, current);
                      const delay = Math.min(rowIndex++, 8) * 45;
                      const Icon = iconFor(item.category);
                      const income = item.amount > 0;
                      const method = item.method ?? (item.card ? `${text.card} •••• ${item.card}` : undefined);
                      const line = [income ? text.received : text.paid, item.category, method]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li
                          key={item.id}
                          ref={bind(item.id)}
                          className="relative after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-[68px] after:h-px after:bg-zinc-100 after:content-[''] last:after:hidden"
                        >
                          <div
                            className="transaction-ledger-list-in motion-reduce:!transition-none"
                            style={{
                              animationDelay: `${delay}ms`,
                              opacity: fading ? 0 : undefined,
                              transition: `opacity 180ms ${EASE}`,
                            }}
                          >
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              onClick={(event) => openDetail(item, event.currentTarget)}
                              className={cn(
                                "flex min-h-16 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left",
                                "transition-colors [transition-duration:180ms] hover:bg-zinc-50 motion-reduce:transition-none",
                                ROW_FOCUS,
                              )}
                            >
                              <span
                                aria-hidden
                                className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600"
                              >
                                <Icon aria-hidden size={18} strokeWidth={1.75} />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-[15px] leading-[1.35] text-zinc-900">{item.merchant}</span>
                                <span className="truncate text-[12.5px] leading-[1.35] text-zinc-500 tabular-nums">
                                  <span aria-hidden>{income ? "← " : "→ "}</span>
                                  {line}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 text-[14px] font-semibold whitespace-nowrap tabular-nums",
                                  income ? "text-emerald-600" : "text-zinc-900",
                                )}
                              >
                                {formatAmount(item.amount, currency)}
                              </span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
            {shown.length === 0 ? (
              <p className="transaction-ledger-list-in m-0 px-5 py-10 text-center text-[13px] text-zinc-400">{text.empty}</p>
            ) : null}
          </div>
        </div>

        {detail ? (
          <div
            ref={sheet}
            role="dialog"
            aria-labelledby={`${uid}-detail-title`}
            tabIndex={-1}
            className="absolute inset-x-0 top-0 z-20 min-h-full bg-white outline-none motion-reduce:!transition-none"
            style={{
              transform: sheetIn ? "translateX(0)" : "translateX(100%)",
              transition: sheetIn ? `transform ${OPEN_MS}ms ${EASE_OUT}` : `transform ${CLOSE_MS}ms ${EASE_IN}`,
            }}
          >
            <div ref={setDetailBox}>{renderDetail(detail.item, detail.group.label)}</div>
          </div>
        ) : null}
      </div>
    );
  },
);

TransactionLedgerList.displayName = "TransactionLedgerList";
