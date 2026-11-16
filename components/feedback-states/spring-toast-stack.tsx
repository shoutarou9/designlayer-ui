"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { AlarmClock, AlertCircle, Bell, Check, Loader2, MessageCircle, Settings, X } from "lucide-react";
import { GlassFilter } from "@/lib/liquid-glass";
import { coerceDisplayText } from "@/lib/coerceActionNodes";
import { cn } from "@/lib/utils";

export type SpringToastPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export type SpringToastTone = "success" | "error" | "loading";

export type SpringToastIcon = "comment" | "reminder" | "build" | "mention";

export type SpringToastOptions = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: SpringToastTone;
  icon?: SpringToastIcon;
  duration?: number;
  actionLabel?: ReactNode;
  onAction?: () => void;
};

type SpringToastRecord = {
  id: string;
  title: string;
  description?: string;
  tone: SpringToastTone;
  icon?: SpringToastIcon;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
};

export type SpringToastApi = {
  toast: (input: SpringToastOptions | string) => string;
  update: (id: string, patch: Partial<SpringToastOptions>) => void;
  dismiss: (id: string) => void;
};

export type SpringToastStackProps = {
  position?: SpringToastPosition;
  /** Milliseconds before a success or error toast dismisses itself. */
  duration?: number;
  /** How many toasts stay on screen. Older ones wait behind this cap. */
  maxVisible?: number;
  onDismiss?: (id: string) => void;
  closeLabel?: string;
  regionLabel?: string;
  className?: string;
  children?: ReactNode;
};

export type SpringToastStackDemoLabels = {
  save: string;
  invite: string;
  uploadFail: string;
  uploadLoading: string;
  saved: string;
  inviteSent: string;
  uploadFailed: string;
  retry: string;
  uploading: string;
  uploadDone: string;
  close: string;
  region: string;
  savedBody: string;
  inviteBody: string;
  uploadFailedBody: string;
  uploadingBody: string;
  uploadDoneBody: string;
};

export const SPRING_TOAST_STACK_DEMO_LABELS: SpringToastStackDemoLabels = {
  save: "Save",
  invite: "Send invite",
  uploadFail: "Upload (fails)",
  uploadLoading: "Upload (loading -> done)",
  saved: "Saved",
  inviteSent: "Invite sent",
  uploadFailed: "Upload failed",
  retry: "Retry",
  uploading: "Uploading…",
  uploadDone: "Upload complete",
  close: "Dismiss notification",
  region: "Notifications",
  savedBody: "Your changes are stored",
  inviteBody: "They’ll get an email shortly",
  uploadFailedBody: "Check the file and try again",
  uploadingBody: "This usually takes a moment",
  uploadDoneBody: "The file is ready",
};

const SPRING = { type: "spring" as const, stiffness: 460, damping: 34, mass: 0.78 };
const STORE_LIMIT = 8;
let toastSeq = 0;
let activeApi: SpringToastApi | null = null;

const SpringToastContext = createContext<SpringToastApi | null>(null);

function asPlainString(value: ReactNode | undefined, fallback: string): string {
  const text = coerceDisplayText(value);
  if (typeof text === "string" && text.trim()) return text;
  if (typeof text === "number" || typeof text === "bigint") return String(text);
  return fallback;
}

function usePrefersReducedMotion() {
  const fromMotion = useReducedMotion() === true;
  const [fromMedia, setFromMedia] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setFromMedia(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return fromMotion || fromMedia;
}

function nextToastId() {
  toastSeq += 1;
  return `spring-toast-${toastSeq}`;
}

/** Push a toast onto the mounted stack. Returns the toast id. */
export function toast(input: SpringToastOptions | string): string {
  if (!activeApi) return "";
  return activeApi.toast(input);
}

/** `toast`, `update`, and `dismiss` for the nearest stack. */
export function useToast(): SpringToastApi {
  const ctx = useContext(SpringToastContext);
  if (ctx) return ctx;
  return {
    toast,
    update: (id, patch) => activeApi?.update(id, patch),
    dismiss: (id) => activeApi?.dismiss(id),
  };
}

const TOAST_ICONS = {
  comment: { wrap: "bg-[#d7ebff]", glyph: "text-[#3b82f6]", Icon: MessageCircle },
  reminder: { wrap: "bg-[#ffe4c7]", glyph: "text-[#f97316]", Icon: AlarmClock },
  build: { wrap: "bg-[#efe0ff]", glyph: "text-[#a855f7]", Icon: Settings },
  mention: { wrap: "bg-[#fff1c2]", glyph: "text-[#e0a100]", Icon: Bell },
  success: { wrap: "bg-[#dcfce7]", glyph: "text-[#16a34a]", Icon: Check },
  error: { wrap: "bg-[#fee2e2]", glyph: "text-[#ef4444]", Icon: AlertCircle },
  loading: { wrap: "bg-[#f4f4f5]", glyph: "text-[#52525b]", Icon: Loader2 },
} as const;

function ToastGlyph({
  tone,
  icon,
  reduce,
}: {
  tone: SpringToastTone;
  icon?: SpringToastIcon;
  reduce: boolean;
}) {
  const spec = TOAST_ICONS[icon ?? tone];
  const Glyph = spec.Icon;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", spec.wrap)}>
      <Glyph className={cn("size-4", spec.glyph, tone === "loading" && !icon && !reduce && "animate-spin")} aria-hidden />
    </span>
  );
}

function ToastCard({
  toast: item,
  reduce,
  fromTop,
  index,
  expanded,
  paused,
  closeLabel,
  onDismiss,
  onDragLock,
}: {
  toast: SpringToastRecord;
  reduce: boolean;
  fromTop: boolean;
  index: number;
  expanded: boolean;
  paused: boolean;
  closeLabel: string;
  onDismiss: (id: string) => void;
  onDragLock: (locked: boolean) => void;
}) {
  const x = useMotionValue(0);
  const lifeKey = `${item.tone}:${item.title}:${item.duration}`;
  const remaining = useRef(item.duration);
  const lifeRef = useRef(lifeKey);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const collapsed = !expanded && index > 0;
  const titleId = `${item.id}-title`;

  useEffect(() => {
    if (lifeRef.current !== lifeKey) {
      lifeRef.current = lifeKey;
      remaining.current = item.duration;
    }
    if (item.tone === "loading" || item.duration <= 0 || paused) return;
    const start = performance.now();
    const left = remaining.current;
    const timer = window.setTimeout(() => onDismissRef.current(item.id), left);
    return () => {
      window.clearTimeout(timer);
      if (lifeRef.current !== lifeKey) return;
      remaining.current = Math.max(0, left - (performance.now() - start));
    };
  }, [item.duration, item.id, item.tone, lifeKey, paused]);

  const finishDrag = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    onDragLock(false);
    const distance = Math.abs(info.offset.x);
    const velocity = Math.abs(info.velocity.x);
    const passed = distance > 88 || velocity > 700;
    if (!passed) {
      void animate(x, 0, SPRING);
      return;
    }
    const direction = info.offset.x < 0 ? -1 : 1;
    if (reduce) {
      onDismiss(item.id);
      return;
    }
    void animate(x, direction * 280, { type: "spring", stiffness: 420, damping: 32 }).then(
      () => onDismiss(item.id),
      () => onDismiss(item.id),
    );
  };

  const deckY = fromTop ? index * 12 : index * -12;
  const deckScale = 1 - index * 0.045;

  return (
    <motion.li
      layout={!reduce}
      className={cn("w-full", collapsed && "absolute inset-x-0")}
      style={{
        zIndex: 40 - index,
        transformOrigin: fromTop ? "top center" : "bottom center",
        ...(collapsed ? (fromTop ? { top: 0 } : { bottom: 0 }) : null),
      }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: fromTop ? -24 : 28, scale: 0.98 }}
      animate={
        reduce || expanded
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: deckY, scale: deckScale }
      }
      exit={reduce ? { opacity: 0, transition: { duration: 0.16 } } : { opacity: 0, transition: { duration: 0.14 } }}
      transition={reduce ? { duration: 0.16 } : SPRING}
    >
      <motion.div
        drag={reduce ? false : "x"}
        dragMomentum={false}
        dragElastic={0.18}
        style={{ x }}
        onDragStart={() => onDragLock(true)}
        onDragEnd={finishDrag}
        className="w-full"
      >
        <article
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={item.tone === "loading" ? true : undefined}
          aria-labelledby={titleId}
          className="group relative w-full overflow-hidden rounded-full border border-white/80 text-zinc-950 shadow-[0_10px_28px_rgba(15,23,42,0.16)]"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backdropFilter: "blur(14px) saturate(1.8) url(#glass-distortion)",
              WebkitBackdropFilter: "blur(14px) saturate(1.8) url(#glass-distortion)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.08)_42%,rgba(255,255,255,0.28)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.45)]"
            aria-hidden
          />
          <div className="relative flex w-full items-center gap-2.5 py-1.5 pl-1.5 pr-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={item.icon ?? item.tone}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={reduce ? { duration: 0.16 } : SPRING}
              className="flex"
            >
              <ToastGlyph tone={item.tone} icon={item.icon} reduce={reduce} />
            </motion.span>
          </AnimatePresence>
          <div className="min-w-0 flex-1 py-0.5 pr-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${item.tone}-${item.title}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={reduce ? { duration: 0.16 } : { duration: 0.22 }}
              >
                <p id={titleId} className="truncate text-[13px] font-semibold leading-4 tracking-tight text-zinc-950">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="truncate text-xs leading-4 text-zinc-500">{item.description}</p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
          {item.actionLabel ? (
            <button
              type="button"
              onClick={() => item.onAction?.()}
              className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-[#3b82f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {item.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label={closeLabel}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-white/50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <X className="size-3.5" aria-hidden />
          </button>
          </div>
        </article>
      </motion.div>
    </motion.li>
  );
}

export function SpringToastStack({
  position = "bottom-right",
  duration = 4800,
  maxVisible = 3,
  onDismiss,
  closeLabel = "Dismiss notification",
  regionLabel = "Notifications",
  className,
  children,
}: SpringToastStackProps) {
  const reduce = usePrefersReducedMotion();
  const fromTop = position.startsWith("top");
  const cap = Math.max(1, maxVisible);
  const [items, setItems] = useState<SpringToastRecord[]>([]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const durationRef = useRef(duration);
  const onDismissRef = useRef(onDismiss);
  durationRef.current = duration;
  onDismissRef.current = onDismiss;
  const reactId = useId();
  const [regionId, setRegionId] = useState("spring-toast-stack");

  useEffect(() => {
    setRegionId(reactId.replace(/:/g, ""));
  }, [reactId]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => {
      if (!prev.some((item) => item.id === id)) return prev;
      queueMicrotask(() => onDismissRef.current?.(id));
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const push = useCallback((input: SpringToastOptions | string) => {
    const options: SpringToastOptions = typeof input === "string" ? { title: input } : input;
    const id = asPlainString(options.id, "").trim() || nextToastId();
    const description = options.description == null ? undefined : asPlainString(options.description, "");
    const actionLabel = options.actionLabel == null ? undefined : asPlainString(options.actionLabel, "");
    const record: SpringToastRecord = {
      id,
      title: asPlainString(options.title, "Saved"),
      description: description || undefined,
      tone: options.tone ?? "success",
      icon: options.icon,
      duration: options.duration ?? durationRef.current,
      actionLabel: actionLabel || undefined,
      onAction: options.onAction,
    };
    setItems((prev) => [record, ...prev.filter((item) => item.id !== id)].slice(0, STORE_LIMIT));
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<SpringToastOptions>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const description =
          patch.description === undefined ? item.description : asPlainString(patch.description, "") || undefined;
        const actionLabel =
          patch.actionLabel === undefined ? item.actionLabel : asPlainString(patch.actionLabel, "") || undefined;
        return {
          ...item,
          title: patch.title === undefined ? item.title : asPlainString(patch.title, item.title),
          description,
          tone: patch.tone ?? item.tone,
          icon: patch.icon === undefined ? item.icon : patch.icon,
          duration: patch.duration ?? item.duration,
          actionLabel,
          onAction: patch.onAction === undefined ? item.onAction : patch.onAction,
        };
      }),
    );
  }, []);

  const api = useMemo<SpringToastApi>(() => ({ toast: push, update, dismiss }), [push, update, dismiss]);

  useLayoutEffect(() => {
    activeApi = api;
    return () => {
      if (activeApi === api) activeApi = null;
    };
  }, [api]);

  const visible = items.slice(0, cap);
  const expanded = true;
  const paused = hovered || focused || dragging;
  const closeText = asPlainString(closeLabel, "Dismiss notification");
  const regionText = asPlainString(regionLabel, "Notifications");

  const anchor =
    position === "bottom-left"
      ? "bottom-10 left-8 items-start"
      : position === "top-right"
        ? "top-10 right-8 items-end"
        : position === "top-left"
          ? "top-10 left-8 items-start"
          : "bottom-24 right-10 items-end";

  const list = (
    <ol
      className={cn(
        "relative flex w-full",
        fromTop ? "flex-col gap-2" : "flex-col-reverse gap-2",
      )}
    >
      <AnimatePresence initial={false}>
        {visible.map((item, index) => (
          <ToastCard
            key={item.id}
            toast={item}
            reduce={reduce}
            fromTop={fromTop}
            index={index}
            expanded={expanded}
            paused={paused}
            closeLabel={closeText}
            onDismiss={dismiss}
            onDragLock={setDragging}
          />
        ))}
      </AnimatePresence>
    </ol>
  );

  return (
    <SpringToastContext.Provider value={api}>
      {children}
      <GlassFilter />
      <style>{"@keyframes spring-toast-life{from{transform:scaleX(1)}to{transform:scaleX(0)}}"}</style>
      <div className={cn("pointer-events-none fixed z-50 flex w-[min(22rem,calc(100vw-2.5rem))]", anchor, className)}>
        <div
          id={regionId}
          role="region"
          aria-label={regionText}
          className="pointer-events-auto relative w-full"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
          }}
        >
          {list}
        </div>
      </div>
    </SpringToastContext.Provider>
  );
}

function DemoButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      )}
    >
      {children}
    </button>
  );
}

function SpringToastStackDemoControls({ labels }: { labels: SpringToastStackDemoLabels }) {
  const api = useToast();
  const seq = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <DemoButton
          onClick={() => api.toast({ title: labels.saved, description: labels.savedBody, tone: "success" })}
        >
          {labels.save}
        </DemoButton>
        <DemoButton
          onClick={() =>
            api.toast({ title: labels.inviteSent, description: labels.inviteBody, tone: "success", icon: "comment" })
          }
        >
          {labels.invite}
        </DemoButton>
        <DemoButton
          onClick={() => {
            seq.current += 1;
            const id = `demo-fail-${seq.current}`;
            api.toast({
              id,
              title: labels.uploadFailed,
              description: labels.uploadFailedBody,
              tone: "error",
              actionLabel: labels.retry,
              onAction: () => api.dismiss(id),
            });
          }}
        >
          {labels.uploadFail}
        </DemoButton>
        <DemoButton
          onClick={() => {
            seq.current += 1;
            const id = `demo-load-${seq.current}`;
            api.toast({ id, title: labels.uploading, description: labels.uploadingBody, tone: "loading" });
            const timer = window.setTimeout(() => {
              api.update(id, { title: labels.uploadDone, description: labels.uploadDoneBody, tone: "success", icon: "build" });
            }, 1500);
            timers.current.push(timer);
          }}
        >
          {labels.uploadLoading}
        </DemoButton>
      </div>
    </div>
  );
}

export function SpringToastStackDemo({
  labels,
  className,
}: {
  labels?: Partial<SpringToastStackDemoLabels>;
  className?: string;
}) {
  const copy = { ...SPRING_TOAST_STACK_DEMO_LABELS, ...labels };

  return (
    <SpringToastStackStage className={className}>
      <SpringToastStack closeLabel={copy.close} regionLabel={copy.region}>
        <SpringToastStackDemoControls labels={copy} />
      </SpringToastStack>
    </SpringToastStackStage>
  );
}

export function SpringToastStackStage({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-tsuna-id="spring-toast-stack"
      className={cn("relative min-h-screen w-full overflow-hidden bg-white text-zinc-800", className)}
    >
      <div
        className="pointer-events-none absolute -bottom-16 right-[-4rem] size-[42rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.7),rgba(56,189,248,0)_68%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-10 right-40 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.62),rgba(244,114,182,0)_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-36 right-6 size-[22rem] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.55),rgba(167,139,250,0)_70%)]"
        aria-hidden
      />
      {children}
    </div>
  );
}
