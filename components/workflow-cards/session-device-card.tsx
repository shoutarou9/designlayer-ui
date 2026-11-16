"use client";

import * as React from "react";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

export type SessionDeviceKind = "laptop" | "desktop" | "phone" | "tablet";

export type SessionDevice = {
  id: string;
  /** e.g. "MacBook Pro · Chrome". */
  name: string;
  /** Location or app, e.g. "Tokyo, JP". */
  detail?: string;
  current?: boolean;
  /** Pre-formatted, e.g. "2h ago". */
  lastActive?: string;
  /** Icon. Guessed from the name when unset. */
  kind?: SessionDeviceKind;
};

export type SessionDeviceCardProps = React.ComponentPropsWithoutRef<"div"> & {
  devices?: readonly SessionDevice[];
  title?: string;
  /** Small line under the title. Pass "" to hide it. */
  subtitle?: string;
  currentLabel?: string;
  /** Shows a Sign out button on other devices. Nothing is signed out for real. */
  onSignOut?: (device: SessionDevice) => void;
  signOutLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CSS = `
@keyframes session-device-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes session-device-card-ping { 0% { transform: scale(1); opacity: 0.7; } 80%, 100% { transform: scale(2.6); opacity: 0; } }
.session-device-card-row { opacity: 0; }
[data-in-view] .session-device-card-row { animation: session-device-card-in 520ms ${EASE} both; }
.session-device-card-ping { animation: session-device-card-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .session-device-card-row, [data-in-view] .session-device-card-row { animation: none; opacity: 1; }
  .session-device-card-ping { animation: none; opacity: 0; }
}
`;

const SESSION_DEFAULT_DEVICES: readonly SessionDevice[] = [
  {
    id: "mbp",
    name: "MacBook Pro · Chrome",
    detail: "Tokyo, JP",
    current: true,
    kind: "laptop",
  },
  {
    id: "phone",
    name: "iPhone 15 · App",
    detail: "Tokyo, JP",
    lastActive: "2h ago",
    kind: "phone",
  },
  {
    id: "desk",
    name: "Windows PC · Edge",
    detail: "Osaka, JP",
    lastActive: "3 days ago",
    kind: "desktop",
  },
];

const ICONS: Record<SessionDeviceKind, typeof Laptop> = {
  laptop: Laptop,
  desktop: Monitor,
  phone: Smartphone,
  tablet: Tablet,
};

function guessKind(name: string): SessionDeviceKind {
  const lower = name.toLowerCase();
  if (/ipad|tablet|galaxy tab/.test(lower)) return "tablet";
  if (/iphone|android|pixel|phone|mobile/.test(lower)) return "phone";
  if (/imac|desktop|windows pc|workstation|\bpc\b/.test(lower))
    return "desktop";
  return "laptop";
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
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export const SessionDeviceCard = React.forwardRef<
  HTMLDivElement,
  SessionDeviceCardProps
>(
  (
    {
      devices = SESSION_DEFAULT_DEVICES,
      title = "Signed-in devices",
      subtitle = "Sign out of anything you don’t recognize.",
      currentLabel = "This device",
      onSignOut,
      signOutLabel = "Sign out",
      className,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const inView = useInView(localRef);
    const [removed, setRemoved] = React.useState<readonly string[]>([]);
    const list = (devices.length > 0 ? devices : SESSION_DEFAULT_DEVICES).slice(
      0,
      4,
    );

    return (
      <div
        ref={localRef}
        data-tsuna-id="session-device-card"
        data-in-view={inView ? "" : undefined}
        className={cn(
          "w-[400px] max-w-full rounded-[26px] bg-white p-5 text-zinc-900",
          "shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45),inset_0_0_0_1px_rgba(15,23,42,0.06)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <h3 className="m-0 text-[16px] font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        {subtitle ? (
          <p className="m-0 mt-1 text-[13px] text-zinc-500">{subtitle}</p>
        ) : null}

        <ul className="m-0 mt-4 list-none p-0">
          {list.map((device, index) => {
            const Icon = ICONS[device.kind ?? guessKind(device.name)];
            const gone = removed.includes(device.id);
            return (
              <li
                key={device.id}
                className="grid motion-reduce:!transition-none"
                style={{
                  gridTemplateRows: gone ? "0fr" : "1fr",
                  opacity: gone ? 0 : 1,
                  transition: `grid-template-rows 420ms ${EASE}, opacity 260ms ${EASE}`,
                }}
                aria-hidden={gone || undefined}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={cn(
                      "session-device-card-row flex items-center gap-3 py-3",
                      index > 0 && "border-t border-zinc-100",
                    )}
                    style={{ animationDelay: `${index * 110}ms` }}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-[12px]",
                        device.current
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600",
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                        {device.name}
                      </span>
                      <span className="truncate text-[12.5px] text-zinc-500">
                        {[
                          device.detail,
                          device.current ? null : device.lastActive,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {device.current ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 py-1 pr-2.5 pl-2 text-[12px] font-semibold text-emerald-700">
                        <span aria-hidden className="relative grid size-1.5">
                          <span className="session-device-card-ping absolute inset-0 rounded-full bg-emerald-500" />
                          <span className="relative size-1.5 rounded-full bg-emerald-500" />
                        </span>
                        {currentLabel}
                      </span>
                    ) : onSignOut ? (
                      <button
                        type="button"
                        tabIndex={gone ? -1 : 0}
                        onClick={() => {
                          setRemoved((current) => [...current, device.id]);
                          onSignOut(device);
                        }}
                        className={cn(
                          "h-8 shrink-0 cursor-pointer rounded-[9px] border-0 bg-transparent px-2.5 text-[12.5px] font-semibold text-zinc-600",
                          "transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                        )}
                      >
                        {signOutLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

SessionDeviceCard.displayName = "SessionDeviceCard";
