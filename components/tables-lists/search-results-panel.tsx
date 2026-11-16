"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleDot, CornerDownLeft, FileText, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchResultKind = "doc" | "person" | "issue";

export type SearchResultItem = {
  id: string;
  kind: SearchResultKind;
  title: string;
  /** Path, "role · city", or "DL-198 · Open · Platform". */
  meta: string;
};

export type SearchResultsTab = "all" | SearchResultKind;

export type SearchResultsLabels = {
  placeholder?: string;
  searchLabel?: string;
  clear?: string;
  all?: string;
  docs?: string;
  people?: string;
  issues?: string;
  showAll?: string;
  emptyTitle?: string;
  emptyHint?: string;
  results?: string;
  navigate?: string;
  open?: string;
  close?: string;
};

export type SearchResultsPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "onSelect"> & {
  items?: readonly SearchResultItem[];
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  tab?: SearchResultsTab;
  defaultTab?: SearchResultsTab;
  onTabChange?: (tab: SearchResultsTab) => void;
  onSelect?: (item: SearchResultItem) => void;
  /** Pause after the last keystroke before the list updates. */
  debounceMs?: number;
  labels?: SearchResultsLabels;
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const LAYOUT_EASE = [0.22, 1, 0.36, 1] as const;
const GROUP_LIMIT = 3;
const GROUPS: readonly SearchResultKind[] = ["doc", "person", "issue"];
const TABS: readonly SearchResultsTab[] = ["all", "doc", "person", "issue"];

const DEFAULT_ITEMS: readonly SearchResultItem[] = [
  { id: "d1", kind: "doc", title: "Onboarding flow v2", meta: "Docs / Product / Specs" },
  { id: "p1", kind: "person", title: "Hana Ito", meta: "Product designer · Tokyo" },
  { id: "i1", kind: "issue", title: "Billing webhook retries", meta: "DL-198 · Open · Platform" },
  { id: "d2", kind: "doc", title: "Billing settings redesign", meta: "Docs / Design / Billing" },
  { id: "i2", kind: "issue", title: "Toast stacks overlap on Safari", meta: "DL-214 · In progress · Web" },
  { id: "p2", kind: "person", title: "Kenji Arai", meta: "Engineering manager · Osaka" },
  { id: "d3", kind: "doc", title: "Q4 roadmap", meta: "Docs / Planning" },
  { id: "d4", kind: "doc", title: "Launch checklist", meta: "Docs / Marketing" },
  { id: "i3", kind: "issue", title: "Invoice rounding is off by one cent", meta: "DL-207 · Open · Billing" },
  { id: "p3", kind: "person", title: "Mina Okada", meta: "Product lead · Tokyo" },
  { id: "d5", kind: "doc", title: "API rate limits", meta: "Docs / Engineering / Platform" },
  { id: "i4", kind: "issue", title: "Onboarding email is sent twice", meta: "DL-221 · Open · Growth" },
  { id: "p4", kind: "person", title: "Jonas Weber", meta: "Platform engineer · Berlin" },
  { id: "d6", kind: "doc", title: "Brand guide v3", meta: "Docs / Brand" },
  { id: "p5", kind: "person", title: "Priya Raman", meta: "Billing engineer · Singapore" },
  { id: "i5", kind: "issue", title: "Search is slow on large workspaces", meta: "DL-176 · Closed · Platform" },
  { id: "d7", kind: "doc", title: "Pricing page copy", meta: "Docs / Marketing" },
  { id: "d8", kind: "doc", title: "Invoice export format", meta: "Docs / Engineering / Billing" },
  { id: "p6", kind: "person", title: "Ava Brooks", meta: "Growth marketer · London" },
  { id: "i6", kind: "issue", title: "Roadmap export misses archived items", meta: "DL-230 · Open · Planning" },
];

const DEFAULT_LABELS: Required<SearchResultsLabels> = {
  placeholder: "Search docs, people, and issues",
  searchLabel: "Search",
  clear: "Clear search",
  all: "All",
  docs: "Docs",
  people: "People",
  issues: "Issues",
  showAll: "Show all",
  emptyTitle: "No results for",
  emptyHint: "Try a shorter word, or look in another tab.",
  results: "results",
  navigate: "↑↓ Navigate",
  open: "↵ Open",
  close: "Esc Close",
};

/** Same hues as the issue drawer and invoice status: open, in progress, closed. */
const ISSUE_TONE = {
  open: "text-emerald-500",
  progress: "text-amber-500",
  closed: "text-zinc-400",
} as const;

const matchesQuery = (item: SearchResultItem, needle: string) =>
  needle === "" || item.title.toLowerCase().includes(needle) || item.meta.toLowerCase().includes(needle);

function docPath(meta: string) {
  return meta.replace(/^docs\s*\/\s*/i, "");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function issueBits(meta: string) {
  const [id, status = ""] = meta.split("·").map((part) => part.trim());
  const tone = /progress/i.test(status) ? "progress" : /closed/i.test(status) ? "closed" : "open";
  return { id: id || meta, tone } as const;
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>;
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold">{text.slice(at, at + needle.length)}</span>
      {text.slice(at + needle.length)}
    </>
  );
}

export const SearchResultsPanel = React.forwardRef<HTMLDivElement, SearchResultsPanelProps>(
  (
    {
      items = DEFAULT_ITEMS,
      query,
      defaultQuery = "",
      onQueryChange,
      tab,
      defaultTab = "all",
      onTabChange,
      onSelect,
      debounceMs = 140,
      labels,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const uid = React.useId();
    const [ownQuery, setOwnQuery] = React.useState(defaultQuery);
    const [ownTab, setOwnTab] = React.useState<SearchResultsTab>(defaultTab);
    const value = query ?? ownQuery;
    const activeTab = tab ?? ownTab;
    const [needle, setNeedle] = React.useState(value.trim().toLowerCase());
    const [activeIndex, setActiveIndex] = React.useState(0);
    const input = React.useRef<HTMLInputElement>(null);
    const tabButtons = React.useRef<Partial<Record<SearchResultsTab, HTMLButtonElement | null>>>({});
    const rowButtons = React.useRef(new Map<string, HTMLButtonElement>());
    const fromKeys = React.useRef(false);
    const firstOpen = React.useRef(true);
    const stagger = firstOpen.current && !reduced;

    React.useEffect(() => {
      firstOpen.current = false;
    }, []);

    React.useEffect(() => {
      const next = value.trim().toLowerCase();
      if (next === needle) return;
      const timer = window.setTimeout(() => setNeedle(next), debounceMs);
      return () => window.clearTimeout(timer);
    }, [value, needle, debounceMs]);

    const setQuery = (next: string) => {
      if (query === undefined) setOwnQuery(next);
      onQueryChange?.(next);
    };

    const selectTab = (next: SearchResultsTab, focus = false) => {
      if (tab === undefined) setOwnTab(next);
      onTabChange?.(next);
      if (focus) tabButtons.current[next]?.focus();
    };

    const matched = items.filter((item) => matchesQuery(item, needle));
    const countOf = (kind: SearchResultsTab) =>
      kind === "all" ? matched.length : matched.filter((item) => item.kind === kind).length;
    const groups = GROUPS.map((kind) => {
      const all = matched.filter((item) => item.kind === kind);
      return { kind, total: all.length, items: activeTab === "all" ? all.slice(0, GROUP_LIMIT) : all };
    }).filter((group) => (activeTab === "all" ? group.total > 0 : group.kind === activeTab));
    const visible = groups.flatMap((group) => group.items);
    const visibleKey = `${activeTab}|${visible.map((item) => item.id).join("|")}`;
    const [trackedKey, setTrackedKey] = React.useState(visibleKey);
    if (trackedKey !== visibleKey) {
      setTrackedKey(visibleKey);
      setActiveIndex(0);
    }
    const index = visible.length === 0 ? 0 : Math.min(activeIndex, visible.length - 1);
    const active = visible[index];

    React.useEffect(() => {
      if (!fromKeys.current || !active) return;
      fromKeys.current = false;
      rowButtons.current.get(active.id)?.scrollIntoView({ block: "nearest" });
    }, [active, index]);

    const tabLabel: Record<SearchResultsTab, string> = {
      all: text.all,
      doc: text.docs,
      person: text.people,
      issue: text.issues,
    };
    const groupLabel: Record<SearchResultKind, string> = {
      doc: text.docs,
      person: text.people,
      issue: text.issues,
    };

    const onTabKeyDown = (event: React.KeyboardEvent) => {
      const at = TABS.indexOf(activeTab);
      let next: number | null = null;
      if (event.key === "ArrowRight") next = (at + 1) % TABS.length;
      if (event.key === "ArrowLeft") next = (at - 1 + TABS.length) % TABS.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = TABS.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectTab(TABS[next] ?? "all", true);
    };

    const moveActive = (delta: number) => {
      if (visible.length === 0) return;
      fromKeys.current = true;
      setActiveIndex(Math.max(0, Math.min(visible.length - 1, index + delta)));
    };

    const onPanelKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Enter" && event.target === input.current && active) {
        event.preventDefault();
        onSelect?.(active);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        (event.target as HTMLElement).blur();
      }
    };

    const bodyRef = React.useRef<HTMLDivElement>(null);
    const skipHeight = React.useRef(true);
    const [bodyHeight, setBodyHeight] = React.useState<number | null>(null);

    React.useLayoutEffect(() => {
      const node = bodyRef.current;
      if (!node) return;
      const measure = () => {
        const next = node.offsetHeight;
        setBodyHeight((prev) => (prev === next ? prev : next));
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [visibleKey]);

    React.useEffect(() => {
      skipHeight.current = false;
    }, []);

    return (
      <div
        ref={ref}
        data-tsuna-id="search-results-panel"
        data-count={visible.length}
        {...props}
        onKeyDown={(event) => {
          onPanelKeyDown(event);
          onKeyDown?.(event);
        }}
        className={cn(
          "w-[560px] max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
      >
        <div role="search" className="flex h-12 items-center gap-2.5 px-3">
          <Search aria-hidden className="size-4 shrink-0 text-zinc-400" />
          <input
            ref={input}
            type="text"
            role="combobox"
            value={value}
            aria-label={text.searchLabel}
            aria-expanded={visible.length > 0}
            aria-controls={`${uid}-list`}
            aria-activedescendant={active ? `${uid}-opt-${active.id}` : undefined}
            aria-autocomplete="list"
            placeholder={text.placeholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          {value ? (
            <button
              type="button"
              aria-label={text.clear}
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
              className={cn(
                "inline-flex h-5 shrink-0 cursor-pointer items-center justify-center rounded border border-zinc-200 bg-transparent px-1.5 text-zinc-400",
                "hover:text-zinc-900",
                FOCUS,
              )}
            >
              <X aria-hidden className="size-3" />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="inline-flex h-5 shrink-0 items-center rounded border border-zinc-200 px-1.5 text-[11px] leading-none text-zinc-500"
            >
              ⌘K
            </kbd>
          )}
        </div>
        <div aria-hidden className="h-px bg-zinc-100" />

        <div
          role="tablist"
          aria-label={text.searchLabel}
          onKeyDown={onTabKeyDown}
          className="flex border-b border-zinc-100"
        >
          {TABS.map((key) => {
            const selected = key === activeTab;
            return (
              <button
                key={key}
                ref={(node) => {
                  tabButtons.current[key] = node;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${key}`}
                aria-selected={selected}
                aria-controls={`${uid}-list`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(key)}
                className={cn(
                  "relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 text-[13px] font-medium",
                  selected ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800",
                  FOCUS,
                )}
              >
                {tabLabel[key]}
                <span className="text-[12px] font-normal text-zinc-500 tabular-nums">{countOf(key)}</span>
                {selected ? (
                  <motion.span
                    layoutId={`${uid}-underline`}
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px z-10 h-0.5 bg-zinc-900"
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <motion.div
          initial={false}
          animate={bodyHeight === null || reduced ? { height: "auto" } : { height: bodyHeight }}
          transition={
            reduced || skipHeight.current ? { duration: 0 } : { height: { duration: 0.2, ease: LAYOUT_EASE } }
          }
          className="relative overflow-hidden"
          role="listbox"
          id={`${uid}-list`}
          aria-labelledby={`${uid}-tab-${activeTab}`}
        >
          <div ref={bodyRef}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeTab}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.12 }}
            >
              {visible.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="m-0 truncate text-[14px] font-medium text-zinc-900">
                    {text.emptyTitle} “{value.trim()}”
                  </p>
                  <p className="m-0 mt-1 text-[13px] text-zinc-500">{text.emptyHint}</p>
                </div>
              ) : (
                groups.map((group) => (
                  <section key={group.kind} aria-label={groupLabel[group.kind]}>
                    {activeTab === "all" ? (
                      <div className="flex items-center justify-between px-4 pt-2">
                        <span className="text-[11px] font-medium text-zinc-500">{groupLabel[group.kind]}</span>
                        {group.total > GROUP_LIMIT ? (
                          <button
                            type="button"
                            onClick={() => selectTab(group.kind)}
                            className="cursor-pointer border-0 bg-transparent p-0 text-[11px] text-zinc-500 hover:text-zinc-800"
                          >
                            {text.showAll} {group.total}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    <ul className="m-0 list-none px-2">
                      {group.items.map((item) => {
                        const at = visible.indexOf(item);
                        const selected = item.id === active?.id;
                        const issue = item.kind === "issue" ? issueBits(item.meta) : null;
                        return (
                          <li key={item.id}>
                            <motion.div
                              initial={stagger ? { opacity: 0 } : false}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: reduced ? 0 : 0.16,
                                delay: stagger ? at * 0.02 : 0,
                              }}
                            >
                              <button
                                ref={(node) => {
                                  if (node) rowButtons.current.set(item.id, node);
                                  else rowButtons.current.delete(item.id);
                                }}
                                type="button"
                                role="option"
                                id={`${uid}-opt-${item.id}`}
                                aria-selected={selected}
                                tabIndex={-1}
                                onMouseEnter={() => setActiveIndex(at)}
                                onClick={() => onSelect?.(item)}
                                className={cn(
                                  "flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left",
                                  selected && "bg-zinc-50",
                                  FOCUS,
                                )}
                              >
                                {item.kind === "doc" ? (
                                  <FileText aria-hidden className="size-4 shrink-0 text-zinc-400" />
                                ) : null}
                                {item.kind === "person" ? (
                                  <span
                                    aria-hidden
                                    className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-500"
                                  >
                                    {initials(item.title)}
                                  </span>
                                ) : null}
                                {issue ? (
                                  <CircleDot aria-hidden className={cn("size-4 shrink-0", ISSUE_TONE[issue.tone])} />
                                ) : null}
                                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                                  <span className="truncate text-[13px] font-medium text-zinc-900">
                                    <Highlight text={item.title} needle={needle} />
                                  </span>
                                  {item.kind !== "issue" ? (
                                    <span className="truncate text-[12px] text-zinc-500">
                                      {item.kind === "doc" ? docPath(item.meta) : item.meta}
                                    </span>
                                  ) : null}
                                </span>
                                {selected ? (
                                  <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-zinc-400" />
                                ) : null}
                                {issue ? (
                                  <span className="shrink-0 font-mono text-[11px] text-zinc-500">{issue.id}</span>
                                ) : null}
                              </button>
                            </motion.div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex h-9 items-center gap-3 border-t border-zinc-100 px-3 text-[11px] text-zinc-500">
          <span>{text.navigate}</span>
          <span>{text.open}</span>
          <span>{text.close}</span>
        </div>
        <span aria-live="polite" className="sr-only">
          {visible.length} {text.results}
        </span>
      </div>
    );
  },
);

SearchResultsPanel.displayName = "SearchResultsPanel";
