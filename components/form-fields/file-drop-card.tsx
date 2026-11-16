"use client";

import * as React from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FileDropCardFile = {
  name: string;
  /** Pre-formatted, e.g. "2.4 MB". */
  sizeLabel?: string;
};

export type FileDropCardProps = React.ComponentPropsWithoutRef<"div"> & {
  label?: string;
  hint?: string;
  browseLabel?: string;
  /**
   * Attached file. `null` shows the empty state; leave unset to let the card
   * keep the last dropped or picked file itself.
   */
  file?: FileDropCardFile | null;
  /** Called with the dropped or picked file. Nothing is uploaded. */
  onFile?: (file: File) => void;
  onRemove?: () => void;
  removeLabel?: string;
  accept?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes file-drop-card-chip { 0% { opacity: 0; transform: translateY(-14px) scale(0.94); } 60% { opacity: 1; } 100% { opacity: 1; transform: none; } }
@keyframes file-drop-card-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes file-drop-card-march { to { stroke-dashoffset: -20; } }
.file-drop-card-chip { animation: file-drop-card-chip 520ms ${EASE} both; }
.file-drop-card-fill { transform-origin: left; animation: file-drop-card-fill 900ms ${EASE} 160ms both; }
.file-drop-card-march { animation: file-drop-card-march 0.8s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .file-drop-card-chip, .file-drop-card-fill, .file-drop-card-march { animation: none; }
}
`;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FileDropCard = React.forwardRef<HTMLDivElement, FileDropCardProps>(
  (
    {
      label = "Drop files to attach",
      hint = "PDF, PNG, or CSV · up to 10 MB",
      browseLabel = "or browse",
      file,
      onFile,
      onRemove,
      removeLabel = "Remove file",
      accept,
      className,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [local, setLocal] = React.useState<FileDropCardFile | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const depth = React.useRef(0);
    const attached = file === undefined ? local : file;

    const take = (picked: File | undefined) => {
      if (!picked) return;
      if (file === undefined)
        setLocal({ name: picked.name, sizeLabel: formatSize(picked.size) });
      onFile?.(picked);
    };

    const remove = () => {
      if (file === undefined) setLocal(null);
      onRemove?.();
    };

    return (
      <div
        ref={ref}
        data-tsuna-id="file-drop-card"
        data-dragging={dragging ? "" : undefined}
        data-attached={attached ? "" : undefined}
        className={cn(
          "w-[380px] max-w-full rounded-[26px] bg-white p-3 text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            depth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => {
            depth.current = Math.max(0, depth.current - 1);
            if (depth.current === 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            depth.current = 0;
            setDragging(false);
            take(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "group relative flex w-full cursor-pointer flex-col items-center rounded-[18px] border-0 px-6 pt-7 pb-6 text-center",
            "transition-colors duration-300 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2",
            dragging ? "bg-sky-50" : "bg-zinc-50 hover:bg-zinc-100/70",
          )}
        >
          <svg
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 overflow-visible"
            style={{
              width: "calc(100% - 1.5px)",
              height: "calc(100% - 1.5px)",
            }}
          >
            <rect
              x="0.75"
              y="0.75"
              width="100%"
              height="100%"
              rx="17.25"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              className={cn(
                "transition-colors duration-300 motion-reduce:transition-none",
                dragging
                  ? "file-drop-card-march stroke-sky-400"
                  : "stroke-zinc-300",
              )}
            />
          </svg>
          <span
            aria-hidden
            className={cn(
              "grid size-11 place-items-center rounded-[14px] bg-white text-zinc-700 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.4),inset_0_0_0_1px_rgba(15,23,42,0.08)]",
              "transition-transform duration-500 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
              dragging &&
                "-translate-y-1 scale-105 text-sky-600 motion-reduce:translate-y-0 motion-reduce:scale-100",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <Paperclip className="size-5" strokeWidth={2} />
          </span>
          <span className="mt-3 text-[14.5px] font-semibold tracking-[-0.01em]">
            {label}
          </span>
          <span className="mt-1 text-[12.5px] text-zinc-500">
            {hint}
            {browseLabel ? (
              <>
                {" "}
                <span className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2">
                  {browseLabel}
                </span>
              </>
            ) : null}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="hidden"
          onChange={(event) => {
            take(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <div
          className="grid motion-reduce:!transition-none"
          style={{
            gridTemplateRows: attached ? "1fr" : "0fr",
            transition: `grid-template-rows 420ms ${EASE}`,
          }}
        >
          <div className="min-h-0 overflow-hidden">
            {attached ? (
              <div
                key={attached.name}
                className="file-drop-card-chip mt-2.5 flex items-center gap-3 rounded-[14px] bg-white p-2.5 pr-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.09)]"
              >
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-rose-50 text-rose-500"
                >
                  <FileText className="size-[18px]" strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">
                      {attached.name}
                    </span>
                    {attached.sizeLabel ? (
                      <span className="shrink-0 text-[12px] text-zinc-400 tabular-nums">
                        {attached.sizeLabel}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden
                    className="h-1 overflow-hidden rounded-full bg-zinc-100"
                  >
                    <span className="file-drop-card-fill block h-full rounded-full bg-emerald-500" />
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`${removeLabel}: ${attached.name}`}
                  onClick={remove}
                  className={cn(
                    "grid size-8 shrink-0 cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-zinc-400",
                    "transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                  )}
                >
                  <X aria-hidden className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {attached ? attached.name : ""}
        </span>
      </div>
    );
  },
);

FileDropCard.displayName = "FileDropCard";
