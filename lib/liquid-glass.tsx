"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GlassEffectProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  href?: string;
  target?: string;
  /** フロストの白。薄いほど背景が透ける */
  overlay?: string;
  /** 外枠のインセットハイライト */
  rimShadow?: string;
  /** 背景のぼかし量（px） */
  blur?: number;
}

export interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

const GLASS_SHADOW =
  "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)";
const GLASS_EASE = "cubic-bezier(0.175, 0.885, 0.32, 2.2)";
export const GLASS_DISTORTION_ID = "glass-distortion";

/** 3-layer liquid glass shell (distort + frost + inset highlight). */
export function GlassEffect({
  children,
  className = "",
  contentClassName,
  style = {},
  href,
  target = "_blank",
  overlay = "rgba(255, 255, 255, 0.25)",
  rimShadow = "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
  blur = 3,
}: GlassEffectProps) {
  const frost = `blur(${blur}px) url(#${GLASS_DISTORTION_ID})`;
  const content = (
    <div
      className={cn(
        "relative flex overflow-hidden font-semibold transition-all duration-700",
        className,
      )}
      style={{
        boxShadow: GLASS_SHADOW,
        transitionTimingFunction: GLASS_EASE,
        ...style,
      }}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{
          backdropFilter: frost,
          WebkitBackdropFilter: frost,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: overlay }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
        style={{ boxShadow: rimShadow }}
      />
      <div className={cn("relative z-30", contentClassName)}>{children}</div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}

export function GlassDock({ icons, href }: { icons: DockIcon[]; href?: string }) {
  return (
    <GlassEffect
      href={href}
      className="rounded-3xl p-3 hover:rounded-[2rem] hover:p-4"
    >
      <div className="flex items-center justify-center gap-2 overflow-hidden rounded-3xl px-0.5 py-0">
        {icons.map((icon) => (
          // eslint-disable-next-line @next/next/no-img-element -- dock demo assets
          <img
            key={icon.alt}
            src={icon.src}
            alt={icon.alt}
            className="h-16 w-16 cursor-pointer transition-all duration-700 hover:scale-110"
            style={{
              transformOrigin: "center center",
              transitionTimingFunction: GLASS_EASE,
            }}
            onClick={icon.onClick}
          />
        ))}
      </div>
    </GlassEffect>
  );
}

export function GlassButton({
  children,
  href,
}: {
  children: ReactNode;
  href?: string;
}) {
  return (
    <GlassEffect
      href={href}
      className="overflow-hidden rounded-3xl px-10 py-6 hover:rounded-[2rem] hover:px-11 hover:py-7"
    >
      <div
        className="transition-all duration-700 hover:scale-95"
        style={{ transitionTimingFunction: GLASS_EASE }}
      >
        {children}
      </div>
    </GlassEffect>
  );
}

export function GlassFilter() {
  return (
    <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden>
      <filter
        id={GLASS_DISTORTION_ID}
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.001 0.005"
          numOctaves="1"
          seed="17"
          result="turbulence"
        />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="200"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export function Component() {
  const dockIcons: DockIcon[] = [
    {
      src: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=128&q=80",
      alt: "Claude",
    },
    {
      src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=128&q=80",
      alt: "Finder",
    },
    {
      src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=128&q=80",
      alt: "Chatgpt",
    },
    {
      src: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=128&q=80",
      alt: "Maps",
    },
    {
      src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=128&q=80",
      alt: "Safari",
    },
    {
      src: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?auto=format&fit=crop&w=128&q=80",
      alt: "Steam",
    },
  ];

  return (
    <div
      className="relative flex h-full min-h-screen w-full items-center justify-center overflow-hidden font-light"
      style={{
        background:
          'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80") center center',
        animation: "moveBackground 60s linear infinite",
      }}
    >
      <GlassFilter />
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <GlassDock icons={dockIcons} />
        <GlassButton>
          <div className="text-xl text-white">
            <p>How can i help you today?</p>
          </div>
        </GlassButton>
      </div>
    </div>
  );
}
