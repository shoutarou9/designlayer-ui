"use client";

import * as React from "react";
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type ApiKeyFieldProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onCopy"
> & {
  /** The full secret. Only the prefix and last four characters show while masked. */
  value: string;
  label?: string;
  /** Small line under the field. Pass "" to hide it. */
  hint?: string;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  onCopy?: (value: string) => void;
  copyLabel?: string;
  copiedLabel?: string;
  revealLabel?: string;
  hideLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** "sk_live_51Nx…4242" → prefix "sk_live_", tail "4242". */
function maskParts(value: string) {
  const prefix = value.match(/^([A-Za-z]+_(?:(?:live|test)_)?)/)?.[1] ?? "";
  const tail = value.length - prefix.length > 4 ? value.slice(-4) : "";
  return { prefix, tail };
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back below
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export const ApiKeyField = React.forwardRef<HTMLDivElement, ApiKeyFieldProps>(
  (
    {
      value,
      label = "Secret key",
      hint = "Keep this key on your server. Never ship it to the browser.",
      revealed,
      defaultRevealed = false,
      onRevealedChange,
      onCopy,
      copyLabel = "Copy",
      copiedLabel = "Copied",
      revealLabel = "Reveal key",
      hideLabel = "Hide key",
      className,
      ...props
    },
    ref,
  ) => {
    const id = React.useId();
    const [uncontrolledRevealed, setUncontrolledRevealed] =
      React.useState(defaultRevealed);
    const shown = revealed ?? uncontrolledRevealed;
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const { prefix, tail } = maskParts(value);

    React.useEffect(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
      },
      [],
    );

    const toggle = () => {
      const next = !shown;
      if (revealed === undefined) setUncontrolledRevealed(next);
      onRevealedChange?.(next);
    };

    const copy = async () => {
      const ok = await writeClipboard(value);
      if (!ok) return;
      setCopied(true);
      onCopy?.(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    };

    const layer = (visible: boolean): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      filter: visible ? "blur(0)" : "blur(5px)",
      transform: visible ? "none" : "translateY(3px)",
      transition: `opacity 360ms ${EASE}, filter 420ms ${EASE}, transform 420ms ${EASE}`,
    });

    const iconButton = cn(
      "grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-zinc-500",
      "transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
    );

    return (
      <div
        ref={ref}
        data-tsuna-id="api-key-field"
        data-revealed={shown ? "" : undefined}
        className={cn("flex w-[400px] max-w-full flex-col gap-2", className)}
        {...props}
      >
        <span
          id={`${id}-label`}
          className="px-1 text-[13px] font-semibold tracking-[-0.01em] text-zinc-800"
        >
          {label}
        </span>
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          className={cn(
            "flex h-14 items-center gap-1 rounded-[16px] bg-white py-2 pr-2 pl-3",
            "shadow-[0_14px_32px_-20px_rgba(15,23,42,0.4),inset_0_0_0_1px_rgba(15,23,42,0.09)]",
          )}
        >
          <span
            aria-hidden
            className="mr-1.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-zinc-900 text-white"
          >
            <KeyRound className="size-[15px]" strokeWidth={2.1} />
          </span>
          <span className="relative grid min-w-0 flex-1 font-mono text-[13.5px] tracking-[0.01em] text-zinc-900">
            <span
              aria-hidden={!shown}
              className="col-start-1 row-start-1 truncate motion-reduce:!transition-none"
              style={layer(shown)}
            >
              {value}
            </span>
            <span
              aria-hidden={shown}
              className="col-start-1 row-start-1 truncate motion-reduce:!transition-none"
              style={layer(!shown)}
            >
              {prefix}
              <span className="tracking-[0.12em] text-zinc-400">••••••••</span>
              {tail}
            </span>
          </span>
          <button
            type="button"
            aria-pressed={shown}
            aria-label={shown ? hideLabel : revealLabel}
            onClick={toggle}
            className={iconButton}
          >
            <span className="grid">
              <Eye
                aria-hidden
                className="col-start-1 row-start-1 size-[17px] motion-reduce:!transition-none"
                strokeWidth={2}
                style={{
                  opacity: shown ? 0 : 1,
                  transform: shown ? "scale(0.6)" : "none",
                  transition: `opacity 240ms ${EASE}, transform 360ms ${EASE}`,
                }}
              />
              <EyeOff
                aria-hidden
                className="col-start-1 row-start-1 size-[17px] motion-reduce:!transition-none"
                strokeWidth={2}
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "none" : "scale(0.6)",
                  transition: `opacity 240ms ${EASE}, transform 360ms ${EASE}`,
                }}
              />
            </span>
          </button>
          <button
            type="button"
            aria-label={copied ? copiedLabel : copyLabel}
            onClick={copy}
            className={cn(
              iconButton,
              "flex w-auto min-w-9 gap-0 px-2.5",
              copied &&
                "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600",
            )}
          >
            <span aria-hidden className="grid">
              <Copy
                className="col-start-1 row-start-1 size-[16px] motion-reduce:!transition-none"
                strokeWidth={2}
                style={{
                  opacity: copied ? 0 : 1,
                  transform: copied ? "scale(0.5) rotate(-30deg)" : "none",
                  transition: `opacity 220ms ${EASE}, transform 380ms ${EASE}`,
                }}
              />
              <Check
                className="col-start-1 row-start-1 size-[17px] motion-reduce:!transition-none"
                strokeWidth={2.6}
                style={{
                  opacity: copied ? 1 : 0,
                  transform: copied ? "none" : "scale(0.5) rotate(30deg)",
                  transition: `opacity 220ms ${EASE}, transform 420ms ${EASE}`,
                }}
              />
            </span>
            <span
              aria-hidden
              className="overflow-hidden text-[12.5px] font-semibold whitespace-nowrap motion-reduce:!transition-none"
              style={{
                maxWidth: copied ? "5rem" : "0rem",
                marginLeft: copied ? "0.375rem" : "0rem",
                opacity: copied ? 1 : 0,
                transition: `max-width 420ms ${EASE}, margin-left 420ms ${EASE}, opacity 300ms ${EASE}`,
              }}
            >
              {copiedLabel}
            </span>
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? copiedLabel : ""}
          </span>
        </div>
        {hint ? (
          <span className="px-1 text-[12px] leading-5 text-zinc-500">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

ApiKeyField.displayName = "ApiKeyField";
