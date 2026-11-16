"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Compass,
  Component,
  LayoutTemplate,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { GlassEffect, GlassFilter } from "@/lib/liquid-glass";
import { coerceDisplayText } from "@/lib/coerceActionNodes";
import { cn } from "@/lib/utils";

export type GlassSidebarNavItem = {
  id?: string;
  label: string;
  href?: string;
  /** lucide アイコン名に相当するキー。未指定時は id / label から推定 */
  icon?: GlassSidebarIconKey;
  active?: boolean;
  /** 右端の通知バッジ。true は 3、数値はその件数 */
  badge?: boolean | number;
  /** アクティブ時などに右シェブロンを出す */
  showChevron?: boolean;
};

export type GlassSidebarUser = {
  name: string;
  subtitle?: string;
  href?: string;
  /** 画像 URL。未指定時は頭文字アバター */
  avatarSrc?: string;
  avatarAlt?: string;
};

export type GlassSidebarIconKey =
  | "compass"
  | "template"
  | "component"
  | "docs"
  | "bell"
  | "settings"
  | "logout";

export const GLASS_SIDEBAR_NAV_BG_SRC = "/dev/glass-sidebar-nav/bg.png";
export const GLASS_SIDEBAR_NAV_LOGO_SRC = "/dev/glass-sidebar-nav/logo.png";
export const GLASS_SIDEBAR_NAV_AD_SRC = "/dev/glass-sidebar-nav/ad.png";

export type GlassSidebarNavProps = {
  brand?: string;
  brandHref?: string;
  menuLabel?: string;
  primaryItems?: GlassSidebarNavItem[];
  secondaryItems?: GlassSidebarNavItem[];
  user?: GlassSidebarUser;
  adSrc?: string;
  adHref?: string;
  adKicker?: string;
  adTitle?: string;
  /** macOS 風の赤・黄・緑ドット */
  showWindowControls?: boolean;
  /** アクティブ指標・通知バッジの色 */
  accentColor?: string;
  className?: string;
  contentClassName?: string;
};

const ICON_MAP: Record<GlassSidebarIconKey, LucideIcon> = {
  compass: Compass,
  template: LayoutTemplate,
  component: Component,
  docs: BookOpen,
  bell: Bell,
  settings: Settings,
  logout: LogOut,
};

const DEFAULT_PRIMARY: GlassSidebarNavItem[] = [
  {
    id: "explore",
    label: "Discover",
    icon: "compass",
    active: true,
    showChevron: true,
  },
  { id: "messenger", label: "Templates", icon: "template" },
  { id: "friends", label: "Components", icon: "component" },
  { id: "notifications", label: "Notifications", icon: "bell", badge: 3 },
];

const DEFAULT_SECONDARY: GlassSidebarNavItem[] = [
  { id: "informations", label: "Docs", icon: "docs" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "logout", label: "Log Out", icon: "logout" },
];

const DEFAULT_USER: GlassSidebarUser = {
  name: "Design.Layer",
  subtitle: "My Account",
  href: "#",
  avatarSrc: GLASS_SIDEBAR_NAV_LOGO_SRC,
  avatarAlt: "DesignLayer",
};

function resolveIconKey(item: GlassSidebarNavItem): GlassSidebarIconKey {
  if (item.icon && ICON_MAP[item.icon]) return item.icon;
  const key = (item.id ?? item.label).toLowerCase();
  if (key.includes("discover") || key.includes("explore") || key.includes("compass"))
    return "compass";
  if (key.includes("template")) return "template";
  if (key.includes("component")) return "component";
  if (key.includes("doc") || key.includes("info") || key.includes("book"))
    return "docs";
  if (key.includes("notif") || key.includes("bell")) return "bell";
  if (key.includes("setting") || key.includes("gear")) return "settings";
  if (key.includes("log") || key.includes("out") || key.includes("sign"))
    return "logout";
  return "compass";
}

function asPlainString(value: ReactNode, fallback: string): string {
  const text = coerceDisplayText(value);
  if (typeof text === "string" && text.trim()) return text;
  if (typeof text === "number" || typeof text === "bigint") return String(text);
  return fallback;
}

function itemKey(item: GlassSidebarNavItem, index: number): string {
  const label = coerceDisplayText(item.label);
  return item.id ?? (label ? String(label) : `item-${index}`);
}

function initialActiveId(
  primary: GlassSidebarNavItem[],
  secondary: GlassSidebarNavItem[],
): string | null {
  const all = [...primary, ...secondary];
  const active = all.find((item) => item.active);
  if (active) return itemKey(active, 0);
  return primary[0] ? itemKey(primary[0], 0) : null;
}

function WindowControls() {
  return (
    <div className="flex items-center gap-[6px]" aria-hidden>
      <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
      <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
      <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
    </div>
  );
}

function Divider() {
  return <div className="mx-6 h-px bg-white/[0.14]" role="separator" />;
}

function DesignLayerAvatar() {
  return (
    <span
      aria-hidden
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={GLASS_SIDEBAR_NAV_LOGO_SRC}
        alt=""
        className="h-full w-full scale-110 object-contain p-0.5"
        draggable={false}
      />
    </span>
  );
}

function InitialAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  return (
    <span
      aria-hidden
      className="flex h-full w-full items-center justify-center text-[13px] font-semibold tracking-tight text-white"
    >
      {initial}
    </span>
  );
}

function NavRow({
  item,
  index,
  active,
  accent,
  onSelect,
}: {
  item: GlassSidebarNavItem;
  index: number;
  active: boolean;
  accent: string;
  onSelect: (key: string) => void;
}) {
  const label = coerceDisplayText(item.label);
  if (!label) return null;
  const key = itemKey(item, index);
  const href = item.href ?? "#";
  const Icon = ICON_MAP[resolveIconKey(item)];
  const showChevron = item.showChevron ?? active;
  const badgeCount =
    typeof item.badge === "number"
      ? item.badge
      : item.badge
        ? 3
        : null;

  return (
    <a
      href={href}
      className={cn(
        "group relative flex items-center gap-[11px] px-6 py-2 text-[14.5px] font-normal tracking-[-0.01em] transition sm:py-[13px]",
        active ? "text-white" : "text-white/80 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (!item.href || item.href === "#") {
          event.preventDefault();
        }
        onSelect(key);
      }}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-[15px] w-[3px] -translate-y-1/2 rounded-full"
          style={{ backgroundColor: accent }}
        />
      ) : null}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active ? "text-white" : "text-white/70",
        )}
        strokeWidth={1.55}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badgeCount != null ? (
        <span
          aria-label={`${badgeCount} unread`}
          className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-[5px] text-[10px] font-semibold leading-none text-white"
          style={{ backgroundColor: accent }}
        >
          {badgeCount}
        </span>
      ) : null}
      {showChevron && badgeCount == null ? (
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-white/40"
          strokeWidth={1.8}
        />
      ) : null}
    </a>
  );
}

/**
 * macOS 風ガラスサイドバー。
 * ウィンドウコントロール・ブランド・MENU・セカンダリ・アカウント行。
 */
export function GlassSidebarNav({
  menuLabel = "MENU",
  primaryItems = DEFAULT_PRIMARY,
  secondaryItems = DEFAULT_SECONDARY,
  user = DEFAULT_USER,
  adSrc = GLASS_SIDEBAR_NAV_AD_SRC,
  adHref = "#",
  adKicker = "DesignLayer",
  adTitle = "Update",
  showWindowControls = true,
  accentColor = "#ff3b30",
  className,
  contentClassName,
}: GlassSidebarNavProps) {
  const sectionLabel = coerceDisplayText(menuLabel) || "MENU";
  const accent = asPlainString(accentColor, "#ff3b30");
  const userName = coerceDisplayText(user.name) || DEFAULT_USER.name;
  const userSubtitle =
    coerceDisplayText(user.subtitle ?? "") || DEFAULT_USER.subtitle;
  const adImage = asPlainString(adSrc, GLASS_SIDEBAR_NAV_AD_SRC);
  const adEyebrow = coerceDisplayText(adKicker) || "DesignLayer";
  const adHeadline = coerceDisplayText(adTitle) || "Update";
  const [activeId, setActiveId] = useState(() =>
    initialActiveId(primaryItems, secondaryItems),
  );

  return (
    <>
      <GlassFilter />
      <div className="max-h-[calc(100dvh-1.5rem)] w-[min(calc(100vw-1.5rem),320px)] overflow-y-auto overscroll-contain rounded-[32px]">
      <GlassEffect
        className={cn(
          "h-auto w-full rounded-[32px] border-0 font-normal",
          className,
        )}
        contentClassName="flex h-auto w-full min-h-0 flex-col"
        overlay="rgba(255, 255, 255, 0.07)"
        rimShadow="inset 1.5px 1.5px 0 0 rgba(255,255,255,0.32), inset -1px -1px 0 0 rgba(255,255,255,0.06)"
        style={
          {
            "--gsn-accent": accent,
            fontFamily:
              'Inter, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, ui-sans-serif, sans-serif',
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
          } as CSSProperties
        }
      >
        <aside
          data-tsuna-id="glass-sidebar-nav"
          className={cn(
            "flex h-auto min-h-0 w-full flex-col border-0 bg-transparent pt-4 pb-4 shadow-none sm:pt-5",
            contentClassName,
          )}
        >
        {showWindowControls ? (
          <div className="mb-3 px-6 sm:mb-[22px]">
            <WindowControls />
          </div>
        ) : (
          <div className="mb-3" />
        )}

        <a
          href={user.href ?? "#"}
          className="mb-4 flex items-center gap-3 px-6 py-1"
          onClick={(event) => {
            if (!user.href || user.href === "#") event.preventDefault();
          }}
        >
          {user.avatarSrc ? (
            user.avatarSrc === GLASS_SIDEBAR_NAV_LOGO_SRC ? (
              <DesignLayerAvatar />
            ) : (
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/45">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarSrc}
                alt={user.avatarAlt ?? ""}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </span>
            )
          ) : userName === DEFAULT_USER.name ? (
            <DesignLayerAvatar />
          ) : (
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/45">
              <InitialAvatar name={String(userName)} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold tracking-[-0.02em] text-white">
              {userName}
            </span>
            <span className="block truncate text-[12px] text-white/42">
              {userSubtitle}
            </span>
          </span>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-white/38"
            strokeWidth={1.8}
          />
        </a>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-1 px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-white/38">
            {sectionLabel}
          </p>
          <nav aria-label="Primary" className="flex flex-col">
            {primaryItems.map((item, index) => {
              const key = itemKey(item, index);
              return (
                <NavRow
                  key={key}
                  item={item}
                  index={index}
                  active={activeId === key}
                  accent={accent}
                  onSelect={setActiveId}
                />
              );
            })}
          </nav>

          <div className="my-2">
            <Divider />
          </div>

          <nav aria-label="Secondary" className="flex flex-col">
            {secondaryItems.map((item, index) => {
              const key = itemKey(item, index);
              return (
                <NavRow
                  key={key}
                  item={item}
                  index={index}
                  active={activeId === key}
                  accent={accent}
                  onSelect={setActiveId}
                />
              );
            })}
          </nav>

          <a
            href={adHref}
            className="relative mx-5 mt-3 mb-1 block overflow-hidden rounded-[18px]"
            onClick={(event) => {
              if (!adHref || adHref === "#") event.preventDefault();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={adImage}
              alt=""
              className="h-[88px] w-full object-cover object-[center_40%] sm:h-[118px]"
              draggable={false}
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
            <span className="absolute left-3.5 top-1/2 flex -translate-y-1/2 flex-col">
              <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/70">
                {adEyebrow}
              </span>
              <span className="mt-0.5 text-[22px] font-semibold uppercase leading-none tracking-[0.04em] text-white">
                {adHeadline}
              </span>
            </span>
          </a>
        </div>
        </aside>
      </GlassEffect>
      </div>
    </>
  );
}

/** 1画面いっぱいに暗い抽象彫刻を敷くステージ */
export function GlassSidebarNavStage({
  children,
  className,
  backgroundSrc = GLASS_SIDEBAR_NAV_BG_SRC,
}: {
  children?: ReactNode;
  className?: string;
  backgroundSrc?: string;
}) {
  const src = asPlainString(backgroundSrc, GLASS_SIDEBAR_NAV_BG_SRC);

  return (
    <div
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-[#0b0b0e]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div className="relative z-10 flex w-full items-center justify-center px-3 py-3 sm:px-6 sm:py-8">
        {children ?? <GlassSidebarNav />}
      </div>
    </div>
  );
}
