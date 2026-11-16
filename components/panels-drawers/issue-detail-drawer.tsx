"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type IssueStatus = "todo" | "in-progress" | "in-review" | "done";

export type IssueSubtask = {
  id: string;
  label: string;
  done?: boolean;
};

export type IssueItem = {
  id: string;
  /** e.g. "DL-214". */
  key: string;
  title: string;
  status: IssueStatus;
  assignee: string;
  labels?: readonly string[];
  description?: string;
  subtasks?: readonly IssueSubtask[];
};

export type IssueDetailLabels = {
  status?: string;
  assignee?: string;
  labels?: string;
  description?: string;
  subtasks?: string;
  close?: string;
  previous?: string;
  next?: string;
  todo?: string;
  inProgress?: string;
  inReview?: string;
  done?: string;
  issues?: string;
};

export type IssueDetailDrawerProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  issues?: readonly IssueItem[];
  /** Id of the open issue, or null when the drawer is closed. */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null) => void;
  onStatusChange?: (id: string, status: IssueStatus) => void;
  onSubtaskChange?: (issueId: string, subtaskId: string, done: boolean) => void;
  labels?: IssueDetailLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes issue-detail-drawer-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes issue-detail-drawer-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes issue-detail-drawer-in-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes issue-detail-drawer-in-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
@keyframes issue-detail-drawer-out-up { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-70%); } }
@keyframes issue-detail-drawer-out-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(70%); } }
.issue-detail-drawer-in { animation: issue-detail-drawer-in 420ms ${EASE} both; }
.issue-detail-drawer-out { animation: issue-detail-drawer-out 180ms ${EASE} both; }
.issue-detail-drawer-in-up { animation: issue-detail-drawer-in-up 420ms ${EASE} both; }
.issue-detail-drawer-in-down { animation: issue-detail-drawer-in-down 420ms ${EASE} both; }
.issue-detail-drawer-out-up { animation: issue-detail-drawer-out-up 300ms ${EASE} both; }
.issue-detail-drawer-out-down { animation: issue-detail-drawer-out-down 300ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .issue-detail-drawer-in, .issue-detail-drawer-in-up, .issue-detail-drawer-in-down { animation: none; }
  .issue-detail-drawer-out, .issue-detail-drawer-out-up, .issue-detail-drawer-out-down { animation: none; opacity: 0; }
}
`;

const DEFAULT_ISSUES: readonly IssueItem[] = [
  {
    id: "dl-214",
    key: "DL-214",
    title: "Toast stacks overlap on Safari",
    status: "in-progress",
    assignee: "Mina Okada",
    labels: ["Bug", "Web"],
    description:
      "When three or more toasts are open, the older ones slide under the newest instead of stacking above it. Only on Safari 17 and later.",
    subtasks: [
      { id: "s1", label: "Reproduce on Safari 17 and 18", done: true },
      { id: "s2", label: "Replace the transform stack with grid rows", done: true },
      { id: "s3", label: "Check reduced motion" },
      { id: "s4", label: "Add a visual regression test" },
    ],
  },
  {
    id: "dl-207",
    key: "DL-207",
    title: "Invoice rounding is off by one cent",
    status: "todo",
    assignee: "Priya Raman",
    labels: ["Bug", "Billing"],
    description:
      "Totals with three or more taxed lines can differ from the sum of the lines by one cent. Round each line first, then add.",
    subtasks: [
      { id: "s1", label: "Collect failing invoices from support", done: true },
      { id: "s2", label: "Round per line before summing" },
      { id: "s3", label: "Backfill October invoices" },
      { id: "s4", label: "Tell finance about the change" },
    ],
  },
  {
    id: "dl-221",
    key: "DL-221",
    title: "Onboarding email is sent twice",
    status: "in-review",
    assignee: "Ava Brooks",
    labels: ["Growth"],
    description: "New workspaces created from an invite link get the welcome email from both the invite and signup jobs.",
    subtasks: [
      { id: "s1", label: "Find the duplicate trigger", done: true },
      { id: "s2", label: "Add an idempotency key", done: true },
      { id: "s3", label: "Ship behind a flag", done: true },
      { id: "s4", label: "Watch send volume for a week" },
    ],
  },
  {
    id: "dl-198",
    key: "DL-198",
    title: "Billing webhook retries",
    status: "todo",
    assignee: "Jonas Weber",
    labels: ["Platform"],
    description: "Failed webhook deliveries are dropped after one attempt. Retry with backoff for up to 24 hours.",
    subtasks: [
      { id: "s1", label: "Agree on the backoff schedule" },
      { id: "s2", label: "Store attempts per delivery" },
      { id: "s3", label: "Show retries in the dashboard" },
      { id: "s4", label: "Document the new behavior" },
    ],
  },
  {
    id: "dl-230",
    key: "DL-230",
    title: "Roadmap export misses archived items",
    status: "todo",
    assignee: "Kenji Arai",
    labels: ["Planning"],
    description: "CSV exports skip archived roadmap items even when “Include archived” is checked.",
    subtasks: [
      { id: "s1", label: "Pass the flag to the export job" },
      { id: "s2", label: "Add an Archived column" },
      { id: "s3", label: "Cover it with a test" },
      { id: "s4", label: "Update the help article" },
    ],
  },
  {
    id: "dl-176",
    key: "DL-176",
    title: "Search is slow on large workspaces",
    status: "done",
    assignee: "Leila Haddad",
    labels: ["Platform", "Performance"],
    description: "Workspaces with more than 50k documents waited over two seconds for the first result.",
    subtasks: [
      { id: "s1", label: "Profile the slow queries", done: true },
      { id: "s2", label: "Add a prefix index", done: true },
      { id: "s3", label: "Cache the first page", done: true },
      { id: "s4", label: "Roll out to everyone", done: true },
    ],
  },
];

const DEFAULT_LABELS: Required<IssueDetailLabels> = {
  status: "Status",
  assignee: "Assignee",
  labels: "Labels",
  description: "Description",
  subtasks: "Subtasks",
  close: "Close",
  previous: "Previous issue",
  next: "Next issue",
  todo: "Todo",
  inProgress: "In progress",
  inReview: "In review",
  done: "Done",
  issues: "issues",
};

const STATUSES: readonly IssueStatus[] = ["todo", "in-progress", "in-review", "done"];
const DOTS: Record<IssueStatus, string> = {
  todo: "bg-zinc-400",
  "in-progress": "bg-amber-500",
  "in-review": "bg-sky-500",
  done: "bg-emerald-500",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Old digits slide out and new ones slide in. */
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
          className={cn("absolute inset-0 text-center", `issue-detail-drawer-out-${dir}`)}
        >
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={changed ? `issue-detail-drawer-in-${dir}` : undefined}>
        {pair.current}
      </span>
    </span>
  );
}

export const IssueDetailDrawer = React.forwardRef<HTMLDivElement, IssueDetailDrawerProps>(
  (
    {
      title = "Issues",
      issues = DEFAULT_ISSUES,
      openId,
      defaultOpenId = null,
      onOpenChange,
      onStatusChange,
      onSubtaskChange,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const uid = React.useId();
    const [ownOpen, setOwnOpen] = React.useState<string | null>(defaultOpenId);
    const current = openId === undefined ? ownOpen : openId;
    const [statuses, setStatuses] = React.useState<Record<string, IssueStatus>>({});
    const [checks, setChecks] = React.useState<Record<string, boolean>>({});
    /** The issue the drawer shows. It stays while the drawer slides shut. */
    const [view, setView] = React.useState<{ id: string | null; from: string | null; open: boolean }>({
      id: current,
      from: null,
      open: current !== null,
    });
    if (current !== null && (view.id !== current || !view.open)) {
      // Content crossfades only when the drawer is already open.
      setView({ id: current, from: view.open && view.id !== current ? view.id : null, open: true });
    } else if (current === null && view.open) {
      setView({ id: view.id, from: null, open: false });
    }
    const drawer = React.useRef<HTMLDivElement>(null);
    const closeButton = React.useRef<HTMLButtonElement>(null);
    const rows = React.useRef(new Map<string, HTMLButtonElement>());
    const wasOpen = React.useRef(current !== null);
    const lastId = React.useRef<string | null>(current);
    const open = current !== null;

    const statusOf = (issue: IssueItem) => statuses[issue.id] ?? issue.status;
    const isDone = (issue: IssueItem, task: IssueSubtask) => checks[`${issue.id}/${task.id}`] ?? Boolean(task.done);
    const statusLabel: Record<IssueStatus, string> = {
      todo: text.todo,
      "in-progress": text.inProgress,
      "in-review": text.inReview,
      done: text.done,
    };

    // Opening moves focus into the drawer; closing hands it back to the row.
    React.useEffect(() => {
      if (open && !wasOpen.current) closeButton.current?.focus({ preventScroll: true });
      if (!open && wasOpen.current && lastId.current) rows.current.get(lastId.current)?.focus({ preventScroll: true });
      wasOpen.current = open;
      if (current) lastId.current = current;
    }, [open, current]);

    const setOpen = (id: string | null) => {
      if (openId === undefined) setOwnOpen(id);
      onOpenChange?.(id);
    };

    const step = (delta: number) => {
      const at = issues.findIndex((issue) => issue.id === current);
      const next = issues[at + delta];
      if (next) setOpen(next.id);
    };

    const onDrawerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), select, input, [href]"),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const renderIssue = (issue: IssueItem, interactive: boolean) => {
      const tasks = issue.subtasks ?? [];
      const doneCount = tasks.filter((task) => isDone(issue, task)).length;
      const status = statusOf(issue);
      return (
        <div className="px-5 pt-1 pb-5">
          <h3 id={interactive ? `${uid}-title` : undefined} className="m-0 text-[16px] leading-[1.35] font-semibold tracking-[-0.01em] text-zinc-950">
            {issue.title}
          </h3>

          <dl className="m-0 mt-4 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-y-2.5 text-[13px]">
            <dt className="text-zinc-500">{text.status}</dt>
            <dd className="m-0">
              <span className="relative inline-flex h-8 items-center gap-2 rounded-[10px] border border-zinc-200 bg-white pr-2 pl-2.5 font-medium text-zinc-900 transition-colors [transition-duration:180ms] focus-within:ring-2 focus-within:ring-zinc-900/35 focus-within:ring-offset-2 hover:border-zinc-300 motion-reduce:transition-none">
                <span aria-hidden className={cn("size-1.5 rounded-full transition-colors [transition-duration:180ms] motion-reduce:transition-none", DOTS[status])} />
                {statusLabel[status]}
                <ChevronDown aria-hidden className="size-3.5 text-zinc-400" />
                <select
                  value={status}
                  aria-label={text.status}
                  tabIndex={interactive ? 0 : -1}
                  onChange={(event) => {
                    const next = event.target.value as IssueStatus;
                    setStatuses((map) => ({ ...map, [issue.id]: next }));
                    onStatusChange?.(issue.id, next);
                  }}
                  className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {statusLabel[value]}
                    </option>
                  ))}
                </select>
              </span>
            </dd>
            <dt className="text-zinc-500">{text.assignee}</dt>
            <dd className="m-0 flex items-center gap-2 font-medium text-zinc-900">
              <span aria-hidden className="grid size-6 place-items-center rounded-full bg-zinc-100 text-[9.5px] font-semibold text-zinc-600">
                {initials(issue.assignee)}
              </span>
              {issue.assignee}
            </dd>
            <dt className="text-zinc-500">{text.labels}</dt>
            <dd className="m-0 flex flex-wrap gap-1.5">
              {(issue.labels ?? []).map((label) => (
                <span key={label} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[12px] font-medium text-zinc-600">
                  {label}
                </span>
              ))}
            </dd>
          </dl>

          {issue.description ? (
            <>
              <p className="m-0 mt-5 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">{text.description}</p>
              <p className="m-0 mt-1.5 text-[13.5px] leading-[1.6] text-zinc-700">{issue.description}</p>
            </>
          ) : null}

          {tasks.length > 0 ? (
            <>
              <div className="mt-5 flex items-center justify-between">
                <p className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">{text.subtasks}</p>
                <p className="m-0 text-[12.5px] font-medium text-zinc-600 tabular-nums" aria-live={interactive ? "polite" : undefined}>
                  <RollCount value={doneCount} />/{tasks.length}
                </p>
              </div>
              <div
                role="progressbar"
                aria-label={text.subtasks}
                aria-valuemin={0}
                aria-valuemax={tasks.length}
                aria-valuenow={doneCount}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-colors [transition-duration:260ms] motion-reduce:!transition-none",
                    doneCount === tasks.length ? "bg-emerald-500" : "bg-zinc-900",
                  )}
                  style={{
                    width: `${(doneCount / tasks.length) * 100}%`,
                    transition: `width 420ms ${EASE}, background-color 260ms ${EASE}`,
                  }}
                />
              </div>
              <ul className="m-0 mt-2.5 list-none p-0">
                {tasks.map((task) => {
                  const done = isDone(issue, task);
                  const inputId = `${uid}-${issue.id}-${task.id}`;
                  return (
                    <li key={task.id}>
                      <label
                        htmlFor={interactive ? inputId : undefined}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors [transition-duration:180ms] hover:bg-zinc-50 motion-reduce:transition-none"
                      >
                        <span className="relative grid size-[18px] shrink-0 place-items-center">
                          <input
                            id={interactive ? inputId : undefined}
                            type="checkbox"
                            checked={done}
                            tabIndex={interactive ? 0 : -1}
                            onChange={(event) => {
                              setChecks((map) => ({ ...map, [`${issue.id}/${task.id}`]: event.target.checked }));
                              onSubtaskChange?.(issue.id, task.id, event.target.checked);
                            }}
                            className={cn(
                              "peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-md border transition-colors [transition-duration:180ms] motion-reduce:transition-none",
                              done ? "border-zinc-950 bg-zinc-950" : "border-zinc-300 bg-white hover:border-zinc-400",
                              FOCUS,
                            )}
                          />
                          <svg
                            aria-hidden
                            viewBox="0 0 12 12"
                            className="pointer-events-none relative size-3 text-white motion-reduce:!transition-none"
                            style={{
                              opacity: done ? 1 : 0,
                              transform: done ? "scale(1)" : "scale(0.3)",
                              transition: `opacity 180ms ${EASE}, transform 420ms ${SPRING}`,
                            }}
                          >
                            <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span
                          className={cn(
                            "text-[13.5px] transition-colors [transition-duration:180ms] motion-reduce:transition-none",
                            done ? "text-zinc-400 line-through" : "text-zinc-800",
                          )}
                        >
                          {task.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      );
    };

    const shown = issues.find((issue) => issue.id === view.id);
    const leaving = view.from ? issues.find((issue) => issue.id === view.from) : undefined;
    const index = issues.findIndex((issue) => issue.id === current);
    const iconButton = cn(
      "grid size-8 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-zinc-500",
      "transition-[background-color,color,opacity] [transition-duration:180ms] hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none",
      "disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35",
    );

    return (
      <div
        ref={ref}
        data-tsuna-id="issue-detail-drawer"
        data-open={open ? "" : undefined}
        className={cn(
          "relative h-[520px] w-[760px] max-w-full overflow-clip rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div
          className="flex h-full flex-col motion-reduce:!transition-none"
          style={{ opacity: open ? 0.45 : 1, transition: `opacity 260ms ${EASE}` }}
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 px-4 py-3.5 sm:px-5">
            <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
            <p className="m-0 text-[12.5px] text-zinc-400 tabular-nums">
              {issues.length} {text.issues}
            </p>
          </div>
          <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto px-2 py-2 sm:px-3">
            {issues.map((issue) => {
              const status = statusOf(issue);
              const selected = issue.id === current;
              return (
                <li key={issue.id}>
                  <button
                    type="button"
                    ref={(node) => {
                      if (node) rows.current.set(issue.id, node);
                      else rows.current.delete(issue.id);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={selected}
                    tabIndex={open ? -1 : 0}
                    onClick={() => setOpen(issue.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-2 py-2.5 text-left",
                      "transition-colors [transition-duration:180ms] motion-reduce:transition-none",
                      selected ? "bg-zinc-100" : "bg-transparent hover:bg-zinc-50",
                      FOCUS,
                    )}
                  >
                    <span role="img" aria-label={statusLabel[status]} className={cn("size-2 shrink-0 rounded-full", DOTS[status])} />
                    <span className="w-[54px] shrink-0 text-[12.5px] text-zinc-500 tabular-nums">{issue.key}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-zinc-900">{issue.title}</span>
                    <span
                      title={issue.assignee}
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[9.5px] font-semibold text-zinc-600"
                    >
                      <span aria-hidden>{initials(issue.assignee)}</span>
                      <span className="sr-only">{issue.assignee}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          ref={drawer}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${uid}-title`}
          aria-hidden={!open || undefined}
          onKeyDown={onDrawerKeyDown}
          className="absolute top-0 right-0 bottom-0 flex w-full flex-col border-l border-zinc-200 bg-white shadow-[-18px_0_40px_-24px_rgba(15,23,42,0.28)] motion-reduce:!transition-none sm:w-[440px]"
          style={{
            transform: open ? "translateX(0)" : "translateX(100%)",
            visibility: open ? "visible" : "hidden",
            transition: open
              ? `transform 420ms ${EASE}, visibility 0s`
              : `transform 300ms ${EASE}, visibility 0s linear 300ms`,
          }}
        >
          <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 pr-3 pl-5">
            <span key={shown?.id} className="issue-detail-drawer-in text-[12.5px] font-medium text-zinc-500 tabular-nums">
              {shown?.key}
            </span>
            <div className="flex items-center gap-0.5">
              <button type="button" aria-label={text.previous} disabled={index <= 0} onClick={() => step(-1)} className={iconButton}>
                <ChevronUp aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label={text.next}
                disabled={index < 0 || index >= issues.length - 1}
                onClick={() => step(1)}
                className={iconButton}
              >
                <ChevronDown aria-hidden className="size-4" />
              </button>
              <button ref={closeButton} type="button" aria-label={text.close} onClick={() => setOpen(null)} className={iconButton}>
                <X aria-hidden className="size-4" />
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            {leaving && leaving.id !== shown?.id ? (
              <div
                key={`out-${leaving.id}-${shown?.id}`}
                aria-hidden
                className="issue-detail-drawer-out pointer-events-none absolute inset-x-0 top-0"
              >
                {renderIssue(leaving, false)}
              </div>
            ) : null}
            {shown ? (
              <div key={shown.id} className={view.from ? "issue-detail-drawer-in" : undefined}>
                {renderIssue(shown, true)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

IssueDetailDrawer.displayName = "IssueDetailDrawer";
