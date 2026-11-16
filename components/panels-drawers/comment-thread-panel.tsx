"use client";

import * as React from "react";
import { ArrowUp, CircleCheck, MoreHorizontal } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CommentThreadComment = {
  id: string;
  author: string;
  /** Pre-formatted, e.g. "2h ago". */
  time: string;
  text: string;
};

export type CommentThreadLabels = {
  title?: string;
  resolve?: string;
  reopen?: string;
  resolvedBy?: string;
  comments?: string;
  comment?: string;
  reply?: string;
  replyPlaceholder?: string;
  replyLabel?: string;
  justNow?: string;
};

export type CommentThreadPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  /** The passage the thread is attached to. */
  quote?: string;
  /** Where the quote comes from, e.g. "Q4 roadmap · Pricing". */
  source?: string;
  comments?: readonly CommentThreadComment[];
  /** Name used for new replies. */
  currentUser?: string;
  /** Text waiting in the composer. */
  defaultDraft?: string;
  onReply?: (text: string) => void;
  resolved?: boolean;
  defaultResolved?: boolean;
  onResolvedChange?: (resolved: boolean) => void;
  labels?: CommentThreadLabels;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const DEFAULT_COMMENTS: readonly CommentThreadComment[] = [
  { id: "c1", author: "Mina Okada", time: "2h ago", text: "Should we name the Team plan price here, or keep it on the pricing page only?" },
  { id: "c2", author: "Jonas Weber", time: "1h ago", text: "Keep it out. The number changes in December and this doc gets copied around." },
  { id: "c3", author: "Priya Raman", time: "24m ago", text: "Agree with Jonas. Link to the pricing page instead so there is one source." },
];

const DEFAULT_LABELS: Required<CommentThreadLabels> = {
  title: "Comment",
  resolve: "Resolve",
  reopen: "Reopen",
  resolvedBy: "Resolved by you",
  comments: "replies",
  comment: "reply",
  reply: "Reply",
  replyPlaceholder: "Reply…",
  replyLabel: "Write a reply",
  justNow: "Just now",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function fitReply(node: HTMLTextAreaElement | null) {
  if (!node) return;
  node.style.height = "0px";
  const cs = getComputedStyle(node);
  const line = Number.parseFloat(cs.lineHeight) || 20;
  const pad = (Number.parseFloat(cs.paddingTop) || 0) + (Number.parseFloat(cs.paddingBottom) || 0);
  const min = Math.max(28, pad + line);
  const max = pad + line * 4;
  node.style.height = `${Math.min(Math.max(node.scrollHeight, min), max)}px`;
  node.style.overflowY = node.scrollHeight > max + 1 ? "auto" : "hidden";
}

type Entry = CommentThreadComment;

export const CommentThreadPanel = React.forwardRef<HTMLDivElement, CommentThreadPanelProps>(
  (
    {
      quote = "Teams on the new plan get unlimited projects and priority support from day one.",
      source = "Q4 roadmap · Pricing",
      comments = DEFAULT_COMMENTS,
      currentUser = "Ren Takeda",
      defaultDraft = "Makes sense. I’ll swap the number for a link today.",
      onReply,
      resolved,
      defaultResolved = false,
      onResolvedChange,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const uid = React.useId();
    const [entries, setEntries] = React.useState<Entry[]>(() => comments.map((comment) => ({ ...comment })));
    const [draft, setDraft] = React.useState(defaultDraft);
    const [ownResolved, setOwnResolved] = React.useState(defaultResolved);
    const isResolved = resolved ?? ownResolved;
    const [announce, setAnnounce] = React.useState("");
    const resolveButton = React.useRef<HTMLButtonElement>(null);
    const reopenButton = React.useRef<HTMLButtonElement>(null);
    const replyRef = React.useRef<HTMLTextAreaElement>(null);
    const moveFocus = React.useRef(false);
    const counter = React.useRef(0);
    const canSend = draft.trim() !== "";
    const countLabel = `${entries.length} ${entries.length === 1 ? text.comment : text.comments}`;
    const fade = reduced ? { duration: 0 } : { duration: 0.18, ease: EASE };
    const layoutTransition = reduced ? { duration: 0 } : { layout: { duration: 0.18, ease: EASE }, opacity: fade, y: fade };

    React.useEffect(() => {
      if (!moveFocus.current) return;
      moveFocus.current = false;
      (isResolved ? reopenButton : resolveButton).current?.focus({ preventScroll: true });
    }, [isResolved]);

    React.useLayoutEffect(() => {
      if (isResolved) return;
      fitReply(replyRef.current);
    }, [draft, isResolved]);

    const setResolved = (next: boolean) => {
      moveFocus.current = true;
      if (resolved === undefined) setOwnResolved(next);
      onResolvedChange?.(next);
      setAnnounce(next ? text.resolvedBy : text.reopen);
    };

    const submit = (event?: React.FormEvent) => {
      event?.preventDefault();
      const body = draft.trim();
      if (!body) return;
      counter.current += 1;
      setEntries((current) => [
        ...current,
        { id: `reply-${counter.current}`, author: currentUser, time: text.justNow, text: body },
      ]);
      setDraft("");
      setAnnounce(`${text.reply}: ${body}`);
      onReply?.(body);
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="comment-thread-panel"
        data-resolved={isResolved ? "" : undefined}
        className={cn(
          "w-[420px] max-w-full rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <motion.div
          layout={reduced ? false : true}
          transition={layoutTransition}
          className="overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {isResolved ? (
              <motion.div
                key="resolved"
                layout={reduced ? false : true}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
                className="flex h-11 items-center gap-2 px-4"
              >
                <CircleCheck aria-hidden className="size-3.5 shrink-0 text-emerald-500" />
                <p className="m-0 min-w-0 flex-1 truncate text-[13px] text-zinc-500 tabular-nums">
                  <span className="font-medium text-zinc-900">{text.resolvedBy}</span>
                  {" · "}
                  {countLabel}
                </p>
                <button
                  ref={reopenButton}
                  type="button"
                  onClick={() => setResolved(false)}
                  className={cn(
                    "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-md border-0 bg-transparent px-2 text-[13px] font-medium text-zinc-800",
                    "hover:bg-zinc-50",
                    FOCUS,
                  )}
                >
                  {text.reopen}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="open"
                layout={reduced ? false : true}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
              >
                <div className="flex h-11 items-center justify-between gap-2 px-4">
                  <p className="m-0 text-[13px] text-zinc-500 tabular-nums">{countLabel}</p>
                  <button
                    ref={resolveButton}
                    type="button"
                    onClick={() => setResolved(true)}
                    className={cn(
                      "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2 text-[13px] text-zinc-800",
                      "hover:bg-zinc-50",
                      FOCUS,
                    )}
                  >
                    <CircleCheck aria-hidden className="size-3.5 text-zinc-500" />
                    {text.resolve}
                  </button>
                </div>

                <div className="px-4 pb-4">
                  <figure className="m-0">
                    <blockquote className="m-0 border-l-2 border-zinc-200 pl-3 text-[13px] leading-[1.5] text-zinc-700">
                      {quote}
                    </blockquote>
                    {source ? (
                      <figcaption className="mt-2 pl-[14px] text-[12px] text-zinc-400">{source}</figcaption>
                    ) : null}
                  </figure>

                  <ol className="m-0 mt-4 list-none p-0">
                    <AnimatePresence initial={false}>
                      {entries.map((entry, index) => {
                        const hasNext = index < entries.length - 1;
                        return (
                          <motion.li
                            key={entry.id}
                            layout={reduced ? false : true}
                            initial={reduced ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={layoutTransition}
                            className="group flex gap-2"
                          >
                            <div className="relative w-7 shrink-0">
                              <span
                                aria-hidden
                                className="relative z-[1] grid size-7 place-items-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-600"
                              >
                                {initials(entry.author)}
                              </span>
                              {hasNext ? (
                                <span
                                  aria-hidden
                                  className="absolute top-7 bottom-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200"
                                />
                              ) : null}
                            </div>
                            <div className={cn("min-w-0 flex-1", hasNext && "pb-4")}>
                              <div className="relative flex items-baseline gap-1.5 pr-7">
                                <span className="truncate text-[13px] font-semibold text-zinc-900">{entry.author}</span>
                                <span className="shrink-0 text-[12px] text-zinc-400 tabular-nums">{entry.time}</span>
                                <button
                                  type="button"
                                  aria-label="More"
                                  className={cn(
                                    "absolute right-0 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400",
                                    "opacity-0 hover:bg-zinc-50 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
                                    FOCUS,
                                  )}
                                >
                                  <MoreHorizontal aria-hidden className="size-3.5" />
                                </button>
                              </div>
                              <p className="m-0 mt-0.5 text-[13px] leading-[1.5] whitespace-pre-wrap text-zinc-700">{entry.text}</p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ol>
                </div>

                <form onSubmit={submit} className="border-t border-zinc-200 px-4 py-3">
                  <div className="relative">
                    <textarea
                      ref={replyRef}
                      id={`${uid}-reply`}
                      value={draft}
                      rows={1}
                      aria-label={text.replyLabel}
                      placeholder={text.replyPlaceholder}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          submit();
                        }
                      }}
                      className="block min-h-7 w-full resize-none overflow-hidden border-0 bg-transparent py-1 pr-16 text-[13px] leading-[1.5] text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                    <div className="absolute right-0 bottom-0 flex items-center gap-1.5">
                      {canSend ? <span className="text-[11px] text-zinc-400">⌘↵</span> : null}
                      <button
                        type="submit"
                        disabled={!canSend}
                        aria-label={text.reply}
                        className={cn(
                          "grid size-7 place-items-center rounded-full border-0",
                          canSend
                            ? "cursor-pointer bg-zinc-950 text-white hover:bg-zinc-800"
                            : "cursor-default bg-zinc-100 text-zinc-400",
                          FOCUS,
                        )}
                      >
                        <ArrowUp aria-hidden className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <span aria-live="polite" className="sr-only">
          {announce}
        </span>
      </div>
    );
  },
);

CommentThreadPanel.displayName = "CommentThreadPanel";
