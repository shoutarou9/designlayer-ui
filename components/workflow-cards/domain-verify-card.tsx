"use client";

import * as React from "react";
import { Check, Globe, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DomainVerifyStatus = "verifying" | "verified";

export type DomainDnsRecord = {
  /** e.g. "CNAME", "TXT", "A". */
  type: string;
  host: string;
  value: string;
};

export type DomainVerifyCardProps = React.ComponentPropsWithoutRef<"div"> & {
  domain?: string;
  record?: DomainDnsRecord;
  /** Fixed status. Leave unset to loop verifying → verified. */
  status?: DomainVerifyStatus;
  verifyingLabel?: string;
  verifiedLabel?: string;
  /** Line under the record per status. */
  verifyingDetail?: string;
  verifiedDetail?: string;
  /** Column headings for the record row. */
  columns?: { type: string; host: string; value: string };
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes domain-verify-card-scan { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
.domain-verify-card-scan { animation: domain-verify-card-scan 1.3s cubic-bezier(0.45, 0, 0.25, 1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .domain-verify-card-scan { animation: none; transform: translateX(75%); }
}
`;

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

function useInView<T extends Element>(ref: React.RefObject<T | null>) {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.25,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

const DOMAIN_DEFAULT_RECORD: DomainDnsRecord = {
  type: "CNAME",
  host: "app",
  value: "cname.edge-hosting.net",
};

export const DomainVerifyCard = React.forwardRef<
  HTMLDivElement,
  DomainVerifyCardProps
>(
  (
    {
      domain = "app.northwind.co",
      record = DOMAIN_DEFAULT_RECORD,
      status,
      verifyingLabel = "Verifying",
      verifiedLabel = "Verified",
      verifyingDetail = "Checking DNS… this can take a few minutes.",
      verifiedDetail = "DNS record found · SSL certificate issued",
      columns = { type: "Type", host: "Host", value: "Value" },
      className,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const reduced = usePrefersReducedMotion();
    const inView = useInView(localRef);
    const [demo, setDemo] = React.useState<DomainVerifyStatus>("verifying");
    const shown: DomainVerifyStatus = status ?? (reduced ? "verified" : demo);
    const verified = shown === "verified";

    React.useEffect(() => {
      if (status !== undefined || reduced || !inView) return;
      const timer = window.setTimeout(
        () =>
          setDemo((current) =>
            current === "verifying" ? "verified" : "verifying",
          ),
        demo === "verifying" ? 2600 : 3800,
      );
      return () => window.clearTimeout(timer);
    }, [status, reduced, inView, demo]);

    const swap = (visible: boolean): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(5px) scale(0.94)",
      transition: `opacity 300ms ${EASE}, transform 440ms ${EASE}`,
    });

    return (
      <div
        ref={localRef}
        data-tsuna-id="domain-verify-card"
        data-status={shown}
        className={cn(
          "w-[400px] max-w-full rounded-[26px] bg-white p-5 text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[11px] transition-colors duration-500 motion-reduce:transition-none",
                verified
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-zinc-100 text-zinc-600",
              )}
            >
              <Globe className="size-[17px]" strokeWidth={2} />
            </span>
            <span className="truncate text-[15.5px] font-semibold tracking-[-0.01em]">
              {domain}
            </span>
          </div>
          <span className="grid shrink-0" aria-live="polite">
            <span
              aria-hidden={verified}
              className="col-start-1 row-start-1 inline-flex items-center justify-self-end gap-1.5 rounded-full bg-amber-50 py-1 pr-2.5 pl-2 text-[12px] font-semibold text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)] motion-reduce:!transition-none"
              style={swap(!verified)}
            >
              <LoaderCircle
                className="size-3.5 animate-spin motion-reduce:animate-none"
                strokeWidth={2.4}
              />
              {verifyingLabel}
            </span>
            <span
              aria-hidden={!verified}
              className="col-start-1 row-start-1 inline-flex items-center justify-self-end gap-1.5 rounded-full bg-emerald-50 py-1 pr-2.5 pl-2 text-[12px] font-semibold text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)] motion-reduce:!transition-none"
              style={swap(verified)}
            >
              <Check className="size-3.5" strokeWidth={2.8} />
              {verifiedLabel}
            </span>
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-[64px_64px_minmax(0,1fr)] gap-3 bg-zinc-50 px-3.5 py-2 text-[11px] font-semibold tracking-[0.05em] text-zinc-500 uppercase">
            <span>{columns.type}</span>
            <span>{columns.host}</span>
            <span>{columns.value}</span>
          </div>
          <div className="grid grid-cols-[64px_64px_minmax(0,1fr)] items-center gap-3 px-3.5 py-3 font-mono text-[12.5px]">
            <span className="w-fit rounded-[6px] bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {record.type}
            </span>
            <span className="truncate text-zinc-700">{record.host}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-zinc-700">{record.value}</span>
              <span
                aria-hidden
                className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white motion-reduce:!transition-none"
                style={{
                  opacity: verified ? 1 : 0,
                  transform: verified ? "scale(1)" : "scale(0.3)",
                  transition: `opacity 260ms ${EASE} 120ms, transform 460ms ${EASE} 120ms`,
                }}
              >
                <Check className="size-2.5" strokeWidth={3.4} />
              </span>
            </span>
          </div>
          <div
            aria-hidden
            className="relative h-[3px] overflow-hidden bg-zinc-100"
          >
            {verified ? (
              <span className="absolute inset-0 bg-emerald-500" />
            ) : (
              <span className="domain-verify-card-scan absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            )}
          </div>
        </div>

        <div className="relative mt-3 grid text-[12.5px]">
          <span
            className="col-start-1 row-start-1 truncate text-zinc-500 motion-reduce:!transition-none"
            style={{
              opacity: verified ? 0 : 1,
              transition: `opacity 300ms ${EASE}`,
            }}
          >
            {verifyingDetail}
          </span>
          <span
            className="col-start-1 row-start-1 truncate text-emerald-600 motion-reduce:!transition-none"
            style={{
              opacity: verified ? 1 : 0,
              transition: `opacity 300ms ${EASE}`,
            }}
          >
            {verifiedDetail}
          </span>
        </div>
      </div>
    );
  },
);

DomainVerifyCard.displayName = "DomainVerifyCard";
