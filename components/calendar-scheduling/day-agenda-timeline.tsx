"use client";

import * as React from "react";
import {
  ChevronLeft,
  Check,
  ChevronRight,
  Link,
  MapPin,
  Video,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

export type DayAgendaTint = "sky" | "emerald" | "amber" | "rose" | "zinc";

export type DayAgendaEvent = {
  id: string;
  title: string;
  /** Decimal hours, e.g. 10.5 for 10:30. */
  start: number;
  end: number;
  location?: string;
  /** Names. Initials are shown as avatars in the detail card. */
  attendees?: readonly string[];
  tint?: DayAgendaTint;
  /** Shows the Video icon and the Join call button. Defaults to true when the location mentions a call. */
  online?: boolean;
  /** Meeting link. Shows the Copy link button. */
  link?: string;
};

export type DayAgendaDay = {
  id: string;
  /** Header text, e.g. "Thursday, Nov 13". */
  label: string;
  /** Date in the event details, e.g. "Thu, Nov 13". Derived from `label` when unset. */
  shortLabel?: string;
  /** The red now line is drawn on this day only. */
  today?: boolean;
  events: readonly DayAgendaEvent[];
};

export type DayAgendaLabels = {
  previous?: string;
  next?: string;
  today?: string;
  join?: string;
  close?: string;
  now?: string;
  empty?: string;
  noAttendees?: string;
  person?: string;
  people?: string;
  copyLink?: string;
  copied?: string;
};

export type DayAgendaTimelineProps = React.ComponentPropsWithoutRef<"div"> & {
  days?: readonly DayAgendaDay[];
  dayIndex?: number;
  defaultDayIndex?: number;
  onDayChange?: (index: number) => void;
  /** First and last hour on the axis. */
  startHour?: number;
  endHour?: number;
  /** Time of day in decimal hours. When set, the line stops ticking on its own. */
  now?: number;
  /** Where the line starts when `now` is unset. */
  defaultNow?: number;
  /** 1 is real time. Raise it for demos, e.g. 60 moves one hour per minute. */
  nowSpeed?: number;
  onJoin?: (event: DayAgendaEvent) => void;
  /** Called after the link is copied. */
  onCopyLink?: (event: DayAgendaEvent) => void;
  labels?: DayAgendaLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const HOUR_PX = 64;
/** Gap between an event block and the grid lines above and below it. */
const INSET_PX = 2;
/** Events shorter than this (in hours) collapse to one line. */
const COMPACT_HOURS = 0.75;

const CSS = `
@keyframes day-agenda-timeline-in-next { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
@keyframes day-agenda-timeline-in-prev { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
@keyframes day-agenda-timeline-out-next { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(-36px); } }
@keyframes day-agenda-timeline-out-prev { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(36px); } }
@keyframes day-agenda-timeline-fade { from { opacity: 0; } to { opacity: 1; } }
.day-agenda-timeline-in-next { animation: day-agenda-timeline-in-next 420ms ${EASE} both; }
.day-agenda-timeline-in-prev { animation: day-agenda-timeline-in-prev 420ms ${EASE} both; }
.day-agenda-timeline-out-next { animation: day-agenda-timeline-out-next 300ms ${EASE} both; }
.day-agenda-timeline-out-prev { animation: day-agenda-timeline-out-prev 300ms ${EASE} both; }
.day-agenda-timeline-fade { animation: day-agenda-timeline-fade 260ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .day-agenda-timeline-in-next, .day-agenda-timeline-in-prev, .day-agenda-timeline-fade { animation: none; }
  .day-agenda-timeline-out-next, .day-agenda-timeline-out-prev { animation: none; opacity: 0; }
}
`;

/** Accent color of the dot before each event title. */
const TINTS: Record<DayAgendaTint, string> = {
  sky: "#38bdf8",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  zinc: "#a1a1aa",
};

const DEFAULT_DAYS: readonly DayAgendaDay[] = [
  {
    id: "wed",
    label: "Wednesday, Nov 12",
    events: [
      {
        id: "w1",
        title: "Weekly planning",
        start: 9.5,
        end: 10.5,
        location: "Room 1",
        attendees: ["Aiko Mori", "Jonas Weber", "Priya Raman"],
        tint: "sky",
      },
      {
        id: "w2",
        title: "Customer call · Harbor Labs",
        start: 13,
        end: 13.75,
        location: "Video call",
        link: "https://meet.example.com/harbor-labs",
        attendees: ["Lena Brandt", "Theo Lindqvist"],
        tint: "emerald",
      },
      {
        id: "w3",
        title: "Pricing page review",
        start: 15.5,
        end: 16.5,
        location: "Room 3",
        attendees: ["Mina Okada", "Ren Takeda"],
        tint: "amber",
      },
    ],
  },
  {
    id: "thu",
    label: "Thursday, Nov 13",
    today: true,
    events: [
      {
        id: "e1",
        title: "Stand-up",
        start: 9.25,
        end: 9.75,
        location: "Video call",
        link: "https://meet.example.com/stand-up",
        attendees: [
          "Kenji Arai",
          "Leila Haddad",
          "Mei Lin Chow",
          "Tomás Rivera",
        ],
        tint: "zinc",
      },
      {
        id: "e2",
        title: "Design review",
        start: 10,
        end: 11,
        location: "Room 3",
        attendees: ["Mina Okada", "Ren Takeda", "Ava Brooks"],
        tint: "sky",
      },
      {
        id: "e3",
        title: "Lunch with Sora",
        start: 12,
        end: 13,
        location: "Blue Fern Café",
        attendees: ["Sora Fujii"],
        tint: "amber",
      },
      {
        id: "e4",
        title: "Roadmap sync",
        start: 14,
        end: 15.5,
        location: "Room 1",
        attendees: ["Priya Raman", "Jonas Weber", "Hana Sato"],
        tint: "emerald",
      },
      {
        id: "e5",
        title: "1:1 with Kenji",
        start: 16.5,
        end: 17,
        location: "Video call",
        link: "https://meet.example.com/kenji-1on1",
        attendees: ["Kenji Arai"],
        tint: "rose",
      },
    ],
  },
  {
    id: "fri",
    label: "Friday, Nov 14",
    events: [
      {
        id: "f1",
        title: "Sprint demo",
        start: 11,
        end: 12,
        location: "Main hall",
        attendees: ["Hana Sato", "Kenji Arai", "Leila Haddad"],
        tint: "emerald",
      },
      {
        id: "f2",
        title: "Focus time",
        start: 13.5,
        end: 15.5,
        location: "No meetings",
        tint: "zinc",
      },
      {
        id: "f3",
        title: "Retro",
        start: 16,
        end: 16.75,
        location: "Room 2",
        attendees: ["Tomás Rivera", "Mei Lin Chow"],
        tint: "sky",
      },
    ],
  },
];

const DEFAULT_LABELS: Required<DayAgendaLabels> = {
  previous: "Previous day",
  next: "Next day",
  today: "Today",
  join: "Join",
  close: "Close details",
  now: "Now",
  empty: "Nothing scheduled.",
  noAttendees: "Just you",
  person: "person",
  people: "people",
  copyLink: "Copy link",
  copied: "Copied",
};

/** "Thursday, Nov 13" → "Thu, Nov 13". */
function shortDay(day: DayAgendaDay) {
  return day.shortLabel ?? day.label.replace(/^([A-Za-z]{3})[A-Za-z]*,/, "$1,");
}

function isOnline(event: DayAgendaEvent) {
  return (
    event.online ?? /\b(call|video|zoom|meet)\b/i.test(event.location ?? "")
  );
}

/** Whole minutes since midnight. The epsilon keeps 9.25 from flooring to 9:14. */
function toMinutes(hours: number) {
  return Math.floor(hours * 60 + 1e-6);
}

function clock(hours: number) {
  const total = toMinutes(hours);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Where an event block sits in the grid column, in px. */
function blockBox(event: DayAgendaEvent, startHour: number) {
  const startMin = toMinutes(event.start) - startHour * 60;
  const endMin = toMinutes(event.end) - startHour * 60;
  const top = (startMin * HOUR_PX) / 60 + INSET_PX;
  const height = Math.max(
    20,
    ((endMin - startMin) * HOUR_PX) / 60 - INSET_PX * 2,
  );
  return { top, height };
}

const SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.8,
} as const;

/** Content wrapper. "hidden" = fresh open (sections stagger in), "swap" = switched event (crossfade). */
const CONTENT: Variants = {
  hidden: { opacity: 1 },
  swap: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: { duration: 0.12, delayChildren: 0.04, staggerChildren: 0.03 },
  },
  out: { opacity: 0, transition: { duration: 0.12 } },
};

const sectionVariants = (reduced: boolean): Variants => ({
  hidden: { opacity: 0, y: reduced ? 0 : 4 },
  swap: { opacity: 1, y: 0 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0.1 : 0.16, ease: "easeOut" },
  },
});

type EventPopoverProps = {
  /** Resting translateY inside the grid column. Position is transform-only. */
  y: number;
  /** Opens above the event: grow from the bottom-left corner instead. */
  above: boolean;
  reduced: boolean;
  label: string;
  children: React.ReactNode;
};

const EventPopover = React.forwardRef<HTMLDivElement, EventPopoverProps>(
  function EventPopover({ y, above, reduced, label, children }, ref) {
    const present = useIsPresent();
    const [animating, setAnimating] = React.useState(false);
    return (
      <motion.div
        ref={ref}
        role="dialog"
        aria-label={label}
        className={cn(
          "absolute top-0 left-1 z-30 w-[288px] max-w-[calc(100%-8px)] rounded-[12px] border border-zinc-200 bg-white p-3.5",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
        )}
        style={{
          transformOrigin: above ? "0% 100%" : "0% 0%",
          pointerEvents: present ? undefined : "none",
          willChange: animating ? "transform, opacity" : undefined,
        }}
        initial={
          reduced
            ? { opacity: 0, scale: 1, y }
            : { opacity: 0, scale: 0.96, y: y - 4 }
        }
        animate={{
          opacity: 1,
          scale: 1,
          y,
          transition: reduced
            ? { duration: 0.1, y: { duration: 0 } }
            : { ...SPRING, opacity: { duration: 0.18, ease: "easeOut" } },
        }}
        exit={
          reduced
            ? { opacity: 0, transition: { duration: 0.1 } }
            : {
                opacity: 0,
                scale: 0.97,
                y: y - 2,
                transition: { duration: 0.12, ease: "easeIn" },
              }
        }
        onAnimationStart={() => setAnimating(true)}
        onAnimationComplete={() => setAnimating(false)}
      >
        {children}
      </motion.div>
    );
  },
);

export const DayAgendaTimeline = React.forwardRef<
  HTMLDivElement,
  DayAgendaTimelineProps
>(
  (
    {
      days = DEFAULT_DAYS,
      dayIndex,
      defaultDayIndex,
      onDayChange,
      startHour = 9,
      endHour = 18,
      now,
      defaultNow = 11.4,
      nowSpeed = 1,
      onJoin,
      onCopyLink,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const fallbackIndex = Math.max(
      0,
      days.findIndex((day) => day.today),
    );
    const [ownIndex, setOwnIndex] = React.useState(
      defaultDayIndex ?? fallbackIndex,
    );
    const index = Math.min(days.length - 1, Math.max(0, dayIndex ?? ownIndex));
    const [slide, setSlide] = React.useState<{
      index: number;
      from: number | null;
      dir: "next" | "prev";
    }>({
      index,
      from: null,
      dir: "next",
    });
    if (slide.index !== index) {
      setSlide({
        index,
        from: slide.index,
        dir: index > slide.index ? "next" : "prev",
      });
    }
    const [openId, setOpenId] = React.useState<string | null>(null);
    // switched: the popover moved from one event to another without closing (crossfade, no stagger).
    const [session, setSession] = React.useState<{
      lastId: string;
      switched: boolean;
    } | null>(null);
    if (openId && !session) setSession({ lastId: openId, switched: false });
    else if (openId && session && session.lastId !== openId)
      setSession({ lastId: openId, switched: true });
    else if (!openId && session) setSession(null);
    const [placement, setPlacement] = React.useState<{
      id: string;
      y: number;
      above: boolean;
    } | null>(null);
    if (!openId && placement) setPlacement(null);
    const measure = React.useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion() ?? false;
    const popover = React.useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const copiedTimer = React.useRef<number | undefined>(undefined);
    React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
    const copyLink = (event: DayAgendaEvent) => {
      if (!event.link) return;
      void navigator.clipboard?.writeText(event.link).catch(() => {});
      onCopyLink?.(event);
      setCopiedId(event.id);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopiedId(null), 1500);
    };
    const line = React.useRef<HTMLDivElement>(null);
    const pill = React.useRef<HTMLSpanElement>(null);
    const triggers = React.useRef(new Map<string, HTMLButtonElement>());
    const hours = Array.from(
      { length: endHour - startHour + 1 },
      (_, i) => startHour + i,
    );
    const totalPx = (endHour - startHour) * HOUR_PX;
    const day = days[index];
    const leavingDay = slide.from !== null ? days[slide.from] : undefined;
    const todayIndex = days.findIndex((d) => d.today);

    // The now line is placed outside React and snaps to whole minutes, once per (clock) minute.
    React.useEffect(() => {
      const node = line.current;
      if (!node) return;
      const place = (value: number) => {
        const minutes = toMinutes(value) - startHour * 60;
        const inRange = minutes >= 0 && minutes <= (endHour - startHour) * 60;
        node.style.visibility = inRange ? "visible" : "hidden";
        node.style.top = `${(Math.min(Math.max(minutes, 0), (endHour - startHour) * 60) * HOUR_PX) / 60}px`;
        if (pill.current) pill.current.textContent = clock(value);
      };
      if (now !== undefined) {
        place(now);
        return;
      }
      const speed = Math.max(nowSpeed, 1e-6);
      const origin = performance.now();
      const at = () =>
        defaultNow + ((performance.now() - origin) / 3_600_000) * speed;
      place(defaultNow);
      // One clock minute in real milliseconds (60 000 at nowSpeed 1), never faster than once a second.
      const interval = window.setInterval(
        () => place(at()),
        Math.max(1000, 60_000 / speed),
      );
      return () => window.clearInterval(interval);
    }, [now, defaultNow, nowSpeed, startHour, endHour, index]);

    const go = (next: number) => {
      const bounded = Math.min(days.length - 1, Math.max(0, next));
      if (bounded === index) return;
      setOpenId(null);
      if (dayIndex === undefined) setOwnIndex(bounded);
      onDayChange?.(bounded);
    };

    const close = React.useCallback(
      (restoreFocus: "always" | "if-lost") => {
        if (!openId) return;
        const trigger = triggers.current.get(openId);
        setOpenId(null);
        if (!trigger) return;
        if (restoreFocus === "always") {
          trigger.focus();
          return;
        }
        // After an outside click, only take focus back if the click left it nowhere.
        requestAnimationFrame(() => {
          const active = document.activeElement;
          if (!active || active === document.body)
            trigger.focus({ preventScroll: true });
        });
      },
      [openId],
    );

    // Outside pointerdown and Escape close the popover. Event blocks are excluded:
    // their own click toggles or switches the popover.
    React.useEffect(() => {
      if (!openId) return;
      const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (popover.current?.contains(target)) return;
        for (const trigger of triggers.current.values()) {
          if (trigger.contains(target)) return;
        }
        close("if-lost");
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        close("always");
      };
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [openId, close]);

    const openEvent = openId
      ? day?.events.find((event) => event.id === openId)
      : undefined;

    // Measured on a hidden copy, so the popover mounts already in place:
    // 6px below the event, or above it when that would run past the grid.
    React.useLayoutEffect(() => {
      const node = measure.current;
      if (!node || !openEvent) return;
      const { top, height } = blockBox(openEvent, startHour);
      const h = node.offsetHeight;
      const below = top + height + 6;
      const aboveY = top - 6 - h;
      const fitsBelow = below + h <= totalPx;
      const above = !fitsBelow && aboveY >= 0;
      const y = fitsBelow ? below : above ? aboveY : Math.max(0, totalPx - h);
      if (
        placement?.id === openEvent.id &&
        placement.y === y &&
        placement.above === above
      )
        return;
      setPlacement({ id: openEvent.id, y, above });
      // copiedId changes the button label, which can change the height.
    }, [openEvent, placement, startHour, totalPx, copiedId]);

    const navClass = cn(
      "grid size-7 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent text-zinc-600",
      "transition-[background-color,color,opacity] [transition-duration:180ms] hover:bg-zinc-100 hover:text-zinc-950 motion-reduce:transition-none",
      "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent",
      FOCUS,
    );

    const renderEvents = (source: DayAgendaDay, interactive: boolean) =>
      source.events.map((event) => {
        const accent = TINTS[event.tint ?? "sky"];
        const { top, height } = blockBox(event, startHour);
        const open = interactive && openId === event.id;
        const compact = event.end - event.start < COMPACT_HOURS;
        const time = `${clock(event.start)}–${clock(event.end)}`;
        return (
          <div
            key={event.id}
            className={cn(
              "absolute right-1 left-1 overflow-hidden rounded-[8px] transition-colors [transition-duration:120ms] motion-reduce:transition-none",
              open ? "bg-zinc-200" : "bg-zinc-100 hover:bg-zinc-200",
            )}
            style={{ top, height }}
          >
            <button
              type="button"
              ref={(node) => {
                if (!interactive) return;
                if (node) triggers.current.set(event.id, node);
                else triggers.current.delete(event.id);
              }}
              tabIndex={interactive ? 0 : -1}
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpenId(open ? null : event.id)}
              className={cn(
                "flex w-full cursor-pointer rounded-[8px] border-0 bg-transparent px-2.5 text-left",
                compact
                  ? "items-center gap-1.5"
                  : "flex-col justify-start gap-0.5 pt-[7px]",
                "focus-visible:outline-none",
                !open &&
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/35",
              )}
              style={{ height: compact ? height : Math.min(height, 52) }}
            >
              {compact ? (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "shrink-0 rounded-full",
                      open ? "size-2" : "size-1.5",
                    )}
                    style={{ backgroundColor: accent }}
                  />
                  <span className="min-w-0 truncate text-[13px] leading-4 font-medium text-zinc-900">
                    {event.title}
                  </span>
                  <span className="shrink-0 text-[12px] leading-4 text-zinc-500 tabular-nums">
                    {time}
                  </span>
                </>
              ) : (
                <>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "shrink-0 rounded-full",
                        open ? "size-2" : "size-1.5",
                      )}
                      style={{ backgroundColor: accent }}
                    />
                    <span className="min-w-0 truncate text-[13px] leading-4 font-medium text-zinc-900">
                      {event.title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12px] leading-4 text-zinc-500 tabular-nums",
                      open ? "pl-3.5" : "pl-3",
                    )}
                  >
                    {time}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        );
      });

    const section = sectionVariants(reduced);
    const renderDetails = (event: DayAgendaEvent, source: DayAgendaDay) => {
      const online = isOnline(event);
      const attendees = event.attendees ?? [];
      const shown = attendees.slice(0, 4);
      const LocationIcon = online ? Video : MapPin;
      const copied = copiedId === event.id;
      const actionClass =
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 px-3 text-[13px] font-medium transition-colors [transition-duration:160ms] motion-reduce:transition-none";
      return (
        <>
          <motion.div variants={section} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-[6px] size-2 shrink-0 rounded-full"
              style={{ backgroundColor: TINTS[event.tint ?? "sky"] }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="m-0 truncate text-[14px] leading-5 font-semibold text-zinc-950">
                {event.title}
              </h3>
              <p className="m-0 truncate text-[12px] leading-4 text-zinc-500 tabular-nums">
                {shortDay(source)} · {clock(event.start)}–{clock(event.end)}
              </p>
            </div>
            <button
              type="button"
              aria-label={text.close}
              onClick={() => close("always")}
              className={cn(
                "-mt-0.5 -mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-zinc-400",
                "transition-colors [transition-duration:160ms] hover:bg-zinc-100 hover:text-zinc-950 motion-reduce:transition-none",
                FOCUS,
              )}
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </motion.div>

          <motion.div variants={section} className="mt-3 flex flex-col gap-2">
            {event.location ? (
              <p className="m-0 flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-zinc-900">
                <LocationIcon
                  aria-hidden
                  size={13}
                  className="shrink-0 text-zinc-400"
                />
                <span className="truncate">{event.location}</span>
              </p>
            ) : null}
            <div className="flex min-w-0 items-center gap-2">
              {shown.length > 0 ? (
                <span className="flex shrink-0 items-center">
                  {shown.map((name, i) => (
                    <span
                      key={name}
                      className={cn(
                        "group/avatar relative grid size-[22px] shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-900 ring-2 ring-white",
                        i > 0 && "-ml-1",
                        // The next avatar covers the right 4px; keep the initials in the visible part.
                        i < shown.length - 1 && "pr-1",
                      )}
                    >
                      <span aria-hidden>{initials(name)}</span>
                      <span className="sr-only">{name}</span>
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-[6px] bg-zinc-950 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white",
                          "opacity-0 transition-opacity [transition-duration:120ms] group-hover/avatar:opacity-100 motion-reduce:transition-none",
                        )}
                      >
                        {name}
                      </span>
                    </span>
                  ))}
                </span>
              ) : null}
              <span className="truncate text-[12px] text-zinc-500">
                {attendees.length === 0
                  ? text.noAttendees
                  : `${attendees.length} ${attendees.length === 1 ? text.person : text.people}`}
              </span>
            </div>
          </motion.div>

          {event.link || online ? (
            <motion.div
              variants={section}
              className="mt-3.5 flex items-center justify-end gap-1.5"
            >
              {event.link ? (
                <button
                  type="button"
                  onClick={() => copyLink(event)}
                  className={cn(
                    actionClass,
                    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                    FOCUS,
                  )}
                >
                  {copied ? (
                    <Check aria-hidden className="size-3.5" />
                  ) : (
                    <Link aria-hidden className="size-3.5" />
                  )}
                  <span aria-live="polite">
                    {copied ? text.copied : text.copyLink}
                  </span>
                </button>
              ) : null}
              {online ? (
                <button
                  type="button"
                  onClick={() => onJoin?.(event)}
                  className={cn(
                    actionClass,
                    "bg-zinc-950 text-white hover:bg-zinc-800",
                    FOCUS,
                  )}
                >
                  <Video aria-hidden className="size-3.5" />
                  {text.join}
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </>
      );
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="day-agenda-timeline"
        data-open={openId ?? undefined}
        className={cn(
          "w-[480px] max-w-full overflow-clip rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5 sm:px-5">
          <h2
            key={day?.id}
            aria-live="polite"
            className="day-agenda-timeline-fade m-0 truncate text-[16px] font-semibold tracking-[-0.01em] text-zinc-950 tabular-nums"
          >
            {day?.label}
          </h2>
          <div className="-mr-1.5 flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={todayIndex < 0 || todayIndex === index}
              onClick={() => go(todayIndex)}
              className={cn(
                "mr-1 inline-flex h-7 cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2 text-[12px] font-medium text-zinc-500",
                "transition-[background-color,color,opacity] [transition-duration:180ms] hover:bg-zinc-100 hover:text-zinc-950 motion-reduce:transition-none",
                "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500",
                FOCUS,
              )}
            >
              {text.today}
            </button>
            <button
              type="button"
              aria-label={text.previous}
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className={navClass}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              aria-label={text.next}
              disabled={index === days.length - 1}
              onClick={() => go(index + 1)}
              className={navClass}
            >
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-3 pt-2 pb-4 sm:px-4">
          <div className="relative flex">
            <div
              aria-hidden
              className="relative w-11 shrink-0"
              style={{ height: totalPx }}
            >
              {hours.map((hour, i) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[11px] leading-none text-zinc-400 tabular-nums"
                  style={{ top: i * HOUR_PX }}
                >
                  {hour}:00
                </span>
              ))}
            </div>
            <div
              className="relative min-w-0 flex-1"
              style={{ height: totalPx }}
            >
              {hours.map((hour, i) => (
                <React.Fragment key={hour}>
                  <span
                    aria-hidden
                    className="absolute right-0 left-0 border-t border-zinc-200/60"
                    style={{ top: i * HOUR_PX }}
                  />
                  {i < hours.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute right-0 left-0 border-t border-dashed border-zinc-200/40"
                      style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                    />
                  ) : null}
                </React.Fragment>
              ))}
              {leavingDay ? (
                <div
                  key={`out-${leavingDay.id}-${day?.id}`}
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    `day-agenda-timeline-out-${slide.dir}`,
                  )}
                >
                  {renderEvents(leavingDay, false)}
                </div>
              ) : null}
              {day ? (
                <div
                  key={day.id}
                  className={cn(
                    "absolute inset-0",
                    slide.from !== null &&
                      `day-agenda-timeline-in-${slide.dir}`,
                  )}
                >
                  {day.events.length === 0 ? (
                    <p className="m-0 pt-10 text-center text-[13px] text-zinc-400">
                      {text.empty}
                    </p>
                  ) : (
                    renderEvents(day, true)
                  )}
                </div>
              ) : null}
              {openEvent && day ? (
                <div
                  ref={measure}
                  aria-hidden
                  inert
                  className="pointer-events-none invisible absolute top-0 left-1 w-[288px] max-w-[calc(100%-8px)] border border-transparent p-3.5"
                >
                  {renderDetails(openEvent, day)}
                </div>
              ) : null}
              <AnimatePresence>
                {openEvent && placement && day ? (
                  <EventPopover
                    key="popover"
                    ref={popover}
                    y={placement.y}
                    above={placement.above}
                    reduced={reduced}
                    label={openEvent.title}
                  >
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={openEvent.id}
                        variants={CONTENT}
                        initial={session?.switched ? "swap" : "hidden"}
                        animate="shown"
                        exit="out"
                      >
                        {renderDetails(openEvent, day)}
                      </motion.div>
                    </AnimatePresence>
                  </EventPopover>
                ) : null}
              </AnimatePresence>
            </div>
            <div
              ref={line}
              role="img"
              aria-label={text.now}
              className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex -translate-y-1/2 items-center"
              style={{
                display: day?.today ? undefined : "none",
                visibility: "hidden",
              }}
            >
              <span className="flex w-11 shrink-0 justify-end pr-1">
                <span
                  ref={pill}
                  className="rounded-full bg-rose-500 px-1.5 py-px text-[10px] leading-[14px] font-medium text-white tabular-nums"
                />
              </span>
              <span className="h-px flex-1 bg-rose-500" />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

DayAgendaTimeline.displayName = "DayAgendaTimeline";
