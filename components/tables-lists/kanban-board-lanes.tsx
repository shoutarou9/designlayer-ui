"use client";

import * as React from "react";
import {
  Calendar,
  Check,
  Circle,
  CircleCheck,
  CircleDashed,
  Ellipsis,
  Flag,
  MessageSquare,
  Paperclip,
  Plus,
} from "lucide-react";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export type KanbanCard = {
  id: string;
  title: string;
  /** Tag shown as muted text under the title, e.g. "Design". */
  label: string;
  /** Assignee name. Initials are shown. */
  assignee: string;
  /** Pre-formatted due date, e.g. "Nov 18". Shown as "Today" when it matches today's date. Empty hides it. */
  due: string;
  /** Flag color. Defaults to "normal". "none" hides the flag. */
  priority?: "urgent" | "high" | "normal" | "low" | "none";
  /** Attachment count. */
  attachments?: number;
  /** Comment count. */
  comments?: number;
};

export type KanbanLane = {
  id: string;
  title: string;
  /** Status icon beside the title. */
  tone?: "neutral" | "pending" | "success";
  cards: readonly KanbanCard[];
};

export type KanbanBoardLabels = {
  moved?: string;
  empty?: string;
  today?: string;
  more?: string;
  add?: string;
  addTask?: string;
  newTask?: string;
  taskTitle?: string;
  tag?: string;
  addDate?: string;
  date?: string;
  priority?: string;
  priorityNone?: string;
  priorityLow?: string;
  priorityMedium?: string;
  priorityHigh?: string;
  cancel?: string;
  submit?: string;
  added?: string;
  picked?: string;
  dropped?: string;
  cancelled?: string;
  instructions?: string;
};

export type KanbanBoardLanesProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  lanes?: readonly KanbanLane[];
  onMove?: (cardId: string, fromLaneId: string, toLaneId: string, toIndex: number) => void;
  onLanesChange?: (lanes: KanbanLane[]) => void;
  /** Called after a task is added from a column's composer. */
  onAddCard?: (laneId: string, card: KanbanCard) => void;
  /** Assignee for tasks added from the composer. Initials are shown. */
  currentUser?: string;
  onLaneMenu?: (laneId: string) => void;
  labels?: KanbanBoardLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = { type: "spring", stiffness: 500, damping: 38 } as const;
const INSTANT = { duration: 0 } as const;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const CARD_HOVER =
  "transition-[box-shadow,border-color] [transition-duration:120ms] hover:border-zinc-400/50 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05)] motion-reduce:transition-none";
const LIFT_SHADOW = "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]";

const CSS = `
@keyframes kanban-board-lanes-in-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes kanban-board-lanes-in-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
@keyframes kanban-board-lanes-out-up { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-70%); } }
@keyframes kanban-board-lanes-out-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(70%); } }
.kanban-board-lanes-in-up { animation: kanban-board-lanes-in-up 420ms ${EASE} both; }
.kanban-board-lanes-in-down { animation: kanban-board-lanes-in-down 420ms ${EASE} both; }
.kanban-board-lanes-out-up { animation: kanban-board-lanes-out-up 300ms ${EASE} both; }
.kanban-board-lanes-out-down { animation: kanban-board-lanes-out-down 300ms ${EASE} both; }
.kanban-board-lanes-scroller { container-type: inline-size; }
.kanban-board-lanes-grid { display: grid; grid-auto-flow: column; grid-auto-columns: 260px; gap: 12px; align-items: start; width: max-content; }
@container (min-width: 720px) {
  .kanban-board-lanes-grid { grid-auto-flow: row; grid-auto-columns: auto; grid-template-columns: repeat(var(--kanban-lanes, 3), minmax(0, 1fr)); width: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .kanban-board-lanes-in-up, .kanban-board-lanes-in-down { animation: none; }
  .kanban-board-lanes-out-up, .kanban-board-lanes-out-down { animation: none; opacity: 0; }
}
`;

const DEFAULT_LANES: readonly KanbanLane[] = [
  {
    id: "todo",
    title: "Todo",
    tone: "neutral",
    cards: [
      { id: "k1", title: "Fix invoice rounding", label: "Billing", assignee: "Kenji Arai", due: "Nov 18", priority: "urgent", attachments: 2, comments: 4 },
      { id: "k2", title: "Empty state for reports", label: "Design", assignee: "Mina Okada", due: "Nov 20", priority: "high", attachments: 3, comments: 1 },
      { id: "k3", title: "Rate-limit the public API", label: "Platform", assignee: "Jonas Weber", due: "Nov 21", priority: "normal", attachments: 1, comments: 2 },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    tone: "pending",
    cards: [
      { id: "k4", title: "Webhook retry policy", label: "Platform", assignee: "Priya Raman", due: "Nov 17", priority: "high", attachments: 2, comments: 6 },
      { id: "k5", title: "Onboarding checklist copy", label: "Growth", assignee: "Ava Brooks", due: "Nov 19", priority: "normal", attachments: 1, comments: 3 },
    ],
  },
  {
    id: "done",
    title: "Done",
    tone: "success",
    cards: [
      { id: "k6", title: "SSO sign-in for teams", label: "Auth", assignee: "Leila Haddad", due: "Nov 12", priority: "normal", attachments: 4, comments: 5 },
      { id: "k7", title: "Move avatars to the CDN", label: "Infra", assignee: "Tomás Rivera", due: "Nov 11", priority: "low", attachments: 1, comments: 2 },
    ],
  },
];

const DEFAULT_LABELS: Required<KanbanBoardLabels> = {
  moved: "Moved to",
  empty: "No cards",
  today: "Today",
  more: "More actions",
  add: "Add card",
  addTask: "Add task",
  newTask: "New task in",
  taskTitle: "Task title",
  tag: "Tag",
  addDate: "Add date",
  date: "Due date",
  priority: "Priority",
  priorityNone: "None",
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  cancel: "Cancel",
  submit: "Add",
  added: "Added to",
  picked: "Picked up",
  dropped: "Dropped in",
  cancelled: "Move cancelled",
  instructions: "Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.",
};

const STATUS = {
  neutral: { Icon: Circle, color: "text-zinc-400" },
  pending: { Icon: CircleDashed, color: "text-amber-500" },
  success: { Icon: CircleCheck, color: "text-emerald-500" },
} as const;

const PRIORITY = {
  urgent: "text-red-600",
  high: "text-amber-500",
  normal: "text-emerald-500",
  low: "text-zinc-400",
  none: "text-zinc-400",
} as const;

const ENTER_SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;
const TITLE_MAX_HEIGHT = 54; // 3 lines x 18px

type DraftPriority = "none" | "low" | "medium" | "high";
type Draft = { title: string; tag: string; date: string; priority: DraftPriority };
const EMPTY_DRAFT: Draft = { title: "", tag: "", date: "", priority: "none" };
const DRAFT_ORDER: readonly DraftPriority[] = ["none", "low", "medium", "high"];
/** Composer levels map onto the card's flag scale (existing colors). */
const DRAFT_TO_CARD = { none: "none", low: "normal", medium: "high", high: "urgent" } as const;

type Board = KanbanLane[];
type Point = { x: number; y: number };

type PointerDrag = {
  card: KanbanCard;
  fromLaneId: string;
  fromIndex: number;
  toLaneId: string;
  toIndex: number;
  width: number;
  height: number;
  phase: "dragging" | "dropping";
  cancelled: boolean;
};

type KeyboardDrag = { cardId: string; snapshot: Board };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function cloneLanes(lanes: readonly KanbanLane[]): Board {
  return lanes.map((lane) => ({ ...lane, cards: [...lane.cards] }));
}

function locate(board: Board, cardId: string) {
  for (let laneIndex = 0; laneIndex < board.length; laneIndex += 1) {
    const index = board[laneIndex].cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { laneIndex, index };
  }
  return null;
}

function moveCard(board: Board, cardId: string, toLaneId: string, toIndex: number): Board {
  const from = locate(board, cardId);
  if (!from) return board;
  const card = board[from.laneIndex].cards[from.index];
  const stripped = board.map((lane, i) =>
    i === from.laneIndex ? { ...lane, cards: lane.cards.filter((entry) => entry.id !== cardId) } : lane,
  );
  return stripped.map((lane) => {
    if (lane.id !== toLaneId) return lane;
    const cards = [...lane.cards];
    cards.splice(Math.max(0, Math.min(toIndex, cards.length)), 0, card);
    return { ...lane, cards };
  });
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

/** "Nov 14"-style label for today, set after mount so server and client markup match. */
function useTodayLabel() {
  const [label, setLabel] = React.useState<string | null>(null);
  React.useEffect(() => {
    setLabel(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }, []);
  return label;
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
          className={cn("absolute inset-0 text-center", `kanban-board-lanes-out-${dir}`)}
        >
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={changed ? `kanban-board-lanes-in-${dir}` : undefined}>
        {pair.current}
      </span>
    </span>
  );
}

function MetaItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11px] leading-none text-zinc-500 tabular-nums", className)}>
      {children}
    </span>
  );
}

function CardBody({
  card,
  today,
  todayText,
  done = false,
}: {
  card: KanbanCard;
  today: string | null;
  todayText: string;
  done?: boolean;
}) {
  const isToday = today !== null && card.due === today;
  const DateIcon = done ? Check : Calendar;
  const attachments = card.attachments ?? 0;
  const comments = card.comments ?? 0;
  return (
    <>
      <p className={cn("m-0 line-clamp-2 text-[13px] leading-[1.35] font-medium whitespace-pre-line", done ? "text-zinc-500" : "text-zinc-900")}>
        {card.title}
      </p>
      {card.label ? <p className="m-0 mt-0.5 text-[12px] leading-[1.4] text-zinc-500">{card.label}</p> : null}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          {card.priority !== "none" ? (
            <>
              <Flag aria-hidden className={cn("size-3 shrink-0", PRIORITY[card.priority ?? "normal"])} />
              <span className="sr-only">{card.priority ?? "normal"}</span>
            </>
          ) : null}
          {card.due ? (
            <MetaItem className={isToday ? "text-red-600" : undefined}>
              <DateIcon aria-hidden className={cn("size-3", isToday ? "text-red-600" : "text-zinc-400")} />
              {isToday ? todayText : card.due}
            </MetaItem>
          ) : null}
          {attachments > 0 ? (
            <MetaItem>
              <Paperclip aria-hidden className="size-3 text-zinc-400" />
              {attachments}
            </MetaItem>
          ) : null}
          {comments > 0 ? (
            <MetaItem>
              <MessageSquare aria-hidden className="size-3 text-zinc-400" />
              {comments}
            </MetaItem>
          ) : null}
        </div>
        <span
          title={card.assignee}
          className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-[8.5px] font-semibold text-zinc-600 ring-1 ring-zinc-200"
        >
          <span aria-hidden>{initials(card.assignee)}</span>
          <span className="sr-only">{card.assignee}</span>
        </span>
      </div>
    </>
  );
}

function formatDraftDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ComposerProps = {
  laneTitle: string;
  draft: Draft;
  onDraft: (draft: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  text: Required<KanbanBoardLabels>;
  formRef: React.Ref<HTMLFormElement>;
};

function TaskComposer({ laneTitle, draft, onDraft, onSubmit, onCancel, text, formRef }: ComposerProps) {
  const uid = React.useId();
  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);
  const canSubmit = draft.title.trim().length > 0;
  const dateLabel = draft.date ? formatDraftDate(draft.date) : "";
  const priorityNames: Record<DraftPriority, string> = {
    none: text.priorityNone,
    low: text.priorityLow,
    medium: text.priorityMedium,
    high: text.priorityHigh,
  };

  React.useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  React.useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TITLE_MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > TITLE_MAX_HEIGHT ? "auto" : "hidden";
  }, [draft.title]);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit();
    titleRef.current?.focus({ preventScroll: true });
  };

  const openDate = () => {
    const el = dateRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  const cyclePriority = () => {
    const next = DRAFT_ORDER[(DRAFT_ORDER.indexOf(draft.priority) + 1) % DRAFT_ORDER.length];
    onDraft({ ...draft, priority: next });
  };

  const smallButton =
    "inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[12px] text-zinc-500 transition-colors [transition-duration:120ms] hover:bg-zinc-100 motion-reduce:transition-none";

  return (
    <form
      ref={formRef}
      aria-label={`${text.newTask} ${laneTitle}`}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
      className="rounded-[10px] border border-zinc-200 bg-white p-2.5 transition-colors [transition-duration:120ms] focus-within:border-zinc-400/50 motion-reduce:transition-none"
    >
      <label htmlFor={`${uid}-title`} className="sr-only">
        {text.taskTitle}
      </label>
      <textarea
        ref={titleRef}
        id={`${uid}-title`}
        rows={1}
        value={draft.title}
        placeholder={text.taskTitle}
        onChange={(event) => onDraft({ ...draft, title: event.target.value })}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
          event.preventDefault();
          submit();
        }}
        className="block w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-[18px] font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-1">
        <label htmlFor={`${uid}-tag`} className="sr-only">
          {text.tag}
        </label>
        <input
          id={`${uid}-tag`}
          value={draft.tag}
          placeholder={text.tag}
          onChange={(event) => onDraft({ ...draft, tag: event.target.value })}
          className="h-6 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[12px] text-zinc-500 placeholder:text-zinc-400 focus:outline-none focus-visible:bg-zinc-100"
        />
        <span className="relative inline-flex">
          <button
            type="button"
            onClick={openDate}
            aria-label={`${text.date}: ${dateLabel || text.addDate}`}
            className={cn(smallButton, FOCUS)}
          >
            <Calendar aria-hidden className="size-3 text-zinc-400" />
            {dateLabel || text.addDate}
          </button>
          <input
            ref={dateRef}
            type="date"
            tabIndex={-1}
            aria-hidden
            value={draft.date}
            onChange={(event) => onDraft({ ...draft, date: event.target.value })}
            className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
          />
        </span>
        <button
          type="button"
          onClick={cyclePriority}
          aria-label={`${text.priority}: ${priorityNames[draft.priority]}`}
          title={`${text.priority}: ${priorityNames[draft.priority]}`}
          className={cn(smallButton, FOCUS)}
        >
          <Flag aria-hidden className={cn("size-3", PRIORITY[DRAFT_TO_CARD[draft.priority]])} />
        </button>
      </div>
      <div className="mt-2.5 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "h-7 cursor-pointer rounded-md px-2.5 text-[12px] font-medium text-zinc-600 transition-colors [transition-duration:120ms] hover:bg-zinc-100 motion-reduce:transition-none",
            FOCUS,
          )}
        >
          {text.cancel}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "h-7 cursor-pointer rounded-md bg-zinc-950 px-3 text-[12px] font-medium text-white transition-opacity [transition-duration:120ms] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
            FOCUS,
          )}
        >
          {text.submit}
        </button>
      </div>
    </form>
  );
}

type Item = { kind: "card"; card: KanbanCard } | { kind: "placeholder" };

export const KanbanBoardLanes = React.forwardRef<HTMLDivElement, KanbanBoardLanesProps>(
  (
    {
      title = "Sprint 24",
      lanes = DEFAULT_LANES,
      onMove,
      onLanesChange,
      onAddCard,
      onLaneMenu,
      currentUser = "You",
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = usePrefersReducedMotion();
    const today = useTodayLabel();
    const groupId = React.useId();
    const instructionsId = `${groupId}-kanban-instructions`;
    const localRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const [board, setBoard] = React.useState<Board>(() => cloneLanes(lanes));
    const [drag, setDrag] = React.useState<PointerDrag | null>(null);
    const [kbd, setKbd] = React.useState<KeyboardDrag | null>(null);
    const [announce, setAnnounce] = React.useState("");
    const [composerLane, setComposerLane] = React.useState<string | null>(null);
    const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
    const draftRef = React.useRef(draft);
    draftRef.current = draft;
    const composerForm = React.useRef<HTMLFormElement | null>(null);
    const addRowEls = React.useRef(new Map<string, HTMLButtonElement>());
    const addRowFocus = React.useRef<string | null>(null);
    const newIds = React.useRef(new Set<string>());
    const nextNewId = React.useRef(0);

    const boardRef = React.useRef(board);
    boardRef.current = board;
    const dragRef = React.useRef(drag);
    dragRef.current = drag;

    const laneEls = React.useRef(new Map<string, HTMLElement>());
    const listEls = React.useRef(new Map<string, HTMLUListElement>());
    const cardEls = React.useRef(new Map<string, HTMLElement>());
    const placeholderEl = React.useRef<HTMLLIElement | null>(null);
    const focusId = React.useRef<string | null>(null);
    const grab = React.useRef<{ offset: Point } | null>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useMotionValue(0);
    const scale = useMotionValue(1);

    const transition = reduced ? INSTANT : SPRING;

    /** Root-local, unscaled coordinates (the preview may be CSS-scaled). */
    const toLocal = React.useCallback((clientX: number, clientY: number): Point => {
      const root = localRef.current;
      if (!root) return { x: clientX, y: clientY };
      const rect = root.getBoundingClientRect();
      const ratio = root.offsetWidth > 0 ? rect.width / root.offsetWidth || 1 : 1;
      return { x: (clientX - rect.left) / ratio - root.clientLeft, y: (clientY - rect.top) / ratio - root.clientTop };
    }, []);

    const getRatio = React.useCallback(() => {
      const root = localRef.current;
      if (!root || root.offsetWidth === 0) return 1;
      return root.getBoundingClientRect().width / root.offsetWidth || 1;
    }, []);

    const commit = React.useCallback(
      (cardId: string, fromLaneId: string, toLaneId: string, toIndex: number, fromIndex: number) => {
        const current = boardRef.current;
        if (fromLaneId === toLaneId && fromIndex === toIndex) return;
        const next = moveCard(current, cardId, toLaneId, toIndex);
        const card = current.flatMap((lane) => lane.cards).find((entry) => entry.id === cardId);
        const target = next.find((lane) => lane.id === toLaneId);
        setBoard(next);
        if (card && target) setAnnounce(`${card.title}: ${text.moved} ${target.title}`);
        onMove?.(cardId, fromLaneId, toLaneId, toIndex);
        onLanesChange?.(next);
      },
      [onLanesChange, onMove, text.moved],
    );

    // ---------- Pointer drag ----------

    const hitTest = React.useCallback(
      (clientX: number, clientY: number, current: PointerDrag) => {
        let laneId = current.toLaneId;
        let best = Infinity;
        laneEls.current.forEach((node, id) => {
          const rect = node.getBoundingClientRect();
          const distance = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
          if (distance < best) {
            best = distance;
            laneId = id;
          }
        });
        const list = listEls.current.get(laneId);
        if (!list) return { laneId, index: 0 };
        const ratio = getRatio();
        const localY = (clientY - list.getBoundingClientRect().top) / ratio;
        let index = 0;
        list.querySelectorAll<HTMLElement>("[data-kanban-card]").forEach((node) => {
          if (node.offsetTop + node.offsetHeight / 2 < localY) index += 1;
        });
        return { laneId, index };
      },
      [getRatio],
    );

    const startPointerDrag = (event: React.PointerEvent<HTMLElement>, card: KanbanCard, laneId: string, index: number) => {
      if (event.button !== 0 || kbd || drag) return;
      if ((event.target as HTMLElement).closest("button")) return;
      const node = event.currentTarget;
      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;

      const begin = (clientX: number, clientY: number) => {
        const rect = node.getBoundingClientRect();
        const ratio = getRatio();
        const topLeft = toLocal(rect.left, rect.top);
        grab.current = { offset: { x: (startX - rect.left) / ratio, y: (startY - rect.top) / ratio } };
        x.set(topLeft.x);
        y.set(topLeft.y);
        rotate.set(0);
        scale.set(1);
        setDrag({
          card,
          fromLaneId: laneId,
          fromIndex: index,
          toLaneId: laneId,
          toIndex: index,
          width: node.offsetWidth,
          height: node.offsetHeight,
          phase: "dragging",
          cancelled: false,
        });
        follow(clientX, clientY);
      };

      const follow = (clientX: number, clientY: number) => {
        const offset = grab.current?.offset;
        if (!offset) return;
        const point = toLocal(clientX, clientY);
        x.set(point.x - offset.x);
        y.set(point.y - offset.y);
        const scroller = scrollerRef.current;
        if (scroller) {
          const rect = scroller.getBoundingClientRect();
          if (clientX > rect.right - 40) scroller.scrollLeft += 12;
          else if (clientX < rect.left + 40) scroller.scrollLeft -= 12;
        }
        const current = dragRef.current;
        if (!current || current.phase !== "dragging") return;
        const hit = hitTest(clientX, clientY, current);
        if (hit.laneId !== current.toLaneId || hit.index !== current.toIndex) {
          setDrag({ ...current, toLaneId: hit.laneId, toIndex: hit.index });
        }
      };

      let started = false;
      const onMovePointer = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        if (!started) {
          if (Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return;
          started = true;
          begin(e.clientX, e.clientY);
          return;
        }
        e.preventDefault();
        follow(e.clientX, e.clientY);
      };
      const finish = (cancelled: boolean) => {
        window.removeEventListener("pointermove", onMovePointer);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKey, true);
        if (!started) return;
        const current = dragRef.current;
        if (!current) return;
        setDrag({
          ...current,
          phase: "dropping",
          cancelled,
          ...(cancelled ? { toLaneId: current.fromLaneId, toIndex: current.fromIndex } : null),
        });
      };
      const onUp = (e: PointerEvent) => e.pointerId === pointerId && finish(false);
      const onCancel = (e: PointerEvent) => e.pointerId === pointerId && finish(true);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape" && started) {
          e.preventDefault();
          e.stopPropagation();
          finish(true);
        }
      };
      window.addEventListener("pointermove", onMovePointer, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKey, true);
    };

    // Lift on pickup.
    const dragging = drag?.phase === "dragging";
    React.useEffect(() => {
      if (!dragging || reduced) return;
      const a = animate(rotate, 2, SPRING);
      const b = animate(scale, 1.02, SPRING);
      return () => {
        a.stop();
        b.stop();
      };
    }, [dragging, reduced, rotate, scale]);

    // Settle into the placeholder, then commit.
    const dropping = drag?.phase === "dropping";
    React.useLayoutEffect(() => {
      if (!dropping) return;
      const current = dragRef.current;
      const ph = placeholderEl.current;
      const list = current ? listEls.current.get(current.toLaneId) : undefined;
      if (!current) return;
      const done = () => {
        if (!current.cancelled) {
          commit(current.card.id, current.fromLaneId, current.toLaneId, current.toIndex, current.fromIndex);
        }
        grab.current = null;
        setDrag(null);
      };
      if (!ph || !list || reduced) {
        done();
        return;
      }
      const listRect = list.getBoundingClientRect();
      const origin = toLocal(listRect.left, listRect.top);
      const target = { x: origin.x + ph.offsetLeft, y: origin.y + ph.offsetTop };
      const controls = [
        animate(x, target.x, SPRING),
        animate(y, target.y, SPRING),
        animate(rotate, 0, SPRING),
        animate(scale, 1, SPRING),
      ];
      let finished = false;
      Promise.all(controls).then(() => {
        if (finished) return;
        finished = true;
        done();
      });
      return () => {
        if (finished) return;
        finished = true;
        controls.forEach((c) => c.stop());
        done();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropping]);

    // ---------- Keyboard drag ----------

    const keyboardMove = (cardId: string, dLane: number, dIndex: number) => {
      const pos = locate(board, cardId);
      if (!pos) return;
      let laneIndex = pos.laneIndex;
      let index = pos.index;
      if (dLane !== 0) {
        laneIndex = Math.max(0, Math.min(board.length - 1, laneIndex + dLane));
        if (laneIndex === pos.laneIndex) return;
        index = Math.min(index, board[laneIndex].cards.length);
      } else {
        index = Math.max(0, Math.min(board[laneIndex].cards.length - 1, index + dIndex));
        if (index === pos.index) return;
      }
      const lane = board[laneIndex];
      focusId.current = cardId;
      setBoard(moveCard(board, cardId, lane.id, index));
      setAnnounce(`${lane.title}, ${index + 1}`);
    };

    const onCardKeyDown = (event: React.KeyboardEvent<HTMLElement>, card: KanbanCard) => {
      if (drag) return;
      const active = kbd?.cardId === card.id;
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (!kbd) {
          setKbd({ cardId: card.id, snapshot: board });
          setAnnounce(`${text.picked}: ${card.title}`);
        } else if (active) {
          const before = locate(kbd.snapshot, card.id);
          const after = locate(board, card.id);
          setKbd(null);
          if (before && after) {
            const fromLane = kbd.snapshot[before.laneIndex];
            const toLane = board[after.laneIndex];
            setAnnounce(`${card.title}: ${text.dropped} ${toLane.title}`);
            if (fromLane.id !== toLane.id || before.index !== after.index) {
              onMove?.(card.id, fromLane.id, toLane.id, after.index);
              onLanesChange?.(board);
            }
          }
        }
        return;
      }
      if (!active) return;
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (event.key in moves) {
        event.preventDefault();
        const [dLane, dIndex] = moves[event.key];
        keyboardMove(card.id, dLane, dIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        focusId.current = card.id;
        setBoard(kbd.snapshot);
        setKbd(null);
        setAnnounce(text.cancelled);
      }
    };

    React.useEffect(() => {
      const id = focusId.current;
      if (!id) return;
      focusId.current = null;
      cardEls.current.get(id)?.focus({ preventScroll: true });
    }, [board]);

    // ---------- Composer ----------

    const openComposer = (laneId: string) => setComposerLane(laneId);

    const closeComposer = React.useCallback((clear: boolean, returnFocus: boolean) => {
      setComposerLane((laneId) => {
        if (returnFocus) addRowFocus.current = laneId;
        return null;
      });
      if (clear) setDraft(EMPTY_DRAFT);
    }, []);

    // Click outside cancels; a non-empty title survives as a draft.
    React.useEffect(() => {
      if (!composerLane) return;
      const onPointerDown = (event: PointerEvent) => {
        if (composerForm.current?.contains(event.target as Node)) return;
        closeComposer(draftRef.current.title.trim().length === 0, false);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [composerLane, closeComposer]);

    React.useEffect(() => {
      if (composerLane) return;
      const id = addRowFocus.current;
      if (!id) return;
      addRowFocus.current = null;
      addRowEls.current.get(id)?.focus({ preventScroll: true });
    }, [composerLane]);

    const addTask = (laneId: string) => {
      const titleText = draft.title.trim();
      if (!titleText) return;
      nextNewId.current += 1;
      const card: KanbanCard = {
        id: `new-${Date.now().toString(36)}-${nextNewId.current}`,
        title: titleText,
        label: draft.tag.trim(),
        assignee: currentUser,
        due: draft.date ? formatDraftDate(draft.date) : "",
        priority: DRAFT_TO_CARD[draft.priority],
        attachments: 0,
        comments: 0,
      };
      newIds.current.add(card.id);
      const next = board.map((lane) => (lane.id === laneId ? { ...lane, cards: [...lane.cards, card] } : lane));
      const lane = next.find((entry) => entry.id === laneId);
      setBoard(next);
      setDraft(EMPTY_DRAFT);
      if (lane) setAnnounce(`${card.title}: ${text.added} ${lane.title}`);
      onAddCard?.(laneId, card);
      onLanesChange?.(next);
    };

    const composerMotion = reduced
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.16, ease: "easeOut" as const } },
          exit: { opacity: 0, transition: { duration: 0.12, ease: "easeOut" as const } },
        }
      : {
          initial: { height: 0, opacity: 0 },
          animate: { height: "auto", opacity: 1, transition: { duration: 0.16, ease: "easeOut" as const } },
          exit: { height: 0, opacity: 0, transition: { duration: 0.12, ease: "easeOut" as const } },
        };

    // ---------- Render ----------

    const counts = kbd ? kbd.snapshot : board;

    const itemsFor = (lane: KanbanLane): Item[] => {
      if (!drag) return lane.cards.map((card) => ({ kind: "card", card }));
      const items: Item[] = lane.cards
        .filter((card) => card.id !== drag.card.id)
        .map((card) => ({ kind: "card", card }));
      if (lane.id === drag.toLaneId) {
        items.splice(Math.min(drag.toIndex, items.length), 0, { kind: "placeholder" });
      }
      return items;
    };

    return (
      <div
        ref={localRef}
        data-tsuna-id="kanban-board-lanes"
        className={cn(
          "relative w-[880px] max-w-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 sm:p-5",
          LIFT_SHADOW,
          drag ? "cursor-grabbing select-none" : null,
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
        <p id={instructionsId} className="sr-only">
          {text.instructions}
        </p>
        <LayoutGroup id={groupId}>
          <div ref={scrollerRef} className="kanban-board-lanes-scroller mt-4 overflow-x-auto pb-1">
            <div
              className="kanban-board-lanes-grid"
              style={{ "--kanban-lanes": board.length } as React.CSSProperties}
            >
              {board.map((lane, laneIndex) => {
                const status = STATUS[lane.tone ?? "neutral"];
                const items = itemsFor(lane);
                const count = counts[laneIndex]?.cards.length ?? lane.cards.length;
                const done = lane.tone === "success";
                return (
                  <section
                    key={lane.id}
                    ref={(node) => {
                      if (node) laneEls.current.set(lane.id, node);
                      else laneEls.current.delete(lane.id);
                    }}
                    aria-label={lane.title}
                    className="group/lane flex min-w-0 flex-col rounded-xl bg-zinc-100 p-2"
                  >
                    <header className="flex items-center gap-2 pt-0.5 pr-0.5 pb-2 pl-1.5">
                      <status.Icon aria-hidden strokeWidth={2.2} className={cn("size-3.5 shrink-0", status.color)} />
                      <h3 className="m-0 text-[13px] font-semibold text-zinc-900">{lane.title}</h3>
                      <span className="text-[12px] text-zinc-400">
                        <RollCount value={count} />
                      </span>
                      <span className="ml-auto flex items-center opacity-0 transition-opacity [transition-duration:120ms] group-hover/lane:opacity-100 focus-within:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
                        <button
                          type="button"
                          aria-label={`${text.more}: ${lane.title}`}
                          onClick={() => onLaneMenu?.(lane.id)}
                          className={cn(
                            "grid size-6 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors [transition-duration:150ms] hover:bg-zinc-200 hover:text-zinc-600 motion-reduce:transition-none",
                            FOCUS,
                          )}
                        >
                          <Ellipsis aria-hidden className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${text.add}: ${lane.title}`}
                          onClick={() => openComposer(lane.id)}
                          className={cn(
                            "grid size-6 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors [transition-duration:150ms] hover:bg-zinc-200 hover:text-zinc-600 motion-reduce:transition-none",
                            FOCUS,
                          )}
                        >
                          <Plus aria-hidden className="size-3.5" />
                        </button>
                      </span>
                    </header>
                    <ul
                      ref={(node) => {
                        if (node) listEls.current.set(lane.id, node);
                        else listEls.current.delete(lane.id);
                      }}
                      className={cn("relative m-0 flex list-none flex-col gap-2 p-0", drag ? "min-h-16" : null)}
                    >
                      {items.map((item, index) => {
                        if (item.kind === "placeholder") {
                          return (
                            <motion.li
                              key="kanban-placeholder"
                              ref={placeholderEl}
                              layout="position"
                              transition={transition}
                              aria-hidden
                              style={{ height: drag?.height }}
                              className="shrink-0 rounded-[10px] border border-dashed border-zinc-400 bg-zinc-100"
                            />
                          );
                        }
                        const { card } = item;
                        const lifted = kbd?.cardId === card.id;
                        const isNew = newIds.current.has(card.id);
                        return (
                          <motion.li
                            key={card.id}
                            layoutId={`${groupId}-${card.id}`}
                            layout
                            initial={isNew ? (reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }) : false}
                            transition={
                              isNew
                                ? { layout: transition, default: reduced ? { duration: 0.16, ease: "easeOut" } : ENTER_SPRING }
                                : transition
                            }
                            onAnimationComplete={isNew ? () => newIds.current.delete(card.id) : undefined}
                            animate={{
                              opacity: 1,
                              y: 0,
                              rotate: lifted && !reduced ? 2 : 0,
                              scale: lifted && !reduced ? 1.02 : 1,
                            }}
                            ref={(node: HTMLLIElement | null) => {
                              if (node) cardEls.current.set(card.id, node);
                              else if (cardEls.current.get(card.id)?.isConnected === false) cardEls.current.delete(card.id);
                            }}
                            data-kanban-card=""
                            tabIndex={0}
                            aria-roledescription="draggable card"
                            aria-describedby={instructionsId}
                            onPointerDown={(event) => startPointerDrag(event, card, lane.id, index)}
                            onKeyDown={(event) => onCardKeyDown(event, card)}
                            className={cn(
                              "relative shrink-0 cursor-grab touch-none rounded-[10px] border border-zinc-200 bg-white p-3 select-none",
                              lifted ? cn(LIFT_SHADOW, "z-10") : CARD_HOVER,
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35",
                            )}
                          >
                            <CardBody card={card} today={today} todayText={text.today} done={done} />
                          </motion.li>
                        );
                      })}
                      {items.length === 0 ? <li className="sr-only">{text.empty}</li> : null}
                    </ul>
                    <AnimatePresence initial={false}>
                      {composerLane === lane.id ? (
                        <motion.div key="composer" {...composerMotion} className="overflow-hidden">
                          <div className={items.length > 0 ? "pt-2" : "pt-1"}>
                            <TaskComposer
                              laneTitle={lane.title}
                              draft={draft}
                              onDraft={setDraft}
                              onSubmit={() => addTask(lane.id)}
                              onCancel={() => closeComposer(true, true)}
                              text={text}
                              formRef={composerForm}
                            />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    {composerLane !== lane.id ? (
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) addRowEls.current.set(lane.id, node);
                          else addRowEls.current.delete(lane.id);
                        }}
                        onClick={() => openComposer(lane.id)}
                        className={cn(
                          "mt-1 flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[12px] text-zinc-500 transition-colors [transition-duration:120ms] hover:bg-zinc-200 motion-reduce:transition-none",
                          items.length > 0 ? "mt-2" : null,
                          FOCUS,
                        )}
                      >
                        <Plus aria-hidden className="size-3.5 text-zinc-400" />
                        {text.addTask}
                      </button>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </LayoutGroup>
        {drag ? (
          <motion.div
            aria-hidden
            style={{ x, y, rotate, scale, width: drag.width, height: drag.height }}
            className={cn(
              "pointer-events-none absolute top-0 left-0 z-50 rounded-[10px] border border-zinc-200 bg-white p-3",
              LIFT_SHADOW,
            )}
          >
            <CardBody
              card={drag.card}
              today={today}
              todayText={text.today}
              done={board.find((lane) => lane.id === drag.toLaneId)?.tone === "success"}
            />
          </motion.div>
        ) : null}
        <span aria-live="polite" className="sr-only">
          {announce}
        </span>
      </div>
    );
  },
);

KanbanBoardLanes.displayName = "KanbanBoardLanes";
