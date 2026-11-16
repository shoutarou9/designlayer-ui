"use client";

import * as React from "react";
import { ChevronRight, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type OkrKeyResult = {
  id: string;
  label: string;
  value: number;
  target: number;
  /** Shown after the numbers, e.g. "teams". */
  unit?: string;
  /** Kept for existing data. Rows no longer bump by a step. */
  step?: number;
  /** Shown only when it differs from the objective. */
  owner?: string;
  /** Shown only when it differs from the objective. */
  period?: string;
};

export type OkrStatus = "on-track" | "at-risk" | "behind";

export type OkrObjective = {
  id: string;
  title: string;
  owner: string;
  status: OkrStatus;
  /** Defaults to the quarter shown in the panel. */
  period?: string;
  keyResults: readonly OkrKeyResult[];
};

export type OkrGoalsLabels = {
  overall?: string;
  onTrack?: string;
  atRisk?: string;
  behind?: string;
  update?: string;
  done?: string;
  keyResults?: string;
  keyResult?: string;
  objectives?: string;
  objective?: string;
  name?: string;
  owner?: string;
  period?: string;
  progress?: string;
  add?: string;
};

export type OkrGoalsPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  objectives?: readonly OkrObjective[];
  /** Objectives that start expanded. */
  defaultOpenIds?: readonly string[];
  labels?: OkrGoalsLabels;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 200, damping: 30 } as const;
const PERIOD = "Oct 1 – Dec 31";
const FOCUS =
  "[outline:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/35";
const COLS = "grid grid-cols-[minmax(0,1fr)_160px_120px_200px] items-center gap-x-2 pl-2 pr-10";

const DEFAULT_OBJECTIVES: readonly OkrObjective[] = [
  {
    id: "o1",
    title: "Reach 100 paying teams",
    owner: "Mina Okada",
    status: "on-track",
    keyResults: [
      { id: "k1", label: "Paying teams", value: 62, target: 100, unit: "teams" },
      { id: "k2", label: "Demo calls booked", value: 140, target: 200, unit: "calls" },
    ],
  },
  {
    id: "o2",
    title: "Make onboarding effortless",
    owner: "Ava Brooks",
    status: "at-risk",
    keyResults: [
      { id: "k1", label: "Activation rate", value: 41, target: 60, unit: "%" },
      { id: "k2", label: "Workspaces set up in 5 minutes", value: 30, target: 80, unit: "%" },
      { id: "k3", label: "Onboarding survey score", value: 32, target: 50, unit: "pts" },
    ],
  },
  {
    id: "o3",
    title: "Ship billing v2",
    owner: "Priya Raman",
    status: "on-track",
    keyResults: [
      { id: "k1", label: "Invoices migrated", value: 70, target: 100, unit: "%" },
      { id: "k2", label: "Billing tickets closed", value: 45, target: 90, unit: "tickets" },
    ],
  },
];

const DEFAULT_LABELS: Required<OkrGoalsLabels> = {
  overall: "Overall progress",
  onTrack: "On track",
  atRisk: "At risk",
  behind: "Behind",
  update: "Update",
  done: "Done",
  keyResults: "key results",
  keyResult: "key result",
  objectives: "objectives",
  objective: "objective",
  name: "Name",
  owner: "Owner",
  period: "Period",
  progress: "Progress",
  add: "Add key result",
};

const STATUS_FILL: Record<OkrStatus, string> = {
  "on-track": "bg-emerald-500",
  "at-risk": "bg-amber-500",
  behind: "bg-destructive",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function countLabel(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Counts from the value on screen to `target`. */
function useCountTo(target: number, reduced: boolean) {
  const [shown, setShown] = React.useState(target);
  const live = React.useRef(target);
  React.useEffect(() => {
    if (reduced || live.current === target) {
      live.current = target;
      setShown(target);
      return;
    }
    const from = live.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 200);
      const value = from + (target - from) * (1 - Math.pow(1 - t, 3));
      live.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return shown;
}

function Count({ value, reduced, suffix = "" }: { value: number; reduced: boolean; suffix?: string }) {
  const shown = useCountTo(value, reduced);
  return (
    <span className="tabular-nums">
      {Math.round(shown)}
      {suffix}
    </span>
  );
}

const ratio = (target: number, value: number) => (target > 0 ? Math.min(1, Math.max(0, value / target)) : 0);

function Bar({
  value,
  reduced,
  className,
  track,
}: {
  value: number;
  reduced: boolean;
  className: string;
  track: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-full", track)}>
      <motion.div
        className={cn("h-full w-full origin-left rounded-full", className)}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: value }}
        transition={reduced ? { duration: 0 } : SPRING}
      />
    </div>
  );
}

function Avatar({ name, size }: { name: string; size: "sm" | "md" }) {
  return (
    <span
      title={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-zinc-100 font-semibold text-zinc-600",
        size === "md" ? "size-6 text-[10px]" : "size-5 text-[9px]",
      )}
    >
      {initials(name)}
    </span>
  );
}

function ProgressCell({
  value,
  reduced,
  fill,
  bar,
  figure,
}: {
  value: number;
  reduced: boolean;
  fill: string;
  bar: string;
  figure: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Bar value={value} reduced={reduced} track={cn("min-w-0 flex-1 bg-zinc-100", bar)} className={fill} />
      <span className="w-[4.75rem] shrink-0 whitespace-nowrap text-right">{figure}</span>
    </div>
  );
}

export const OkrGoalsPanel = React.forwardRef<HTMLDivElement, OkrGoalsPanelProps>(
  (
    {
      title = "Q4 2026 goals",
      objectives = DEFAULT_OBJECTIVES,
      defaultOpenIds,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const uid = React.useId();
    const [openIds, setOpenIds] = React.useState<readonly string[]>(
      () => defaultOpenIds ?? objectives.slice(0, 2).map((objective) => objective.id),
    );
    const [extra, setExtra] = React.useState<Record<string, OkrKeyResult[]>>({});
    const [draftId, setDraftId] = React.useState<string | null>(null);
    const [draft, setDraft] = React.useState("");
    const draftRef = React.useRef<HTMLInputElement>(null);
    const saving = React.useRef(false);

    const resultsFor = (objective: OkrObjective) => [...objective.keyResults, ...(extra[objective.id] ?? [])];
    const progressOf = (objective: OkrObjective) => {
      const results = resultsFor(objective);
      return results.length === 0 ? 0 : results.reduce((sum, keyResult) => sum + ratio(keyResult.target, keyResult.value), 0) / results.length;
    };
    const overall =
      objectives.length === 0 ? 0 : objectives.reduce((sum, objective) => sum + progressOf(objective), 0) / objectives.length;
    const keyResultCount = objectives.reduce((sum, objective) => sum + resultsFor(objective).length, 0);

    const statusName = (status: OkrStatus) =>
      status === "at-risk" ? text.atRisk : status === "behind" ? text.behind : text.onTrack;

    React.useEffect(() => {
      if (draftId) draftRef.current?.focus();
    }, [draftId]);

    const toggle = (id: string) => {
      setOpenIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
    };

    const startAdd = (objectiveId: string) => {
      setOpenIds((current) => (current.includes(objectiveId) ? current : [...current, objectiveId]));
      setDraftId(objectiveId);
      setDraft("");
    };

    const saveDraft = () => {
      const label = draft.trim();
      const objectiveId = draftId;
      saving.current = true;
      setDraftId(null);
      if (!objectiveId || !label) return;
      const id = `new-${objectiveId}-${extra[objectiveId]?.length ?? 0}`;
      setExtra((current) => ({
        ...current,
        [objectiveId]: [...(current[objectiveId] ?? []), { id, label, value: 0, target: 100 }],
      }));
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="okr-goals-panel"
        className={cn(
          "w-[840px] max-w-full rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
            <p className="m-0 mt-1 text-[13px] text-zinc-500">
              {countLabel(objectives.length, text.objective, text.objectives)}
              {" · "}
              {countLabel(keyResultCount, text.keyResult, text.keyResults)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="m-0 text-[15px] leading-none font-semibold text-zinc-950" aria-live="polite">
              <Count value={overall * 100} reduced={reduced} suffix="%" />
            </p>
            <Bar value={overall} reduced={reduced} track="h-1.5 w-[120px] bg-zinc-100" className="bg-zinc-900" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
          <div className={cn(COLS, "h-9 border-b border-zinc-100 text-[12px] text-zinc-500")}>
            <span>{text.name}</span>
            <span>{text.owner}</span>
            <span>{text.period}</span>
            <span>{text.progress}</span>
          </div>
          <ul className="m-0 list-none divide-y divide-zinc-100 p-0">
            {objectives.map((objective) => {
              const open = openIds.includes(objective.id);
              const results = resultsFor(objective);
              const fill = STATUS_FILL[objective.status];
              const period = objective.period ?? PERIOD;
              const drafting = draftId === objective.id;
              const showLine = open && (results.length > 0 || drafting);
              return (
                <li key={objective.id}>
                  <div className="group relative">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`${uid}-${objective.id}`}
                      onClick={() => toggle(objective.id)}
                      className={cn(COLS, "h-[52px] w-full cursor-pointer border-0 bg-transparent text-left hover:bg-zinc-50", FOCUS)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ChevronRight
                          aria-hidden
                          className={cn("size-3.5 shrink-0 text-zinc-400", !reduced && "transition-transform duration-200", open && "rotate-90")}
                        />
                        <span className="truncate text-[14px] font-medium text-zinc-900">{objective.title}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={objective.owner} size="md" />
                        <span className="truncate text-[13px] text-zinc-900">{objective.owner}</span>
                      </span>
                      <span className="truncate text-[13px] text-zinc-500 tabular-nums">{period}</span>
                      <ProgressCell
                        value={progressOf(objective)}
                        reduced={reduced}
                        fill={fill}
                        bar="h-1.5"
                        figure={
                          <span className="text-[13px] font-medium text-zinc-900">
                            <span className="sr-only">{statusName(objective.status)} </span>
                            <Count value={progressOf(objective) * 100} reduced={reduced} suffix="%" />
                          </span>
                        }
                      />
                    </button>
                    {showLine ? (
                      <span aria-hidden className="pointer-events-none absolute top-[33px] bottom-0 left-[15px] z-10 w-px bg-zinc-200" />
                    ) : null}
                    <button
                      type="button"
                      aria-label={text.add}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => startAdd(objective.id)}
                      className={cn(
                        "absolute top-1/2 right-2 z-10 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400",
                        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-zinc-100 hover:text-zinc-900",
                        FOCUS,
                      )}
                    >
                      <Plus aria-hidden className="size-3.5" />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        key="results"
                        id={`${uid}-${objective.id}`}
                        role="region"
                        aria-label={objective.title}
                        layout
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
                        className="relative overflow-hidden"
                      >
                        <span aria-hidden className="absolute top-0 bottom-5 left-[15px] w-px bg-zinc-200" />
                        <ul className="m-0 list-none divide-y divide-zinc-100 border-t border-zinc-100 p-0">
                          {results.map((keyResult) => {
                            const owner = keyResult.owner && keyResult.owner !== objective.owner ? keyResult.owner : "";
                            const rowPeriod = keyResult.period && keyResult.period !== period ? keyResult.period : "";
                            return (
                              <li key={keyResult.id} className={cn(COLS, "h-10 hover:bg-zinc-50")}>
                                <span className="min-w-0 truncate pl-7 text-[13px] text-zinc-500">{keyResult.label}</span>
                                {owner ? (
                                  <span className="flex min-w-0 items-center gap-2">
                                    <Avatar name={owner} size="sm" />
                                    <span className="truncate text-[13px] text-zinc-500">{owner}</span>
                                  </span>
                                ) : (
                                  <span />
                                )}
                                <span className="truncate text-[13px] text-zinc-500 tabular-nums">{rowPeriod}</span>
                                <ProgressCell
                                  value={ratio(keyResult.target, keyResult.value)}
                                  reduced={reduced}
                                  fill={fill}
                                  bar="h-1"
                                  figure={
                                    <span className="text-[13px] text-zinc-500">
                                      <Count value={keyResult.value} reduced={reduced} />
                                      {" / "}
                                      {keyResult.target}
                                    </span>
                                  }
                                />
                              </li>
                            );
                          })}
                          {drafting ? (
                            <li className={cn(COLS, "h-10")}>
                              <input
                                ref={draftRef}
                                aria-label={text.add}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") saveDraft();
                                  if (event.key === "Escape") setDraftId(null);
                                }}
                                onBlur={() => {
                                  if (saving.current) {
                                    saving.current = false;
                                    return;
                                  }
                                  setDraftId(null);
                                }}
                                className={cn(
                                  "ml-7 h-7 w-[calc(100%-1.75rem)] rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-900",
                                  FOCUS,
                                )}
                              />
                            </li>
                          ) : null}
                        </ul>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  },
);

OkrGoalsPanel.displayName = "OkrGoalsPanel";
