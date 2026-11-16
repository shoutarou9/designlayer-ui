"use client";

import * as React from "react";
import { Archive, AtSign, CalendarDays, Eye, FileText, SquareCheck, Undo2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationInboxKind = "mention" | "review" | "assignment" | "share" | "invite";

/** What an inline action resolved to. Rendered as a muted line in place of the buttons. */
export type NotificationInboxResolution = "reviewStarted" | "dismissed" | "taskOpened" | "accepted" | "declined";

export type NotificationInboxItem = {
  id: string;
  /** Picks the icon tile and the inline actions. */
  kind: NotificationInboxKind;
  /** Person or system that triggered it (medium weight). */
  name: string;
  /** Text after the name, e.g. "mentioned you in". */
  action: string;
  /** Object at the end of the sentence (medium weight), e.g. "Q4 roadmap". */
  target?: string;
  /** Pre-formatted, e.g. "2m ago". */
  time: string;
  /** Section override. By default minute/hour times ("2m ago", "1h ago") go under Today, the rest under Earlier. */
  group?: "today" | "earlier";
  unread?: boolean;
  archived?: boolean;
  resolution?: NotificationInboxResolution;
};

export type NotificationInboxTab = "all" | "unread" | "archived";

export type NotificationInboxLabels = {
  all?: string;
  unread?: string;
  archived?: string;
  markAllRead?: string;
  archive?: string;
  restore?: string;
  review?: string;
  dismiss?: string;
  openTask?: string;
  accept?: string;
  decline?: string;
  reviewStarted?: string;
  dismissed?: string;
  taskOpened?: string;
  accepted?: string;
  declined?: string;
  emptyInbox?: string;
  emptyUnread?: string;
  emptyArchived?: string;
  today?: string;
  earlier?: string;
};

export type NotificationInboxPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  items?: readonly NotificationInboxItem[];
  tab?: NotificationInboxTab;
  defaultTab?: NotificationInboxTab;
  onTabChange?: (tab: NotificationInboxTab) => void;
  onItemsChange?: (items: NotificationInboxItem[]) => void;
  /** Fires when an inline action (Review, Dismiss, Open task, Accept, Decline) is pressed. */
  onAction?: (item: NotificationInboxItem, resolution: NotificationInboxResolution) => void;
  labels?: NotificationInboxLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes notification-inbox-panel-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes notification-inbox-panel-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes notification-inbox-panel-in-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes notification-inbox-panel-in-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
@keyframes notification-inbox-panel-out-up { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-70%); } }
@keyframes notification-inbox-panel-out-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(70%); } }
.notification-inbox-panel-fade-in { animation: notification-inbox-panel-fade-in 280ms ${EASE} 60ms both; }
.notification-inbox-panel-fade-out { animation: notification-inbox-panel-fade-out 180ms ${EASE} both; }
.notification-inbox-panel-in-up { animation: notification-inbox-panel-in-up 360ms ${EASE} both; }
.notification-inbox-panel-in-down { animation: notification-inbox-panel-in-down 360ms ${EASE} both; }
.notification-inbox-panel-out-up { animation: notification-inbox-panel-out-up 260ms ${EASE} both; }
.notification-inbox-panel-out-down { animation: notification-inbox-panel-out-down 260ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .notification-inbox-panel-fade-in, .notification-inbox-panel-in-up, .notification-inbox-panel-in-down { animation: none; }
  .notification-inbox-panel-fade-out, .notification-inbox-panel-out-up, .notification-inbox-panel-out-down { animation: none; opacity: 0; }
}
`;

const DEFAULT_ITEMS: readonly NotificationInboxItem[] = [
  { id: "n1", kind: "mention", name: "Mina Okada", action: "mentioned you in", target: "Q4 roadmap", time: "2m ago", unread: true },
  { id: "n2", kind: "review", name: "Theo Lindqvist", action: "requested your review on", target: "Billing settings", time: "18m ago", unread: true },
  { id: "n3", kind: "assignment", name: "Jonas Weber", action: "assigned you", target: "Fix invoice rounding", time: "1h ago", unread: true },
  { id: "n4", kind: "mention", name: "Priya Raman", action: "mentioned you in", target: "Launch checklist", time: "3h ago" },
  { id: "n5", kind: "share", name: "Sora Fujii", action: "shared", target: "Brand guide v3", time: "Yesterday" },
  { id: "n6", kind: "invite", name: "Ava Brooks", action: "invited you to", target: "Design critique", time: "Nov 10", unread: true },
];

const DEFAULT_LABELS: Required<NotificationInboxLabels> = {
  all: "All",
  unread: "Unread",
  archived: "Archived",
  markAllRead: "Mark all as read",
  archive: "Archive",
  restore: "Move to inbox",
  review: "Review",
  dismiss: "Dismiss",
  openTask: "Open task",
  accept: "Accept",
  decline: "Decline",
  reviewStarted: "Review started",
  dismissed: "Dismissed",
  taskOpened: "Task opened",
  accepted: "Accepted",
  declined: "Declined",
  emptyInbox: "You’re all caught up.",
  emptyUnread: "No unread notifications.",
  emptyArchived: "Nothing archived yet.",
  today: "Today",
  earlier: "Earlier",
};

const GROUPS = ["today", "earlier"] as const;

function groupOf(item: NotificationInboxItem): (typeof GROUPS)[number] {
  if (item.group) return item.group;
  return /^\s*(just now|now|\d+\s*(s|sec|secs|m|min|mins|minutes?|h|hr|hrs|hours?)\b)/i.test(item.time)
    ? "today"
    : "earlier";
}

const TABS: readonly NotificationInboxTab[] = ["all", "unread", "archived"];

const KIND_ICON: Record<NotificationInboxKind, LucideIcon> = {
  mention: AtSign,
  review: Eye,
  assignment: SquareCheck,
  share: FileText,
  invite: CalendarDays,
};

type ActionSpec = { resolution: NotificationInboxResolution; label: keyof NotificationInboxLabels; primary?: boolean };

const KIND_ACTIONS: Record<NotificationInboxKind, readonly ActionSpec[]> = {
  mention: [],
  share: [],
  review: [
    { resolution: "reviewStarted", label: "review", primary: true },
    { resolution: "dismissed", label: "dismiss" },
  ],
  assignment: [{ resolution: "taskOpened", label: "openTask" }],
  invite: [
    { resolution: "accepted", label: "accept", primary: true },
    { resolution: "declined", label: "decline" },
  ],
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

/** Old digits slide out and new ones slide in, down when the count drops. */
function RollCount({ value }: { value: number }) {
  const [pair, setPair] = React.useState({ prev: value, current: value });
  if (pair.current !== value) setPair({ prev: pair.current, current: value });
  const changed = pair.prev !== pair.current;
  const dir = pair.current < pair.prev ? "down" : "up";
  return (
    <span className="relative inline-grid overflow-hidden tabular-nums">
      {changed ? (
        <span
          key={`out-${pair.prev}-${pair.current}`}
          aria-hidden
          className={cn("absolute inset-0 text-center", `notification-inbox-panel-out-${dir}`)}
        >
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={changed ? `notification-inbox-panel-in-${dir}` : undefined}>
        {pair.current}
      </span>
    </span>
  );
}

/** Collapses to zero height (grid rows) and fades, so siblings close the gap smoothly. */
function Fold({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden={!open || undefined}
      className={cn("grid motion-reduce:!transition-none", className)}
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transition: `grid-template-rows 300ms ${EASE}, opacity ${open ? 260 : 160}ms ${EASE} ${open ? 80 : 0}ms`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export const NotificationInboxPanel = React.forwardRef<HTMLDivElement, NotificationInboxPanelProps>(
  (
    {
      title = "Inbox",
      items = DEFAULT_ITEMS,
      tab,
      defaultTab = "all",
      onTabChange,
      onItemsChange,
      onAction,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = usePrefersReducedMotion();
    const uid = React.useId();
    const [list, setList] = React.useState<NotificationInboxItem[]>(() => items.map((item) => ({ ...item })));
    const [ownTab, setOwnTab] = React.useState<NotificationInboxTab>(defaultTab);
    const active = tab ?? ownTab;
    const [outgoing, setOutgoing] = React.useState<{ tab: NotificationInboxTab; key: number } | null>(null);
    const [leaving, setLeaving] = React.useState<readonly string[]>([]);
    /** Rows read while the Unread tab is open stay visible until the tab changes. */
    const [readHere, setReadHere] = React.useState<readonly string[]>([]);
    const [announce, setAnnounce] = React.useState("");
    const [line, setLine] = React.useState<{ left: number; width: number } | null>(null);
    const [bodyHeight, setBodyHeight] = React.useState<number | null>(null);
    const [switching, setSwitching] = React.useState(false);
    const track = React.useRef<HTMLDivElement>(null);
    const body = React.useRef<HTMLDivElement>(null);
    const tabButtons = React.useRef<Partial<Record<NotificationInboxTab, HTMLButtonElement | null>>>({});
    const timers = React.useRef<number[]>([]);

    React.useEffect(() => {
      const pending = timers.current;
      return () => pending.forEach((id) => window.clearTimeout(id));
    }, []);

    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const commit = (update: (current: NotificationInboxItem[]) => NotificationInboxItem[]) => {
      setList((current) => {
        const next = update(current);
        onItemsChange?.(next);
        return next;
      });
    };

    const inTab = (item: NotificationInboxItem, which: NotificationInboxTab) => {
      if (which === "archived") return Boolean(item.archived);
      if (item.archived) return false;
      return which === "all" || Boolean(item.unread) || (which === active && readHere.includes(item.id));
    };
    const unreadCount = list.filter((item) => !item.archived && item.unread && !leaving.includes(item.id)).length;
    const rows = list.filter((item) => inTab(item, active));
    const visibleRows = rows.filter((item) => !leaving.includes(item.id));
    const unreadRows = list.filter((item) => !item.archived && item.unread);

    // Underline: measured once per layout, moved with transform only.
    React.useLayoutEffect(() => {
      const node = track.current;
      if (!node) return;
      const measure = () => {
        const button = tabButtons.current[active];
        if (!button) return;
        setLine((prev) =>
          prev && prev.left === button.offsetLeft && prev.width === button.offsetWidth
            ? prev
            : { left: button.offsetLeft, width: button.offsetWidth },
        );
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      Object.values(tabButtons.current).forEach((button) => button && observer.observe(button));
      return () => observer.disconnect();
    }, [active]);

    // Panel body height follows the incoming list; it only animates while a tab switch is running.
    React.useLayoutEffect(() => {
      const node = body.current;
      if (!node) return;
      const measure = () => setBodyHeight(node.offsetHeight);
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [active]);

    const selectTab = (next: NotificationInboxTab, focus = false) => {
      if (focus) tabButtons.current[next]?.focus();
      if (next === active) return;
      if (tab === undefined) setOwnTab(next);
      onTabChange?.(next);
      setReadHere([]);
      if (reduced) return;
      const key = Date.now();
      setOutgoing({ tab: active, key });
      setSwitching(true);
      later(() => setOutgoing((current) => (current?.key === key ? null : current)), 200);
      later(() => setSwitching(false), 360);
    };

    const onTabKeyDown = (event: React.KeyboardEvent) => {
      const index = TABS.indexOf(active);
      let next: number | null = null;
      if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
      if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = TABS.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectTab(TABS[next] ?? "all", true);
    };

    const setRead = (ids: readonly string[], extra?: Partial<NotificationInboxItem>) => {
      if (active === "unread") setReadHere((current) => [...current, ...ids.filter((id) => !current.includes(id))]);
      commit((current) => current.map((item) => (ids.includes(item.id) ? { ...item, unread: false, ...extra } : item)));
    };

    const markRead = (item: NotificationInboxItem) => {
      if (!item.unread) return;
      setRead([item.id]);
    };

    const resolve = (item: NotificationInboxItem, resolution: NotificationInboxResolution) => {
      setRead([item.id], { resolution });
      setAnnounce(text[resolution]);
      onAction?.(item, resolution);
    };

    const markAllRead = () => {
      const ids = unreadRows.map((item) => item.id);
      if (ids.length === 0) return;
      setAnnounce(text.markAllRead);
      if (reduced) return setRead(ids);
      ids.forEach((id, index) => later(() => setRead([id]), index * 40));
    };

    const move = (id: string, archived: boolean) => {
      setAnnounce(archived ? text.archive : text.restore);
      const apply = () => {
        commit((current) => current.map((item) => (item.id === id ? { ...item, archived } : item)));
        setLeaving((current) => current.filter((entry) => entry !== id));
      };
      if (reduced) return apply();
      setLeaving((current) => [...current, id]);
      later(apply, 320);
    };

    const tabLabel: Record<NotificationInboxTab, string> = {
      all: text.all,
      unread: text.unread,
      archived: text.archived,
    };
    const emptyLabel: Record<NotificationInboxTab, string> = {
      all: text.emptyInbox,
      unread: text.emptyUnread,
      archived: text.emptyArchived,
    };

    const renderRow = (item: NotificationInboxItem, interactive: boolean) => {
      const gone = leaving.includes(item.id);
      const focusable = interactive && !gone;
      const Icon = KIND_ICON[item.kind] ?? AtSign;
      const actions = KIND_ACTIONS[item.kind] ?? [];
      const clickable = actions.length === 0;
      const strong = item.unread ? "font-medium text-zinc-900" : "font-normal";
      const sentenceClass = cn(
        "text-[13.5px] leading-[1.45] transition-colors [transition-duration:240ms] motion-reduce:transition-none",
        item.unread ? "text-zinc-600" : "text-zinc-500",
      );
      const sentence = (
        <>
          <span className={strong}>{item.name}</span> {item.action}
          {item.target ? <span className={strong}> {item.target}</span> : null}
        </>
      );
      const tile = (
        <span
          aria-hidden
          className="mt-[3px] grid size-[30px] shrink-0 place-items-center rounded-[8px] bg-zinc-100 text-zinc-600"
        >
          <Icon aria-hidden className="size-[15px]" strokeWidth={1.5} />
        </span>
      );
      const meta = (
        <span className="mt-1 block text-[12px] leading-[1.4] text-zinc-400 tabular-nums">
          {item.time}
          {item.unread ? <span className="sr-only">, {text.unread}</span> : null}
        </span>
      );

      return (
        <li key={item.id}>
          <Fold open={!gone}>
            <div className="group relative rounded-[10px] transition-colors [transition-duration:180ms] hover:bg-zinc-100/60 motion-reduce:transition-none">
              {clickable ? (
                <button
                  type="button"
                  tabIndex={focusable ? 0 : -1}
                  onClick={() => markRead(item)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-[10px] border-0 bg-transparent py-3 pr-11 pl-3 text-left [@media(hover:none)]:pr-16",
                    FOCUS,
                  )}
                >
                  {tile}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block", sentenceClass)}>{sentence}</span>
                    {meta}
                  </span>
                </button>
              ) : (
                <div className="flex items-start gap-3 py-3 pr-11 pl-3 [@media(hover:none)]:pr-16">
                  {tile}
                  <div className="min-w-0 flex-1">
                    <p className={cn("m-0", sentenceClass)}>{sentence}</p>
                    {meta}
                    <Fold open={!item.resolution}>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {actions.map((spec) => (
                          <button
                            key={spec.resolution}
                            type="button"
                            tabIndex={focusable && !item.resolution ? 0 : -1}
                            onClick={() => resolve(item, spec.resolution)}
                            className={cn(
                              "inline-flex h-7 cursor-pointer items-center rounded-[8px] border border-solid px-3 text-[12.5px] font-medium",
                              "transition-[background-color,opacity] [transition-duration:160ms] motion-reduce:transition-none",
                              spec.primary
                                ? "border-transparent bg-zinc-900/90 text-white hover:bg-zinc-900"
                                : "border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-100",
                              FOCUS,
                            )}
                          >
                            {text[spec.label]}
                          </button>
                        ))}
                      </div>
                    </Fold>
                    <Fold open={Boolean(item.resolution)}>
                      <p className="m-0 pt-1.5 text-[12px] leading-[1.4] text-zinc-400">
                        {item.resolution ? text[item.resolution] : null}
                      </p>
                    </Fold>
                  </div>
                </div>
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-4 -mt-[3px] transition-opacity [transition-duration:160ms] group-hover:opacity-0 motion-reduce:transition-none [@media(hover:none)]:right-12 [@media(hover:none)]:group-hover:opacity-100"
              >
                <span
                  className="block size-1.5 rounded-full bg-sky-500 motion-reduce:!transition-none"
                  style={{
                    opacity: item.unread ? 1 : 0,
                    transform: item.unread ? "scale(1)" : "scale(0.2)",
                    transition: `opacity 240ms ${EASE}, transform 240ms ${EASE}`,
                  }}
                />
              </span>
              <button
                type="button"
                aria-label={`${item.archived ? text.restore : text.archive}: ${item.name}`}
                title={item.archived ? text.restore : text.archive}
                tabIndex={focusable ? 0 : -1}
                onClick={() => move(item.id, !item.archived)}
                className={cn(
                  "absolute top-1/2 right-2 -mt-4 grid size-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent text-zinc-400",
                  "opacity-0 transition-[background-color,color,opacity] [transition-duration:160ms] motion-reduce:transition-none",
                  "group-hover:opacity-100 focus-visible:opacity-100 hover:bg-zinc-200/70 hover:text-zinc-900 [@media(hover:none)]:opacity-100",
                  FOCUS,
                )}
              >
                {item.archived ? <Undo2 aria-hidden className="size-4" /> : <Archive aria-hidden className="size-4" />}
              </button>
            </div>
          </Fold>
        </li>
      );
    };

    const renderGroups = (source: readonly NotificationInboxItem[], interactive: boolean) => {
      const sections = GROUPS.map((key) => {
        const members = source.filter((item) => groupOf(item) === key);
        return { key, members, shown: members.some((item) => !leaving.includes(item.id)) };
      }).filter((section) => section.members.length > 0);
      const firstShown = sections.find((section) => section.shown)?.key;
      return sections.map((section) => (
        <section key={section.key}>
          <Fold open={section.shown}>
            <p
              className={cn(
                "m-0 px-3 pb-1.5 text-[11px] leading-[1.3] font-medium tracking-[0.06em] text-zinc-400 uppercase",
                section.key === firstShown ? "pt-3" : "pt-4",
              )}
            >
              {text[section.key]}
            </p>
          </Fold>
          <ul className="m-0 list-none p-0">{section.members.map((item) => renderRow(item, interactive))}</ul>
        </section>
      ));
    };

    const outgoingRows = outgoing ? list.filter((item) => inTab(item, outgoing.tab)) : [];

    return (
      <div
        ref={ref}
        data-tsuna-id="notification-inbox-panel"
        data-tab={active}
        className={cn(
          "relative w-[440px] max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex h-8 items-center px-5 mt-4">
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
        </div>

        <div className="mt-1.5 flex items-end justify-between gap-3 border-b border-zinc-200 px-5">
          <div
            ref={track}
            role="tablist"
            aria-label={title}
            onKeyDown={onTabKeyDown}
            className="relative flex min-w-0 items-center gap-5 max-[380px]:gap-4"
          >
            {TABS.map((key) => {
              const selected = key === active;
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
                  aria-controls={`${uid}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(key)}
                  className={cn(
                    "relative inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[6px] border-0 bg-transparent px-0 text-[13px] font-medium whitespace-nowrap",
                    "transition-colors [transition-duration:160ms] motion-reduce:transition-none",
                    selected ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
                    FOCUS,
                  )}
                >
                  {tabLabel[key]}
                  {key === "unread" ? (
                    <span
                      className={cn(
                        "inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-zinc-100 px-1.5 text-[11px]",
                        selected ? "text-zinc-700" : "text-zinc-500",
                      )}
                    >
                      <RollCount value={unreadCount} />
                    </span>
                  ) : null}
                </button>
              );
            })}
            {line ? (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-[-1px] left-0 h-[2px] w-px origin-left bg-current text-zinc-950 motion-reduce:!transition-none"
                style={{
                  transform: `translateX(${line.left}px) scaleX(${line.width})`,
                  transition: `transform 360ms ${EASE}`,
                }}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadRows.length === 0}
            className={cn(
              "mb-1 inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-1.5 -mr-1.5 text-[12.5px] font-medium whitespace-nowrap text-zinc-500",
              "transition-[color,opacity] [transition-duration:160ms] hover:text-zinc-900 motion-reduce:transition-none",
              "disabled:cursor-default disabled:opacity-40 disabled:hover:text-zinc-500",
              FOCUS,
            )}
          >
            {text.markAllRead}
          </button>
        </div>

        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${active}`}
          className="relative overflow-hidden motion-reduce:!transition-none"
          style={{
            height: bodyHeight ?? undefined,
            transition: switching ? `height 340ms ${EASE}` : "none",
          }}
        >
          {outgoing ? (
            <div
              key={`out-${outgoing.key}`}
              aria-hidden
              inert
              className="notification-inbox-panel-fade-out pointer-events-none absolute inset-x-0 top-0 px-2 pb-2"
            >
              {renderGroups(outgoingRows, false)}
            </div>
          ) : null}
          <div
            ref={body}
            key={active}
            className={cn("px-2 pb-2", outgoing && "notification-inbox-panel-fade-in")}
          >
            {renderGroups(rows, true)}
            <Fold open={visibleRows.length === 0}>
              <p className="m-0 px-2 py-10 text-center text-[13px] text-zinc-400">{emptyLabel[active]}</p>
            </Fold>
          </div>
        </div>

        <span aria-live="polite" className="sr-only">
          {announce}
        </span>
      </div>
    );
  },
);

NotificationInboxPanel.displayName = "NotificationInboxPanel";
