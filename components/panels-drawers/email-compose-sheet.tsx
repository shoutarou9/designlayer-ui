"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Link,
  Minimize2,
  Paperclip,
  Pencil,
  Smile,
  Type,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EmailComposeAttachment = {
  name: string;
  /** Pre-formatted, e.g. "1.2 MB". */
  size?: string;
};

export type EmailComposeMessage = {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachment: EmailComposeAttachment | null;
};

export type EmailComposeTool = "attach" | "link" | "image" | "emoji" | "format";

export type EmailComposeLabels = {
  title?: string;
  to?: string;
  toPlaceholder?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  send?: string;
  schedule?: string;
  shortcut?: string;
  sent?: string;
  undo?: string;
  compose?: string;
  remove?: string;
  draft?: string;
  saving?: string;
  minimize?: string;
  close?: string;
  restore?: string;
  attach?: string;
  link?: string;
  image?: string;
  emoji?: string;
  format?: string;
};

export type EmailComposeSheetProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultRecipients?: readonly string[];
  defaultSubject?: string;
  defaultBody?: string;
  /** Pass null for no attachment. */
  attachment?: EmailComposeAttachment | null;
  /** Called when the undo window closes without an undo. */
  onSend?: (message: EmailComposeMessage) => void;
  onUndo?: () => void;
  /** The chevron half of the split Send button. */
  onScheduleSend?: (message: EmailComposeMessage) => void;
  /** Toolbar buttons. Without it, the paperclip re-attaches the default attachment. */
  onToolClick?: (tool: EmailComposeTool) => void;
  onMinimize?: () => void;
  onClose?: () => void;
  /** How long the "Message sent" pill stays. */
  undoMs?: number;
  labels?: EmailComposeLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35";
const ICON_BUTTON = cn(
  "grid shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-zinc-400",
  "transition-colors [transition-duration:150ms] hover:bg-zinc-100 hover:text-zinc-800 motion-reduce:transition-none",
  RING,
);
const SHEET_SHADOW = "0 18px 40px -18px rgba(15,23,42,0.28), 0 4px 12px -8px rgba(15,23,42,0.14)";
const PILL_SHADOW = "0 12px 28px -14px rgba(15,23,42,0.35), 0 2px 6px -3px rgba(15,23,42,0.12)";
const PILL_W = 232;
const PILL_H = 44;
const BODY_MIN = 160;
const BODY_MAX = 360;

const CSS = `
@keyframes email-compose-sheet-chip { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: none; } }
@keyframes email-compose-sheet-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.email-compose-sheet-chip { animation: email-compose-sheet-chip 260ms ${POP} both; }
.email-compose-sheet-rise { animation: email-compose-sheet-rise 420ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .email-compose-sheet-chip, .email-compose-sheet-rise { animation: none; }
}
`;

const DEFAULT_LABELS: Required<EmailComposeLabels> = {
  title: "New message",
  to: "To",
  toPlaceholder: "Add a recipient",
  cc: "Cc",
  bcc: "Bcc",
  subject: "Subject",
  body: "Message",
  send: "Send",
  schedule: "Schedule send",
  shortcut: "⌘ Enter",
  sent: "Message sent",
  undo: "Undo",
  compose: "New message",
  remove: "Remove",
  draft: "Draft saved",
  saving: "Saving…",
  minimize: "Minimize",
  close: "Close",
  restore: "Open draft",
  attach: "Attach file",
  link: "Insert link",
  image: "Insert image",
  emoji: "Insert emoji",
  format: "Formatting",
};

const DEFAULT_BODY =
  "Hi Lena,\n\nThe Q4 plan is attached. The two open questions are the launch date for the billing update and who owns the partner webinar.\n\nCould you send comments by Friday?\n\nThanks,\nRen";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "compose" | "sent" | "dismissed" | "minimized" | "closed";

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const splitList = (value: string) =>
  value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const EmailComposeSheet = React.forwardRef<HTMLDivElement, EmailComposeSheetProps>(
  (
    {
      defaultRecipients = ["lena@harborlabs.io"],
      defaultSubject = "Q4 plan for review",
      defaultBody = DEFAULT_BODY,
      attachment = { name: "q4-plan.pdf", size: "1.2 MB" },
      onSend,
      onUndo,
      onScheduleSend,
      onToolClick,
      onMinimize,
      onClose,
      undoMs = 5000,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() ?? false;
    const uid = React.useId();
    const [recipients, setRecipients] = React.useState<string[]>(() => [...defaultRecipients]);
    const [draft, setDraft] = React.useState("");
    const [extra, setExtra] = React.useState<{ cc: boolean; bcc: boolean }>({ cc: false, bcc: false });
    const [cc, setCc] = React.useState("");
    const [bcc, setBcc] = React.useState("");
    const [subject, setSubject] = React.useState(defaultSubject);
    const [body, setBody] = React.useState(defaultBody);
    const [file, setFile] = React.useState<EmailComposeAttachment | null>(attachment);
    const [phase, setPhase] = React.useState<Phase>("compose");
    const [saving, setSaving] = React.useState(false);

    const sendButton = React.useRef<HTMLButtonElement>(null);
    const undoButton = React.useRef<HTMLButtonElement>(null);
    const pillButton = React.useRef<HTMLButtonElement>(null);
    const toInput = React.useRef<HTMLInputElement>(null);
    const bodyRef = React.useRef<HTMLTextAreaElement>(null);
    const focusNext = React.useRef<"send" | "undo" | "pill" | "to" | null>(null);
    const composing = phase === "compose";
    const sheetShown = phase !== "minimized" && phase !== "closed";

    const message = (): EmailComposeMessage => ({
      to: recipients,
      cc: splitList(cc),
      bcc: splitList(bcc),
      subject,
      body,
      attachment: file,
    });

    React.useEffect(() => {
      const target = focusNext.current;
      focusNext.current = null;
      if (target === "send") sendButton.current?.focus({ preventScroll: true });
      if (target === "undo") undoButton.current?.focus({ preventScroll: true });
      if (target === "pill") pillButton.current?.focus({ preventScroll: true });
      if (target === "to") toInput.current?.focus({ preventScroll: true });
    }, [phase]);

    // The pill leaves after undoMs.
    React.useEffect(() => {
      if (phase !== "sent") return;
      const timer = window.setTimeout(() => {
        if (undoButton.current === document.activeElement) focusNext.current = "pill";
        setPhase("dismissed");
        onSend?.(message());
      }, undoMs);
      return () => window.clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, undoMs]);

    // "Saving…" while typing, "Draft saved" shortly after.
    const firstEdit = React.useRef(true);
    React.useEffect(() => {
      if (firstEdit.current) {
        firstEdit.current = false;
        return;
      }
      setSaving(true);
      const timer = window.setTimeout(() => setSaving(false), 700);
      return () => window.clearTimeout(timer);
    }, [recipients, cc, bcc, subject, body, file]);

    // The body grows with its content up to BODY_MAX, then scrolls.
    useIsoLayoutEffect(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.style.height = "auto";
      const next = Math.min(Math.max(el.scrollHeight, BODY_MIN), BODY_MAX);
      el.style.height = `${next}px`;
      el.style.overflowY = el.scrollHeight > BODY_MAX ? "auto" : "hidden";
    }, [body]);

    const addRecipient = (raw: string) => {
      const address = raw.trim().replace(/,$/, "");
      if (!address || !EMAIL.test(address)) return false;
      if (!recipients.includes(address)) setRecipients((current) => [...current, address]);
      setDraft("");
      return true;
    };

    const onToKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if ((event.key === "Enter" && !event.metaKey && !event.ctrlKey) || event.key === ",") {
        event.preventDefault();
        addRecipient(draft);
      } else if (event.key === "Backspace" && draft === "" && recipients.length > 0) {
        setRecipients((current) => current.slice(0, -1));
      }
    };

    const ready = () => {
      if (draft.trim()) addRecipient(draft);
      if (recipients.length === 0 && !EMAIL.test(draft.trim())) {
        toInput.current?.focus();
        return false;
      }
      return true;
    };

    const send = (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!composing || !ready()) return;
      focusNext.current = "undo";
      setPhase("sent");
    };

    const undo = () => {
      focusNext.current = "send";
      setPhase("compose");
      onUndo?.();
    };

    const hide = (next: "minimized" | "closed") => {
      focusNext.current = "pill";
      setPhase(next);
      if (next === "minimized") onMinimize?.();
      else onClose?.();
    };

    const startNew = () => {
      setRecipients([]);
      setDraft("");
      setCc("");
      setBcc("");
      setExtra({ cc: false, bcc: false });
      setSubject("");
      setBody("");
      setFile(null);
      focusNext.current = "to";
      setPhase("compose");
    };

    const restore = () => {
      focusNext.current = "send";
      setPhase("compose");
    };

    const tool = (name: EmailComposeTool) => {
      if (onToolClick) onToolClick(name);
      else if (name === "attach" && !file && attachment) setFile(attachment);
    };

    const tools: { name: EmailComposeTool; icon: typeof Paperclip; label: string }[] = [
      { name: "attach", icon: Paperclip, label: text.attach },
      { name: "link", icon: Link, label: text.link },
      { name: "image", icon: ImageIcon, label: text.image },
      { name: "emoji", icon: Smile, label: text.emoji },
      { name: "format", icon: Type, label: text.format },
    ];

    const quick = reduced ? { duration: 0 } : undefined;
    const pill =
      phase === "dismissed" || phase === "closed"
        ? { label: text.compose, icon: Pencil, onClick: startNew }
        : phase === "minimized"
          ? { label: subject.trim() || text.title, icon: ChevronUp, onClick: restore, aria: text.restore }
          : null;

    const extraRow = (kind: "cc" | "bcc") => (
      <div className="flex h-10 items-center gap-3">
        <label htmlFor={`${uid}-${kind}`} className="shrink-0 text-[13px] text-zinc-400">
          {kind === "cc" ? text.cc : text.bcc}
        </label>
        <input
          id={`${uid}-${kind}`}
          type="text"
          value={kind === "cc" ? cc : bcc}
          onChange={(event) => (kind === "cc" ? setCc : setBcc)(event.target.value)}
          className="h-7 min-w-0 flex-1 rounded-md border-0 bg-transparent text-[13px] text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2"
        />
      </div>
    );

    return (
      <div
        ref={ref}
        data-tsuna-id="email-compose-sheet"
        data-phase={phase}
        className={cn("relative w-[560px] max-w-full text-zinc-900", className)}
        {...props}
      >
        <style>{CSS}</style>

        <motion.div
          className="relative origin-bottom"
          aria-hidden={!sheetShown || undefined}
          initial="hidden"
          animate={sheetShown ? "shown" : "hidden"}
          variants={{
            shown: {
              opacity: 1,
              y: 0,
              scale: 1,
              visibility: "visible",
              transition: reduced ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 },
            },
            hidden: {
              opacity: 0,
              y: reduced ? 0 : 12,
              scale: reduced ? 1 : 0.98,
              transition: { duration: reduced ? 0 : 0.14, ease: "easeOut" },
              transitionEnd: { visibility: "hidden" },
            },
          }}
        >
          {/* The shell is the visible sheet. It shrinks to the pill in the bottom-right corner on send. */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 border border-zinc-200 bg-white motion-reduce:!transition-none"
            style={{
              width: composing ? "100%" : PILL_W,
              height: composing ? "100%" : PILL_H,
              borderRadius: composing ? 16 : PILL_H / 2,
              opacity: phase === "dismissed" ? 0 : 1,
              transform: phase === "dismissed" ? "translateY(8px)" : "none",
              boxShadow: composing ? SHEET_SHADOW : PILL_SHADOW,
              transition: `width 420ms ${EASE}, height 420ms ${EASE}, border-radius 420ms ${EASE}, box-shadow 420ms ${EASE}, opacity 260ms ${EASE}, transform 260ms ${EASE}`,
            }}
          />

          <form
            onSubmit={send}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(event);
            }}
            aria-label={text.title}
            aria-hidden={!composing || undefined}
            className="relative origin-bottom-right motion-reduce:!transition-none"
            style={{
              opacity: composing ? 1 : 0,
              transform: composing ? "none" : "scale(0.94)",
              visibility: composing ? "visible" : "hidden",
              transition: composing
                ? `opacity 260ms ${EASE} 160ms, transform 420ms ${EASE}, visibility 0s`
                : `opacity 180ms ${EASE}, transform 300ms ${EASE}, visibility 0s linear 180ms`,
            }}
          >
            <div className="flex h-11 items-center gap-2 pr-3 pl-4">
              <h2 className="m-0 mr-auto text-[14px] font-semibold tracking-[-0.01em] text-zinc-950">{text.title}</h2>
              <span aria-live="polite" className="mr-1 grid text-[12px] text-zinc-400">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={saving ? "saving" : "saved"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={quick ?? { duration: 0.12 }}
                    className="inline-flex items-center justify-end gap-1 whitespace-nowrap [grid-area:1/1]"
                  >
                    {saving ? null : <Check aria-hidden className="size-3" />}
                    {saving ? text.saving : text.draft}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button type="button" aria-label={text.minimize} onClick={() => hide("minimized")} className={cn(ICON_BUTTON, "size-6")}>
                <Minimize2 aria-hidden className="size-3.5" />
              </button>
              <button type="button" aria-label={text.close} onClick={() => hide("closed")} className={cn(ICON_BUTTON, "size-6")}>
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mt-1 border-b border-zinc-100 px-4">
              <div className="flex min-h-10 items-center gap-3">
                <label htmlFor={`${uid}-to`} className="shrink-0 text-[13px] text-zinc-400">
                  {text.to}
                </label>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-2">
                  {recipients.map((address) => (
                    <span
                      key={address}
                      className="email-compose-sheet-chip group inline-flex h-6 max-w-full items-center rounded-md bg-zinc-100 pr-1 pl-2 text-[12px] text-zinc-800"
                    >
                      <span className="truncate">{address}</span>
                      <button
                        type="button"
                        aria-label={`${text.remove} ${address}`}
                        onClick={() => setRecipients((current) => current.filter((entry) => entry !== address))}
                        className={cn(
                          "ml-0.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-zinc-500",
                          "opacity-0 transition-[opacity,background-color,color] [transition-duration:150ms] group-hover:opacity-100 focus-visible:opacity-100",
                          "hover:bg-zinc-300/70 hover:text-zinc-900 motion-reduce:transition-none",
                          RING,
                        )}
                      >
                        <X aria-hidden className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={toInput}
                    id={`${uid}-to`}
                    type="email"
                    value={draft}
                    placeholder={recipients.length === 0 ? text.toPlaceholder : undefined}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onToKeyDown}
                    onBlur={() => addRecipient(draft)}
                    className="h-6 min-w-[96px] flex-1 border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {(["cc", "bcc"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={extra[kind]}
                      onClick={() => setExtra((current) => ({ ...current, [kind]: !current[kind] }))}
                      className={cn(
                        "cursor-pointer rounded border-0 bg-transparent p-0 text-[12px] transition-colors [transition-duration:150ms] motion-reduce:transition-none",
                        extra[kind] ? "text-zinc-800" : "text-zinc-400 hover:text-zinc-800",
                        RING,
                      )}
                    >
                      {kind === "cc" ? text.cc : text.bcc}
                    </button>
                  ))}
                </span>
              </div>
              {extra.cc ? extraRow("cc") : null}
              {extra.bcc ? extraRow("bcc") : null}
              <input
                aria-label={text.subject}
                type="text"
                value={subject}
                placeholder={text.subject}
                onChange={(event) => setSubject(event.target.value)}
                className="block h-10 w-full border-0 bg-transparent p-0 text-[15px] font-medium text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2"
              />
            </div>

            <div className="p-4">
              <textarea
                ref={bodyRef}
                aria-label={text.body}
                value={body}
                rows={1}
                onChange={(event) => setBody(event.target.value)}
                style={{ minHeight: BODY_MIN, maxHeight: BODY_MAX }}
                className="block w-full resize-none rounded-md border-0 bg-transparent p-0 text-[14px] leading-[1.6] text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-4"
              />
            </div>

            <AnimatePresence initial={false}>
              {file ? (
                <motion.div
                  key="attachment"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={quick ?? { duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3">
                    <span className="group inline-flex h-8 max-w-full items-center gap-2 rounded-lg bg-zinc-100/70 pr-1.5 pl-2.5 text-[12px]">
                      <Paperclip aria-hidden className="size-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate font-medium text-zinc-800">{file.name}</span>
                      {file.size ? <span className="shrink-0 text-zinc-400 tabular-nums">{file.size}</span> : null}
                      <button
                        type="button"
                        aria-label={`${text.remove} ${file.name}`}
                        onClick={() => setFile(null)}
                        className={cn(
                          ICON_BUTTON,
                          "size-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-zinc-200/70",
                        )}
                      >
                        <X aria-hidden className="size-3" />
                      </button>
                    </span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex items-center gap-2 border-t border-zinc-100 p-3">
              <div className="mr-auto flex items-center gap-0.5">
                {tools.map(({ name, icon: Icon, label }) => (
                  <button key={name} type="button" aria-label={label} title={label} onClick={() => tool(name)} className={cn(ICON_BUTTON, "size-7")}>
                    <Icon aria-hidden className="size-4" />
                  </button>
                ))}
              </div>
              <kbd className="hidden font-sans text-[11px] text-zinc-400 sm:inline">{text.shortcut}</kbd>
              <div className="flex h-8 shrink-0 items-stretch overflow-hidden rounded-lg bg-zinc-950 text-white">
                <button
                  ref={sendButton}
                  type="submit"
                  className={cn(
                    "cursor-pointer border-0 bg-transparent px-3.5 text-[13px] font-medium text-white",
                    "transition-colors [transition-duration:150ms] hover:bg-zinc-800 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                  )}
                >
                  {text.send}
                </button>
                <span aria-hidden className="my-2 w-px bg-white/20" />
                <button
                  type="button"
                  aria-label={text.schedule}
                  title={text.schedule}
                  onClick={() => {
                    if (ready()) onScheduleSend?.(message());
                  }}
                  className={cn(
                    "grid w-8 cursor-pointer place-items-center border-0 bg-transparent text-white",
                    "transition-colors [transition-duration:150ms] hover:bg-zinc-800 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                  )}
                >
                  <ChevronDown aria-hidden className="size-4" />
                </button>
              </div>
            </div>
          </form>

          <div
            aria-hidden={phase !== "sent" || undefined}
            className="absolute right-0 bottom-0 flex items-center gap-2 pr-1.5 pl-3.5 motion-reduce:!transition-none"
            style={{
              width: PILL_W,
              height: PILL_H,
              opacity: phase === "sent" ? 1 : 0,
              visibility: phase === "sent" ? "visible" : "hidden",
              transition:
                phase === "sent"
                  ? `opacity 260ms ${EASE} ${reduced ? 0 : 220}ms, visibility 0s`
                  : `opacity 180ms ${EASE}, visibility 0s linear 180ms`,
            }}
          >
            <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
              <Check
                strokeWidth={3}
                className="size-3 motion-reduce:!transition-none"
                style={{
                  transform: phase === "sent" ? "scale(1)" : "scale(0.2)",
                  transition: `transform 420ms ${POP} 260ms`,
                }}
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-zinc-900">{text.sent}</span>
            <button
              ref={undoButton}
              type="button"
              onClick={undo}
              className={cn(
                "h-8 shrink-0 cursor-pointer rounded-full border-0 bg-zinc-100 px-3 text-[13px] font-medium text-zinc-900",
                "transition-colors [transition-duration:180ms] hover:bg-zinc-200 motion-reduce:transition-none",
                RING,
              )}
            >
              {text.undo}
            </button>
          </div>
        </motion.div>

        {pill ? (
          <button
            key={phase === "minimized" ? "restore" : "compose"}
            ref={pillButton}
            type="button"
            aria-label={pill.aria}
            onClick={pill.onClick}
            className={cn(
              "email-compose-sheet-rise absolute right-0 bottom-0 inline-flex h-11 max-w-[280px] cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-[14px] font-medium text-zinc-900",
              "shadow-[0_12px_28px_-14px_rgba(15,23,42,0.35),0_2px_6px_-3px_rgba(15,23,42,0.12)]",
              "transition-colors [transition-duration:180ms] hover:bg-zinc-50 motion-reduce:transition-none",
              FOCUS,
            )}
          >
            <pill.icon aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{pill.label}</span>
          </button>
        ) : null}

        <span aria-live="polite" className="sr-only">
          {phase === "sent" ? text.sent : ""}
        </span>
      </div>
    );
  },
);

EmailComposeSheet.displayName = "EmailComposeSheet";
