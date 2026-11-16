"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { WhatsNewIntegrationCluster } from "@/lib/whats-new-card-marks";
import { cn } from "@/lib/utils";

export type WhatsNewCardSlide = {
  id: string;
  title: string;
  description: string;
  visual: ReactNode;
  actionLabel: string;
  /** Called when the pill button is pressed. */
  onAction?: () => void;
  /** Real destination supplied by the host app. Omit for callback-only actions. */
  href?: string;
};

export type WhatsNewCardProps = {
  slides: readonly WhatsNewCardSlide[];
  /** Zero-based. Slide 2 of the reference is `1`. */
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  regionLabel?: string;
  className?: string;
  /**
   * Milliseconds each slide stays before scrolling to the next. Omit or pass `0` to stay put.
   * Ignored when the user prefers reduced motion. Hovering or focusing the card pauses it.
   */
  autoAdvanceMs?: number;
};

export type WhatsNewCardSlotProps = {
  children: ReactNode;
  /** `fixed` pins to the viewport. `absolute` stays inside the nearest positioned parent. */
  placement?: "fixed" | "absolute";
  bottom?: number;
  right?: number;
  className?: string;
};

function showFocus(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.boxShadow = "0 0 0 1px #fff";
}

function hideFocus(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.boxShadow = "";
}

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.trunc(index)));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function ShortcutVisual() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {["⌘K", "G", "B"].map((label) => (
        <span
          key={label}
          className="grid h-10 w-12 place-items-center rounded-[8px] border border-white/15 bg-white/[0.06] text-[12px] font-medium leading-none tracking-tight text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(0,0,0,0.35)]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CommentsVisual() {
  return (
    <div className="flex w-[148px] flex-col gap-1.5" aria-hidden="true">
      <span className="rounded-xl rounded-bl-[4px] bg-white/[0.08] px-2.5 py-1.5 text-left text-[11px] leading-snug text-white/70">
        Can we crop this frame?
      </span>
      <span className="ml-5 rounded-xl rounded-br-[4px] bg-white px-2.5 py-1.5 text-left text-[11px] leading-snug text-[#161616]">
        Done — check the right edge.
      </span>
    </div>
  );
}

function DigestVisual() {
  const bars = [10, 16, 12, 22, 14, 18, 26];
  return (
    <div className="flex h-11 items-end gap-1.5" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          className="w-2 rounded-full bg-white/80"
          style={{ height, opacity: index === bars.length - 1 ? 1 : 0.35 + index * 0.08 }}
        />
      ))}
    </div>
  );
}

export const WHATS_NEW_CARD_DEMO_SLIDES: readonly Omit<WhatsNewCardSlide, "onAction" | "href">[] = [
  {
    id: "shortcuts",
    title: "Shortcuts just landed",
    description: "Jump between boards without reaching for the mouse.",
    actionLabel: "View shortcuts",
    visual: <ShortcutVisual />,
  },
  {
    id: "integrations",
    title: "New integrations are here",
    description: "Connect your favorite tools without leaving your dashboard.",
    actionLabel: "See what’s new",
    visual: <WhatsNewIntegrationCluster />,
  },
  {
    id: "comments",
    title: "Comments on frames",
    description: "Leave a note your team can answer in place.",
    actionLabel: "Try comments",
    visual: <CommentsVisual />,
  },
  {
    id: "digest",
    title: "Monday digest is ready",
    description: "A short recap of what changed last week.",
    actionLabel: "Open digest",
    visual: <DigestVisual />,
  },
];

const AUTO_SCROLL_MS = 4500;

function SlideBody({ slide }: { slide: WhatsNewCardSlide }) {
  return (
    <>
      <div className="flex h-[96px] w-full items-center justify-center">{slide.visual}</div>
      <h2 className="mt-0.5 text-center text-[15px] font-semibold leading-none tracking-[-0.02em] text-white">
        {slide.title}
      </h2>
      <p className="mt-2 min-h-[3.15em] max-w-[11.65rem] text-center text-[12.5px] leading-[1.35] text-white/45">
        {slide.description}
      </p>
      <div className="mt-auto pt-3">
        <SlideAction slide={slide} />
      </div>
    </>
  );
}

function SlideAction({ slide }: { slide: WhatsNewCardSlide }) {
  const className =
    "inline-flex h-7 items-center rounded-full bg-white px-3 text-[12.5px] font-medium leading-none text-[#161616] transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus:shadow-[0_0_0_2px_#161616,0_0_0_4px_#fff]";
  if (slide.href) {
    return (
      <a href={slide.href} className={className} onClick={() => slide.onAction?.()} onFocus={showFocus} onBlur={hideFocus}>
        {slide.actionLabel}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => slide.onAction?.()}
      onFocus={showFocus}
      onBlur={hideFocus}
      disabled={!slide.onAction}
    >
      {slide.actionLabel}
    </button>
  );
}

export function WhatsNewCard({
  slides,
  initialIndex = 0,
  onIndexChange,
  regionLabel = "What’s new",
  className,
  autoAdvanceMs = 0,
}: WhatsNewCardProps) {
  const baseId = useId();
  const reduced = usePrefersReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = slides.length;
  const [position, setPosition] = useState(() => clampIndex(initialIndex, count));
  const [cycle, setCycle] = useState(0);
  const [glide, setGlide] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const skipNotify = useRef(true);
  const positionRef = useRef(position);
  const remainingRef = useRef(autoAdvanceMs);
  const hovering = useRef(false);
  const focused = useRef(false);
  positionRef.current = position;
  const index = count === 0 ? 0 : position % count;
  const looping = autoAdvanceMs > 0 && !reduced && count > 1;
  const track = looping ? [...slides, slides[0]] : slides;
  const hold = paused || pageHidden;
  const animateTrack = glide && !reduced;

  const select = useCallback(
    (next: number, focus = false) => {
      const clamped = clampIndex(next, count);
      const from = positionRef.current >= count ? 0 : positionRef.current;
      setGlide(Math.abs(clamped - from) === 1);
      setPosition(clamped);
      setCycle((current) => current + 1);
      if (focus) tabRefs.current[clamped]?.focus();
    },
    [count],
  );

  useEffect(() => {
    if (skipNotify.current) {
      skipNotify.current = false;
      return;
    }
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  useEffect(() => {
    remainingRef.current = autoAdvanceMs;
  }, [cycle, autoAdvanceMs]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!looping || hold) return;
    const wait = remainingRef.current;
    const started = performance.now();
    let finished = false;
    const timer = window.setTimeout(() => {
      finished = true;
      remainingRef.current = autoAdvanceMs;
      setGlide(true);
      setPosition((current) => (current >= count ? current : current + 1));
      setCycle((current) => current + 1);
    }, wait);
    return () => {
      window.clearTimeout(timer);
      if (!finished) remainingRef.current = Math.max(0, wait - (performance.now() - started));
    };
  }, [looping, hold, count, cycle]);

  useEffect(() => {
    if (position < count) return;
    const backup = window.setTimeout(() => {
      setGlide(false);
      setPosition(0);
    }, 700);
    return () => window.clearTimeout(backup);
  }, [position, count]);

  useEffect(() => {
    if (glide) return;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setGlide(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [glide]);

  const finishLoop = () => {
    if (position < count) return;
    setGlide(false);
    setPosition(0);
  };

  const setHold = (nextHover: boolean, nextFocus: boolean) => {
    hovering.current = nextHover;
    focused.current = nextFocus;
    setPaused(nextHover || nextFocus);
  };

  const onTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count === 0) return;
    const last = count - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  };

  if (count === 0) return null;

  return (
    <section
      data-tsuna-id="whats-new-card"
      data-slide-index={index}
      aria-label={regionLabel}
      className={cn(
        "relative h-[280px] w-full max-w-full overflow-hidden rounded-[18px] bg-[#161616] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_28px_rgba(255,255,255,0.035)]",
        className,
      )}
      onMouseEnter={() => setHold(true, focused.current)}
      onMouseLeave={() => setHold(false, focused.current)}
      onFocusCapture={() => setHold(hovering.current, true)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setHold(hovering.current, false);
      }}
    >
      <style>{"@keyframes whats-new-card-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[18px]"
        style={{
          padding: "1px",
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0.16) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative flex h-full flex-col px-5 pb-8 pt-3">
        <div
          role="tablist"
          aria-label={regionLabel}
          className="flex gap-[9px]"
          onKeyDown={onTabsKeyDown}
        >
            {slides.map((slide, slideIndex) => {
              const current = slideIndex === index;
              const past = slideIndex < index;
              return (
                <button
                  key={slide.id}
                  ref={(node) => {
                    tabRefs.current[slideIndex] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${slide.id}`}
                  aria-selected={current}
                  aria-current={current ? "true" : undefined}
                  aria-controls={`${baseId}-panel-${slide.id}`}
                  tabIndex={current ? 0 : -1}
                  aria-label={`${slide.title}. Slide ${slideIndex + 1} of ${slides.length}`}
                  className="relative h-6 min-w-0 flex-1 rounded-sm outline-none"
                  onClick={() => select(slideIndex)}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-full bg-white/30">
                    <span
                      key={current ? cycle : slide.id}
                      className="absolute inset-0 origin-left bg-white"
                      style={
                        looping && current
                          ? {
                              animationName: "whats-new-card-fill",
                              animationDuration: `${autoAdvanceMs}ms`,
                              animationTimingFunction: "linear",
                              animationFillMode: "forwards",
                              animationPlayState: hold ? "paused" : "running",
                            }
                          : { transform: past || (!looping && slideIndex <= index) ? "scaleX(1)" : "scaleX(0)" }
                      }
                    />
                  </span>
                </button>
              );
            })}
        </div>

        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex h-full w-full",
              animateTrack ? "transition-transform duration-500 ease-out motion-reduce:transition-none" : "",
            )}
            style={{ transform: `translate3d(${position * -100}%, 0, 0)` }}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
              finishLoop();
            }}
          >
            {track.map((slide, copyIndex) => {
              const active = copyIndex === position;
              const clone = copyIndex >= count;
              return (
                <div
                  key={`${slide.id}-${copyIndex}`}
                  role={clone ? undefined : "tabpanel"}
                  id={clone ? undefined : `${baseId}-panel-${slide.id}`}
                  aria-labelledby={clone ? undefined : `${baseId}-tab-${slide.id}`}
                  aria-hidden={!active}
                  inert={active ? undefined : true}
                  className="flex h-full w-full shrink-0 basis-full flex-col items-center"
                >
                  <SlideBody slide={slide} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Placement wrapper. The card itself stays free of fixed positioning. */
export function WhatsNewCardSlot({
  children,
  placement = "fixed",
  bottom = 24,
  right = 24,
  className,
}: WhatsNewCardSlotProps) {
  const side = Math.max(16, right);
  const bottomOffset = Math.max(16, bottom);
  const basis = placement === "fixed" ? "100vw" : "100%";
  return (
    <div
      data-tsuna-id="whats-new-card-slot"
      className={cn("z-30 sm:max-w-[310px]", placement === "fixed" ? "fixed" : "absolute", className)}
      style={{
        right: `calc(${side}px + env(safe-area-inset-right, 0px))`,
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        width: `min(310px, calc(${basis} - 32px - ${side - 16}px))`,
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {children}
    </div>
  );
}

export function WhatsNewCardStage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative min-h-[100svh] w-full overflow-hidden bg-[#111111]", className)}>{children}</div>;
}

export function WhatsNewCardDemo() {
  const slides: WhatsNewCardSlide[] = WHATS_NEW_CARD_DEMO_SLIDES.map((slide) => ({
    ...slide,
    onAction: () => {},
  }));

  return (
    <WhatsNewCardStage>
      <WhatsNewCardSlot placement="absolute" bottom={36} right={36}>
        <WhatsNewCard slides={slides} initialIndex={1} autoAdvanceMs={AUTO_SCROLL_MS} />
      </WhatsNewCardSlot>
    </WhatsNewCardStage>
  );
}
