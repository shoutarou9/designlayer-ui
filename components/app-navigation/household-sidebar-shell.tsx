"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  Landmark,
  LayoutGrid,
  PiggyBank,
  Settings,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HouseholdSidebarChild = {
  id: string;
  label: string;
  /** Right-aligned figure, e.g. "$8,240.12". A leading "−" or "-" marks it negative. */
  value?: string;
};

export type HouseholdSidebarItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Keyboard hint shown on hover, e.g. "G O". Press the keys in order while focus is in the shell. */
  shortcut?: string;
  /** With children the row becomes a toggle and the children are the destinations. */
  children?: readonly HouseholdSidebarChild[];
  /** Shown on a collapsed parent row. Defaults to the sum of the children's values. */
  total?: string;
};

export type HouseholdSidebarSection = {
  id: string;
  /** Small sentence-case label above the group. */
  label?: string;
  items: readonly HouseholdSidebarItem[];
};

export type HouseholdSidebarShellProps = Omit<React.ComponentPropsWithoutRef<"div">, "children"> & {
  workspace?: string;
  /** Muted second line under the workspace name. Defaults to "<n> accounts". */
  workspaceMeta?: string;
  sections?: readonly HouseholdSidebarSection[];
  /** Rows pinned above the user card. Empty by default. */
  footerItems?: readonly HouseholdSidebarItem[];
  user?: { name: string; email: string };
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  /** Parent rows that start open. */
  defaultOpenIds?: readonly string[];
  onWorkspaceClick?: () => void;
  onUserClick?: () => void;
  /** Settings button on the user card. Without it, the shell selects the "settings" view. */
  onSettingsClick?: () => void;
  settingsLabel?: string;
  navLabel?: string;
  /** Main area beside the sidebar. A quiet placeholder shows when unset. */
  children?: React.ReactNode;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const GROUP_MS = 200;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-1";

const CSS = `
@keyframes household-sidebar-shell-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.household-sidebar-shell-in { animation: household-sidebar-shell-in 420ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) { .household-sidebar-shell-in { animation: none; } }
`;

const DEFAULT_SECTIONS: readonly HouseholdSidebarSection[] = [
  {
    id: "main",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid, shortcut: "G O" },
      { id: "transactions", label: "Transactions", icon: ArrowLeftRight, shortcut: "G T" },
      { id: "cash-flow", label: "Cash flow", icon: TrendingUp, shortcut: "G C" },
      {
        id: "accounts",
        label: "Accounts",
        icon: Landmark,
        children: [
          { id: "joint-checking", label: "Joint checking", value: "$8,240.12" },
          { id: "savings", label: "Savings", value: "$21,900.00" },
          { id: "amex-gold", label: "Amex Gold", value: "−$1,204.55" },
          { id: "brokerage", label: "Brokerage", value: "$54,310.80" },
        ],
      },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      { id: "budgets", label: "Budgets", icon: PiggyBank },
      { id: "goals", label: "Goals", icon: Target },
      { id: "investments", label: "Investments", icon: BarChart3 },
    ],
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const isNegative = (value: string) => /^\s*[−-]/.test(value);

/** "$8,240.12" / "−$1,204.55" → number, or null when it is not a plain money figure. */
function parseMoney(value: string): { amount: number; symbol: string } | null {
  const match = value.trim().match(/^([−-])?\s*([^\d\s.,−-]*)\s*([\d,]+(?:\.\d+)?)$/);
  if (!match) return null;
  const amount = Number((match[3] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  return { amount: match[1] ? -amount : amount, symbol: match[2] ?? "" };
}

function sumValues(children: readonly HouseholdSidebarChild[]): string | undefined {
  let total = 0;
  let symbol = "";
  for (const child of children) {
    if (!child.value) continue;
    const parsed = parseMoney(child.value);
    if (!parsed) return undefined;
    total += parsed.amount;
    symbol ||= parsed.symbol;
  }
  const abs = Math.abs(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${total < 0 ? "−" : ""}${symbol}${abs}`;
}

/** Active surface: white with a 1px inset ring in the border color, no drop shadow. */
const ACTIVE_SURFACE = "bg-white shadow-[inset_0_0_0_1px_#e4e4e7]";

const ROW =
  "group relative flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] border-0 bg-transparent px-2.5 text-left text-[13.5px] transition-colors [transition-duration:160ms] motion-reduce:transition-none";
const ROW_IDLE = "font-normal text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900";
const ROW_ACTIVE = "font-medium text-zinc-950";
const ICON = { size: 16, strokeWidth: 1.75 } as const;

export const HouseholdSidebarShell = React.forwardRef<HTMLDivElement, HouseholdSidebarShellProps>(
  (
    {
      workspace = "Okafor household",
      workspaceMeta,
      sections = DEFAULT_SECTIONS,
      footerItems = [],
      user = { name: "Adaeze Okafor", email: "adaeze@okafor.family" },
      activeId,
      defaultActiveId = "overview",
      onActiveChange,
      defaultOpenIds = ["accounts"],
      onWorkspaceClick,
      onUserClick,
      onSettingsClick,
      settingsLabel = "Settings",
      navLabel = "Household",
      children,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const uid = React.useId();
    const [ownActive, setOwnActive] = React.useState(defaultActiveId);
    const active = activeId ?? ownActive;
    const [openIds, setOpenIds] = React.useState<readonly string[]>(defaultOpenIds);
    const [pill, setPill] = React.useState<{ top: number; left: number; width: number; height: number; glide: boolean } | null>(null);
    const nav = React.useRef<HTMLElement>(null);
    const rows = React.useRef(new Map<string, HTMLElement>());
    const groups = React.useRef(new Map<string, HTMLElement>());
    const chord = React.useRef<{ key: string; at: number } | null>(null);

    const allItems = [...sections.flatMap((section) => section.items), ...footerItems];
    const accountCount = allItems.reduce((count, item) => count + (item.children?.length ?? 0), 0);
    const meta = workspaceMeta ?? (accountCount > 0 ? `${accountCount} accounts` : undefined);
    const parent = allItems.find((item) => item.children?.some((child) => child.id === active));
    /** A child in a closed group hands the pill to its parent row. */
    const targetId = parent && !openIds.includes(parent.id) ? parent.id : active;
    const target = React.useRef(targetId);
    target.current = targetId;
    const activeLabel =
      allItems.find((item) => item.id === active)?.label ??
      parent?.children?.find((child) => child.id === active)?.label ??
      (active === "settings" ? settingsLabel : "");

    const measure = React.useCallback((glide: boolean) => {
      const node = rows.current.get(target.current);
      const root = nav.current;
      if (!node || !root) {
        setPill(null);
        return;
      }
      const box = root.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      const scale = root.offsetWidth > 0 ? box.width / root.offsetWidth || 1 : 1;
      const next = {
        top: (rect.top - box.top) / scale,
        left: (rect.left - box.left) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
      setPill((prev) =>
        prev &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : { ...next, glide },
      );
    }, []);

    React.useLayoutEffect(() => {
      measure(true);
    }, [targetId, measure]);

    // While a group opens or closes, rows below it move every frame: follow them without easing.
    React.useEffect(() => {
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => measure(false));
      if (nav.current) observer.observe(nav.current);
      groups.current.forEach((node) => observer.observe(node));
      return () => observer.disconnect();
    }, [measure, sections]);

    const select = (id: string) => {
      if (activeId === undefined) setOwnActive(id);
      onActiveChange?.(id);
    };

    const toggle = (id: string) =>
      setOpenIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

    const openSettings = () => {
      if (onSettingsClick) onSettingsClick();
      else select("settings");
    };

    const bindRow = (id: string) => (node: HTMLElement | null) => {
      if (node) rows.current.set(id, node);
      else rows.current.delete(id);
    };

    /** "G" then a letter jumps to the item whose shortcut is "G <letter>" (focus must be inside the shell). */
    const onShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (event.target as HTMLElement).isContentEditable) return;
      const key = event.key.toUpperCase();
      const now = Date.now();
      const first = chord.current;
      if (first && now - first.at < 1200) {
        const hit = allItems.find((item) => item.shortcut?.toUpperCase().replace(/\s+/g, " ") === `${first.key} ${key}`);
        chord.current = null;
        if (hit) {
          event.preventDefault();
          select(hit.id);
          rows.current.get(hit.id)?.focus();
          return;
        }
      }
      if (allItems.some((item) => item.shortcut?.toUpperCase().startsWith(`${key} `))) chord.current = { key, at: now };
    };

    const renderHint = (shortcut?: string) =>
      shortcut ? (
        <span
          aria-hidden
          className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity [transition-duration:160ms] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {shortcut.split(/\s+/).map((key, index) => (
            <kbd key={`${key}-${index}`} className="font-sans text-[11px] leading-none text-zinc-400">
              {key}
            </kbd>
          ))}
        </span>
      ) : null;

    const renderItem = (item: HouseholdSidebarItem) => {
      const Icon = item.icon;
      const current = targetId === item.id;
      const icon = Icon ? (
        <Icon aria-hidden {...ICON} className={cn("shrink-0", current ? "text-zinc-950" : "text-zinc-400")} />
      ) : null;
      if (!item.children) {
        return (
          <li key={item.id}>
            <button
              type="button"
              ref={bindRow(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              aria-keyshortcuts={item.shortcut?.replace(/\s+/g, " ")}
              onClick={() => select(item.id)}
              className={cn(ROW, "h-8", current ? ROW_ACTIVE : ROW_IDLE, current && !pill && ACTIVE_SURFACE, FOCUS)}
            >
              {icon}
              <span className="min-w-0 truncate">{item.label}</span>
              {renderHint(item.shortcut)}
            </button>
          </li>
        );
      }
      const open = openIds.includes(item.id);
      const total = item.total ?? sumValues(item.children);
      return (
        <li key={item.id}>
          <button
            type="button"
            ref={bindRow(item.id)}
            aria-expanded={open}
            aria-controls={`${uid}-${item.id}`}
            onClick={() => toggle(item.id)}
            className={cn(ROW, "h-8", current ? ROW_ACTIVE : ROW_IDLE, current && !pill && ACTIVE_SURFACE, FOCUS)}
          >
            {icon}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {total ? (
              <span
                aria-hidden={open || undefined}
                className="shrink-0 text-[12px] font-normal text-zinc-400 tabular-nums motion-reduce:!transition-none"
                style={{ opacity: open ? 0 : 1, transition: `opacity ${GROUP_MS}ms ${EASE_OUT}` }}
              >
                {total}
              </span>
            ) : null}
            <ChevronRight
              aria-hidden
              size={14}
              strokeWidth={1.75}
              className="shrink-0 text-zinc-400 motion-reduce:!transition-none"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: `transform ${GROUP_MS}ms ${EASE_OUT}` }}
            />
          </button>
          <div
            id={`${uid}-${item.id}`}
            ref={(node) => {
              if (node) groups.current.set(item.id, node);
              else groups.current.delete(item.id);
            }}
            aria-hidden={!open || undefined}
            className="grid motion-reduce:!transition-none"
            style={{
              gridTemplateRows: open ? "1fr" : "0fr",
              opacity: open ? 1 : 0,
              transition: `grid-template-rows ${GROUP_MS}ms ${EASE_OUT}, opacity ${GROUP_MS}ms ${EASE_OUT}`,
            }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative pt-0.5">
                {/* Guide line under the parent icon (row padding 10px + half of the 16px icon). */}
                <span aria-hidden className="pointer-events-none absolute top-1 bottom-1 left-[17.5px] w-px bg-zinc-200" />
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                  {item.children.map((child) => {
                    const childCurrent = targetId === child.id;
                    const negative = child.value ? isNegative(child.value) : false;
                    return (
                      <li key={child.id}>
                        <button
                          type="button"
                          ref={bindRow(child.id)}
                          tabIndex={open ? 0 : -1}
                          aria-current={active === child.id ? "page" : undefined}
                          onClick={() => select(child.id)}
                          className={cn(
                            ROW,
                            // Starts right of the guide; 26px + 10px padding = parent label's 36px.
                            "ml-[26px] h-8 w-[calc(100%-26px)] text-[13px]",
                            childCurrent ? ROW_ACTIVE : ROW_IDLE,
                            childCurrent && !pill && ACTIVE_SURFACE,
                            FOCUS,
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{child.label}</span>
                          {child.value ? (
                            <span
                              className={cn(
                                "shrink-0 text-[13px] font-normal tabular-nums",
                                negative ? "text-zinc-900" : childCurrent ? "text-zinc-700" : "text-zinc-500",
                              )}
                            >
                              {child.value}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </li>
      );
    };

    const settingsActive = active === "settings" && !onSettingsClick;

    return (
      <div
        ref={ref}
        data-tsuna-id="household-sidebar-shell"
        data-active={active}
        onKeyDown={onShortcut}
        className={cn(
          "flex min-h-[640px] w-[820px] max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <nav
          ref={nav}
          aria-label={navLabel}
          className="relative flex w-full shrink-0 flex-col bg-zinc-100/70 p-3 sm:w-[272px] sm:border-r sm:border-zinc-200"
        >
          {pill ? (
            <span
              aria-hidden
              className={cn("pointer-events-none absolute top-0 left-0 rounded-[8px] motion-reduce:!transition-none", ACTIVE_SURFACE)}
              style={{
                width: pill.width,
                height: pill.height,
                transform: `translate(${pill.left}px, ${pill.top}px)`,
                transition: pill.glide
                  ? `transform 360ms ${EASE}, width 360ms ${EASE}, height 360ms ${EASE}`
                  : "none",
              }}
            />
          ) : null}

          <button
            type="button"
            onClick={onWorkspaceClick}
            className={cn(ROW, "h-10 hover:bg-zinc-200/50", FOCUS)}
          >
            <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-zinc-950 text-[11px] font-semibold text-white">
              {workspace.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13.5px] leading-[1.2] font-semibold tracking-[-0.01em] text-zinc-950">{workspace}</span>
              {meta ? <span className="truncate text-[12px] leading-[1.3] text-zinc-500">{meta}</span> : null}
            </span>
            <ChevronsUpDown aria-hidden size={14} strokeWidth={1.75} className="shrink-0 text-zinc-400" />
          </button>

          {sections.map((section, index) => (
            <div key={section.id} className={index === 0 ? "mt-3" : undefined}>
              {section.label ? (
                <p className="m-0 px-2.5 pt-5 pb-1.5 text-[11px] leading-[1.2] font-medium text-zinc-400">{section.label}</p>
              ) : null}
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{section.items.map(renderItem)}</ul>
            </div>
          ))}

          <div className="mt-auto pt-6">
            {footerItems.length > 0 ? (
              <ul className="m-0 mb-1 flex list-none flex-col gap-0.5 p-0">{footerItems.map(renderItem)}</ul>
            ) : null}
            <div className="flex items-center gap-1 pt-3">
              <button
                type="button"
                onClick={onUserClick}
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left",
                  "transition-colors [transition-duration:160ms] hover:bg-zinc-200/50 motion-reduce:transition-none",
                  FOCUS,
                )}
              >
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700">
                  {initials(user.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-medium text-zinc-900">{user.name}</span>
                  <span className="truncate text-[12px] text-zinc-500">{user.email}</span>
                </span>
              </button>
              <button
                type="button"
                aria-label={settingsLabel}
                title={settingsLabel}
                aria-current={settingsActive ? "page" : undefined}
                onClick={openSettings}
                className={cn(
                  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent",
                  "transition-colors [transition-duration:160ms] motion-reduce:transition-none",
                  settingsActive ? cn(ACTIVE_SURFACE, "text-zinc-950") : "text-zinc-400 hover:bg-zinc-200/50 hover:text-zinc-900",
                  FOCUS,
                )}
              >
                <Settings aria-hidden {...ICON} />
              </button>
            </div>
          </div>
        </nav>

        <div className="hidden min-w-0 flex-1 sm:block">
          {children ?? (
            <div key={active} className="household-sidebar-shell-in p-6">
              <p className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">{workspace}</p>
              <h2 className="m-0 mt-1 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{activeLabel}</h2>
              <div aria-hidden className="mt-5 grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
                <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
                <div className="col-span-2 h-44 rounded-xl border border-zinc-200 bg-zinc-50" />
                <div className="col-span-2 h-3 w-2/3 rounded-full bg-zinc-100" />
                <div className="col-span-2 h-3 w-1/2 rounded-full bg-zinc-100" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

HouseholdSidebarShell.displayName = "HouseholdSidebarShell";
