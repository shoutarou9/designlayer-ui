"use client";

import * as React from "react";
import { ArrowLeft, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type BookingSlotLabels = {
  previousWeek?: string;
  nextWeek?: string;
  confirm?: string;
  booked?: string;
  addToCalendar?: string;
  back?: string;
  noSlots?: string;
  slots?: string;
};

export type BookingSlotPickerProps = Omit<React.ComponentPropsWithoutRef<"div">, "title" | "onSelect"> & {
  /** e.g. "30 min intro call". */
  title?: string;
  host?: string;
  /** Length of one slot in minutes. */
  durationMinutes?: number;
  /** First day of the first week, as YYYY-MM-DD. */
  startDate?: string;
  /** How many weeks ahead can be browsed. */
  weeks?: number;
  /** Times offered per weekday, 0 = Sunday. 24-hour "H:MM". */
  slotsByWeekday?: Readonly<Record<number, readonly string[]>>;
  timeZone?: string;
  defaultDate?: string;
  onConfirm?: (booking: { date: string; time: string }) => void;
  onAddToCalendar?: (booking: { date: string; time: string }) => void;
  labels?: BookingSlotLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes booking-slot-picker-slot { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes booking-slot-picker-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes booking-slot-picker-pop { 0% { opacity: 0; transform: scale(0.4); } 100% { opacity: 1; transform: scale(1); } }
.booking-slot-picker-slot { animation: booking-slot-picker-slot 420ms ${EASE} backwards; }
.booking-slot-picker-fade { animation: booking-slot-picker-fade 260ms ${EASE} both; }
.booking-slot-picker-pop { animation: booking-slot-picker-pop 460ms ${SPRING} 120ms both; }
@media (prefers-reduced-motion: reduce) {
  .booking-slot-picker-slot, .booking-slot-picker-fade, .booking-slot-picker-pop { animation: none; }
}
`;

const DEFAULT_SLOTS: Readonly<Record<number, readonly string[]>> = {
  1: ["9:30", "10:30", "11:00", "13:30", "15:00", "16:30"],
  2: ["9:00", "10:00", "10:30", "14:00", "14:30", "16:00"],
  3: ["11:30", "13:00", "15:30"],
  4: ["9:00", "9:30", "10:30", "11:00", "13:00", "14:30", "15:00", "16:00"],
  5: ["10:00", "13:30", "14:00"],
};

const DEFAULT_LABELS: Required<BookingSlotLabels> = {
  previousWeek: "Previous week",
  nextWeek: "Next week",
  confirm: "Confirm",
  booked: "You’re booked",
  addToCalendar: "Add to calendar",
  back: "Back",
  noSlots: "No times left on this day.",
  slots: "Available times",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

/** Dates are handled in UTC so the server and the browser agree. */
function parse(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year ?? 2026, (month ?? 1) - 1, day ?? 1);
}
function toIso(stamp: number) {
  return new Date(stamp).toISOString().slice(0, 10);
}
function describe(iso: string) {
  const date = new Date(parse(iso));
  return {
    weekday: date.getUTCDay(),
    day: date.getUTCDate(),
    month: MONTHS[date.getUTCMonth()] ?? "",
  };
}
function endTime(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour ?? 0) * 60 + (minute ?? 0) + minutes;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const BookingSlotPicker = React.forwardRef<HTMLDivElement, BookingSlotPickerProps>(
  (
    {
      title = "30 min intro call",
      host = "Aiko Mori",
      durationMinutes = 30,
      startDate = "2026-11-16",
      weeks = 4,
      slotsByWeekday = DEFAULT_SLOTS,
      timeZone = "Asia/Tokyo (GMT+9)",
      defaultDate,
      onConfirm,
      onAddToCalendar,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const uid = React.useId();
    const origin = parse(startDate);
    const slotsFor = React.useCallback(
      (iso: string) => slotsByWeekday[describe(iso).weekday] ?? [],
      [slotsByWeekday],
    );
    const firstOpen = (week: number) => {
      for (let i = 0; i < 7; i += 1) {
        const iso = toIso(origin + (week * 7 + i) * DAY_MS);
        if (slotsFor(iso).length > 0) return iso;
      }
      return toIso(origin + week * 7 * DAY_MS);
    };
    const [date, setDate] = React.useState(() => defaultDate ?? firstOpen(0));
    const [week, setWeek] = React.useState(() =>
      Math.min(weeks - 1, Math.max(0, Math.floor((parse(defaultDate ?? firstOpen(0)) - origin) / (7 * DAY_MS)))),
    );
    const [time, setTime] = React.useState<string | null>(null);
    const [confirmed, setConfirmed] = React.useState(false);
    const [height, setHeight] = React.useState<number | null>(null);
    const picker = React.useRef<HTMLDivElement>(null);
    const done = React.useRef<HTMLDivElement>(null);
    const focusAfter = React.useRef<"done" | "slot" | null>(null);

    const days = Array.from({ length: 7 }, (_, i) => toIso(origin + (week * 7 + i) * DAY_MS));
    const dayIndex = days.indexOf(date);
    const slots = slotsFor(date);
    const info = describe(date);
    const first = describe(days[0] ?? date);
    const last = describe(days[6] ?? date);
    const rangeLabel =
      first.month === last.month ? `${first.month} ${first.day} – ${last.day}` : `${first.month} ${first.day} – ${last.month} ${last.day}`;
    const longDate = `${WEEKDAYS_LONG[info.weekday]}, ${info.month} ${info.day}`;

    // The frame takes the height of whichever view is showing, so the swap can animate.
    React.useLayoutEffect(() => {
      const node = confirmed ? done.current : picker.current;
      if (!node) return;
      const measure = () => setHeight(node.offsetHeight);
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [confirmed]);

    React.useEffect(() => {
      const target = focusAfter.current;
      focusAfter.current = null;
      if (target === "done") {
        const buttons = done.current?.querySelectorAll<HTMLElement>("button");
        buttons?.[buttons.length - 1]?.focus({ preventScroll: true });
      }
      if (target === "slot") picker.current?.querySelector<HTMLElement>("[data-selected] button")?.focus({ preventScroll: true });
    }, [confirmed]);

    const goWeek = (next: number) => {
      const bounded = Math.min(weeks - 1, Math.max(0, next));
      if (bounded === week) return;
      setWeek(bounded);
      setDate(firstOpen(bounded));
      setTime(null);
    };

    const pickDay = (iso: string) => {
      if (iso === date) return;
      setDate(iso);
      setTime(null);
    };

    const onDayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      for (let i = dayIndex + step; i >= 0 && i < 7; i += step) {
        const iso = days[i];
        if (iso && slotsFor(iso).length > 0) {
          pickDay(iso);
          event.currentTarget.querySelectorAll<HTMLButtonElement>("button")[i]?.focus();
          return;
        }
      }
    };

    const confirm = () => {
      if (!time) return;
      focusAfter.current = "done";
      setConfirmed(true);
      onConfirm?.({ date, time });
    };

    const navClass = cn(
      "grid size-8 cursor-pointer place-items-center rounded-[10px] border border-zinc-200 bg-white text-zinc-600",
      "transition-[background-color,color,opacity] [transition-duration:180ms] hover:bg-zinc-50 hover:text-zinc-950 motion-reduce:transition-none",
      "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white",
      FOCUS,
    );
    const layer = (shown: boolean): React.CSSProperties => ({
      opacity: shown ? 1 : 0,
      visibility: shown ? "visible" : "hidden",
      transition: shown
        ? `opacity 260ms ${EASE} 140ms, visibility 0s`
        : `opacity 180ms ${EASE}, visibility 0s linear 180ms`,
    });

    return (
      <div
        ref={ref}
        data-tsuna-id="booking-slot-picker"
        data-confirmed={confirmed ? "" : undefined}
        className={cn(
          "w-[440px] max-w-full overflow-clip rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div
          className="relative motion-reduce:!transition-none"
          style={{ height: height ?? undefined, transition: `height 420ms ${EASE}` }}
        >
          <div
            ref={picker}
            aria-hidden={confirmed || undefined}
            className={cn("motion-reduce:!transition-none", confirmed && "absolute inset-x-0 top-0")}
            style={layer(!confirmed)}
          >
            <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">
                {host
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("")}
              </span>
              <div className="min-w-0">
                <h2 className="m-0 truncate text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">
                  {title} with {host}
                </h2>
                <p className="m-0 flex items-center gap-1.5 text-[13px] text-zinc-500 tabular-nums">
                  <Clock aria-hidden className="size-3.5 text-zinc-400" />
                  {durationMinutes} min · Video call
                </p>
              </div>
            </div>

            <div className="px-5 pt-4">
              <div className="flex items-center justify-between gap-3">
                <p key={week} aria-live="polite" className="booking-slot-picker-fade m-0 text-[14px] font-medium text-zinc-900 tabular-nums">
                  {rangeLabel}
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label={text.previousWeek} disabled={week === 0} onClick={() => goWeek(week - 1)} className={navClass}>
                    <ChevronLeft aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={text.nextWeek}
                    disabled={week >= weeks - 1}
                    onClick={() => goWeek(week + 1)}
                    className={navClass}
                  >
                    <ChevronRight aria-hidden className="size-4" />
                  </button>
                </div>
              </div>

              <div
                role="radiogroup"
                aria-label={rangeLabel}
                onKeyDown={onDayKeyDown}
                className="relative mt-3 grid grid-cols-7 rounded-xl bg-zinc-100 p-[3px]"
              >
                {dayIndex >= 0 ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-[3px] left-[3px] rounded-[9px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] motion-reduce:!transition-none"
                    style={{
                      height: "calc(100% - 6px)",
                      width: "calc((100% - 6px) / 7)",
                      transform: `translateX(${dayIndex * 100}%)`,
                      transition: `transform 420ms ${EASE}`,
                    }}
                  />
                ) : null}
                {days.map((iso) => {
                  const meta = describe(iso);
                  const open = slotsFor(iso).length > 0;
                  const selected = iso === date;
                  return (
                    <button
                      key={iso}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${WEEKDAYS_LONG[meta.weekday]}, ${meta.month} ${meta.day}`}
                      disabled={!open}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => pickDay(iso)}
                      className={cn(
                        "relative z-10 flex h-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[9px] border-0 bg-transparent",
                        "transition-colors [transition-duration:180ms] motion-reduce:transition-none",
                        "disabled:cursor-default",
                        selected ? "text-zinc-950" : open ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-300",
                        FOCUS,
                      )}
                    >
                      <span className="text-[11px] font-medium">{WEEKDAYS[meta.weekday]}</span>
                      <span className="text-[15px] leading-none font-semibold tabular-nums">{meta.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 pt-4 pb-4">
              <p id={`${uid}-slots`} className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                {text.slots} · {longDate}
              </p>
              <div key={date} role="group" aria-labelledby={`${uid}-slots`} className="mt-2.5 grid min-h-[148px] grid-cols-2 content-start gap-2">
                {slots.map((slot, index) => {
                  const selected = slot === time;
                  return (
                    <div
                      key={slot}
                      data-selected={selected ? "" : undefined}
                      className="booking-slot-picker-slot flex h-10"
                      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                    >
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setTime(selected ? null : slot)}
                        className={cn(
                          "h-full min-w-0 flex-1 cursor-pointer rounded-xl border text-[14px] font-medium tabular-nums",
                          "transition-[background-color,border-color,color] [transition-duration:180ms] motion-reduce:transition-none",
                          selected
                            ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50",
                          FOCUS,
                        )}
                      >
                        {slot}
                      </button>
                      <div
                        aria-hidden={!selected || undefined}
                        className="min-w-0 shrink-0 grow-0 overflow-hidden motion-reduce:!transition-none"
                        style={{
                          flexBasis: selected ? "54%" : "0%",
                          opacity: selected ? 1 : 0,
                          transition: selected
                            ? `flex-basis 420ms ${EASE}, opacity 260ms ${EASE} 80ms`
                            : `flex-basis 300ms ${EASE}, opacity 130ms ${EASE}`,
                        }}
                      >
                        <button
                          type="button"
                          tabIndex={selected ? 0 : -1}
                          onClick={confirm}
                          className={cn(
                            "ml-1.5 h-full w-[calc(100%-6px)] cursor-pointer rounded-xl border-0 bg-zinc-950 text-[14px] font-medium whitespace-nowrap text-white",
                            "transition-colors [transition-duration:180ms] hover:bg-zinc-800 motion-reduce:transition-none",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70",
                          )}
                        >
                          {text.confirm}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {slots.length === 0 ? (
                  <p className="booking-slot-picker-fade col-span-2 m-0 py-8 text-center text-[13px] text-zinc-400">{text.noSlots}</p>
                ) : null}
              </div>
              <p className="m-0 mt-3 flex items-center gap-1.5 text-[12.5px] text-zinc-400 tabular-nums">
                <Globe aria-hidden className="size-3.5" />
                {timeZone}
              </p>
            </div>
          </div>

          <div
            ref={done}
            aria-hidden={!confirmed || undefined}
            className={cn("motion-reduce:!transition-none", !confirmed && "absolute inset-x-0 top-0")}
            style={layer(confirmed)}
          >
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <span
                key={confirmed ? "on" : "off"}
                aria-hidden
                className={cn("grid size-12 place-items-center rounded-full bg-emerald-500 text-white", confirmed && "booking-slot-picker-pop")}
              >
                <Check strokeWidth={2.8} className="size-6" />
              </span>
              <h2 className="m-0 mt-4 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950" aria-live="polite">
                {confirmed ? text.booked : ""}
              </h2>
              <p className="m-0 mt-1 text-[13px] text-zinc-500">
                {title} with {host}
              </p>
              <dl className="m-0 mt-5 w-full rounded-xl bg-zinc-50 px-4 py-1 text-left text-[14px]">
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">Date</dt>
                  <dd className="m-0 font-medium text-zinc-900 tabular-nums">{longDate}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-zinc-200/70 py-2.5">
                  <dt className="text-zinc-500">Time</dt>
                  <dd className="m-0 font-medium text-zinc-900 tabular-nums">
                    {time ? `${time} – ${endTime(time, durationMinutes)}` : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-zinc-200/70 py-2.5">
                  <dt className="text-zinc-500">Time zone</dt>
                  <dd className="m-0 truncate text-zinc-700 tabular-nums">{timeZone}</dd>
                </div>
              </dl>
              <div className="mt-5 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => {
                    focusAfter.current = "slot";
                    setConfirmed(false);
                  }}
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-[14px] font-medium text-zinc-900",
                    "transition-colors [transition-duration:180ms] hover:bg-zinc-50 motion-reduce:transition-none",
                    FOCUS,
                  )}
                >
                  <ArrowLeft aria-hidden className="size-4 text-zinc-500" />
                  {text.back}
                </button>
                <button
                  type="button"
                  onClick={() => time && onAddToCalendar?.({ date, time })}
                  className={cn(
                    "inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-zinc-950 px-3.5 text-[14px] font-medium text-white",
                    "transition-colors [transition-duration:180ms] hover:bg-zinc-800 motion-reduce:transition-none",
                    FOCUS,
                  )}
                >
                  <CalendarPlus aria-hidden className="size-4" />
                  {text.addToCalendar}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

BookingSlotPicker.displayName = "BookingSlotPicker";
