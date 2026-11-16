"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  CreditCard,
  Download,
  FileText,
  MessageCircle,
  Keyboard,
  LogOut,
  RotateCcw,
  SunMoon,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountMenuUser = {
  handle: string;
  initial: string;
  /** Muted line under the handle. */
  subtitle: string;
  email?: string;
  phone?: string;
};

export type AccountMenuPlan = {
  /** "Free" shows Upgrade. Any other name is the paid plan. */
  name: string;
  /** Muted price next to the name, e.g. "$12/mo". */
  price?: string;
};

export type AccountMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Muted text on the right. Billing with no hint shows the current plan name. */
  hint?: string;
  badge?: string;
  shortcut?: string;
  external?: boolean;
  href?: string;
  onSelect?: (href?: string) => void;
};

export type AccountMenuTheme = "light" | "dark" | "system";

export type AccountMenuProfile = { name: string; handle: string; email: string; phone: string };

const THEMES: readonly AccountMenuTheme[] = ["light", "dark", "system"];
const THEME_LABEL: Record<AccountMenuTheme, string> = { light: "Light", dark: "Dark", system: "System" };
const THEME_KEY = "tsuna-account-menu-theme";

export type AccountMenuProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  user?: AccountMenuUser;
  /** Pass a plan to control it. Without one, the menu runs the Free → Pro demo. */
  plan?: AccountMenuPlan;
  items?: readonly AccountMenuItem[];
  /** Appearance. Omit it and the demo keeps the choice, including in localStorage. */
  theme?: AccountMenuTheme;
  onThemeChange?: (theme: AccountMenuTheme) => void;
  onProfileSave?: (profile: AccountMenuProfile) => void;
  onLogout?: () => void;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
  onDowngrade?: () => void;
  onNotificationRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  /** Opened in a new tab for Help & docs. */
  helpHref?: string;
  planLabel?: string;
  upgradeLabel?: string;
  /** Shown with a check before the pill settles into the Pro badge. */
  upgradeSuccessLabel?: string;
  logoutLabel?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FOCUS = "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-300";
const AVATAR_TILE = "bg-[#fde8f1] text-[#9d174d]";
/** Demo-only: the Profile camera button cycles these avatar tiles. */
const AVATAR_TONES = [AVATAR_TILE, "bg-[#e3ebff] text-[#1e40af]", "bg-[#dcf5e6] text-[#166534]"] as const;
const ACCENT = "#7b97ff";
const PROFILE_FIELD =
  "account-menu-field block h-10 w-full rounded-[10px] border-0 bg-[#f4f5f7] px-3 text-[14px] text-zinc-950 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[#7b97ff]/70";
const PROFILE_LABEL = "mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-zinc-500";

const DEFAULT_USER: AccountMenuUser = {
  handle: "@marcel",
  initial: "M",
  subtitle: "Personal",
  email: "marcel@example.com",
  phone: "+1 415 555 0132",
};

const DEMO_FREE_PLAN: AccountMenuPlan = { name: "Free", price: "$0/mo" };
const DEMO_PRO_PLAN: AccountMenuPlan = { name: "Pro", price: "$12/mo" };
const RENEWAL = "Dec 14, 2026";
/** Demo-only billing history shown on Pro. */
const DEMO_INVOICES = ["Nov 14, 2026", "Oct 14, 2026", "Sep 14, 2026"] as const;

const DEFAULT_ITEMS: readonly AccountMenuItem[] = [
  { id: "profile", label: "Profile", icon: UserRound, shortcut: "⌘P" },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "3" },
  { id: "appearance", label: "Appearance", icon: SunMoon },
  { id: "help", label: "Help & docs", icon: BookOpen, external: true },
  { id: "shortcuts", label: "Keyboard shortcuts", icon: Keyboard, shortcut: "?" },
];

const DEMO_NOTES = [
  { id: "comment", title: "New comment", body: "Aiko replied on the Q4 brief.", time: "2m ago" },
  { id: "invoice", title: "Invoice ready", body: "Your November invoice is available.", time: "1h ago" },
  { id: "invite", title: "Workspace invite", body: "Noah asked you to join Northwind.", time: "Yesterday" },
] as const;

/** Per-type icon for notification rows; every type shares one neutral tile. */
const NOTE_ICON_TILE = "account-menu-note-icon bg-[#eef0f3] text-[#4b5563]";
const NOTE_KIND: Record<string, { icon: LucideIcon }> = {
  comment: { icon: MessageCircle },
  invoice: { icon: FileText },
  invite: { icon: UserPlus },
};

/** Shortcut groups; each key renders as its own keycap. */
const SHORTCUT_GROUPS = [
  {
    label: "Menu",
    rows: [
      { label: "Profile", keys: ["⌘", "P"] },
      { label: "Shortcuts", keys: ["?"] },
    ],
  },
  {
    label: "Navigation",
    rows: [
      { label: "Move", keys: ["↑", "↓"] },
      { label: "Select", keys: ["Enter"] },
      { label: "Close", keys: ["Esc"] },
    ],
  },
] as const;

/** Maps a KeyboardEvent.key to the keycap it should press down. */
const KEYCAP_FOR_KEY: Record<string, string> = {
  Meta: "⌘",
  p: "P",
  P: "P",
  "?": "?",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Enter: "Enter",
  Escape: "Esc",
};

function Keycap({ label, pressed }: { label: string; pressed: boolean }) {
  return (
    <kbd
      data-pressed={pressed ? "true" : undefined}
      className="account-menu-chip account-menu-keycap inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] border border-black/[0.08] bg-white px-1.5 font-mono text-[11px] leading-none text-zinc-600"
    >
      {label}
    </kbd>
  );
}

type UpgradeState = "idle" | "loading" | "success" | "settled";
type ViewId = "main" | "profile" | "billing" | "notifications" | "shortcuts";
type Note = { id: string; title: string; body: string; time: string; unread: boolean };

type Row =
  | { key: string; kind: "upgrade" }
  | { key: string; kind: "manage" }
  | { key: string; kind: "item"; item: AccountMenuItem }
  | { key: string; kind: "logout" };

function nameFromHandle(handle: string) {
  const bare = handle.replace(/^@+/, "");
  return bare ? bare.charAt(0).toUpperCase() + bare.slice(1) : "";
}

function normalizeHandle(value: string) {
  const bare = value.trim().replace(/^@+/, "");
  return bare ? `@${bare}` : "@";
}

function readStoredTheme(): AccountMenuTheme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : null;
  } catch {
    return null;
  }
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const noopSubscribe = () => () => {};

/** True on the server and during hydration, false for client-only renders. */
function useIsHydrating() {
  return React.useSyncExternalStore(noopSubscribe, () => false, () => true);
}

// Runs before first paint of server HTML, so a stored Dark choice never flashes Light.
const THEME_BOOT_SCRIPT = `(function(){try{var e=document.currentScript&&document.currentScript.parentElement;if(!e)return;var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark"&&t!=="system")t="system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);e.setAttribute("data-theme",d?"dark":"light");}catch(_){}})();`;

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

function useSystemDark() {
  const [dark, setDark] = React.useState(false);
  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return dark;
}

function isField(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
}

function shortcutMatches(event: KeyboardEvent, shortcut: string) {
  if (event.altKey || event.repeat) return false;
  if (shortcut.startsWith("⌘")) {
    if (!(event.metaKey || event.ctrlKey) || event.shiftKey) return false;
    return event.key.toLowerCase() === shortcut.slice(1).toLowerCase();
  }
  if (event.metaKey || event.ctrlKey) return false;
  return event.key.toLowerCase() === shortcut.toLowerCase();
}

function openInNewTab(href: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Stacks the previous and next value in one grid cell so a change crossfades instead of jumping. */
function Crossfade({ value, className }: { value: string; className?: string }) {
  const [state, setState] = React.useState<{ current: string; previous: string | null; n: number }>({
    current: value,
    previous: null,
    n: 0,
  });
  if (state.current !== value) {
    setState({ current: value, previous: state.current, n: state.n + 1 });
  }
  return (
    <span className={cn("inline-grid", className)}>
      {state.previous !== null ? (
        <span
          key={`previous-${state.n}`}
          aria-hidden
          className="account-menu-fade-out [grid-area:1/1]"
          onAnimationEnd={() => setState((prev) => (prev.n === state.n ? { ...prev, previous: null } : prev))}
        >
          {state.previous}
        </span>
      ) : null}
      <span key={`current-${state.n}`} className={cn("[grid-area:1/1]", state.n > 0 && "account-menu-fade")}>
        {state.current}
      </span>
    </span>
  );
}

/** Drops the price entirely once the free space is narrower than the text. */
function PlanPrice({ value }: { value: string }) {
  const slotRef = React.useRef<HTMLSpanElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [show, setShow] = React.useState(true);

  React.useLayoutEffect(() => {
    const slot = slotRef.current;
    const text = textRef.current;
    if (!slot || !text) return;
    const update = () => setShow(slot.clientWidth + 1 >= text.scrollWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={slotRef} className="flex min-w-0 flex-1 overflow-hidden">
      <span ref={textRef} aria-hidden={!show} className={cn("w-max", !show && "invisible")}>
        <Crossfade value={value} className="text-[13px] text-zinc-500 tabular-nums" />
      </span>
    </span>
  );
}

/** Green disc with a white tick: the ring draws, fills and pops, then the tick draws in. */
function SavedCheck() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="account-menu-saved size-4 shrink-0 overflow-visible">
      <circle className="account-menu-saved-ring" cx="8" cy="8" r="7" pathLength={1} />
      <path className="account-menu-saved-tick" d="M4.9 8.3 7.1 10.4 11.2 6" pathLength={1} />
    </svg>
  );
}

function ThemeControl({
  value,
  onChange,
  reduced,
}: {
  value: AccountMenuTheme;
  onChange: (theme: AccountMenuTheme) => void;
  reduced: boolean;
}) {
  const groupRef = React.useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = React.useState<{ left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const selected = group.querySelector<HTMLElement>("[data-checked='true']");
      if (!selected) return;
      setThumb({ left: selected.offsetLeft, width: selected.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Appearance"
      className="account-menu-track relative inline-flex shrink-0 items-center rounded-md bg-zinc-100 p-0.5"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.preventDefault()}
    >
      {thumb ? (
        <span
          aria-hidden
          className="account-menu-thumb absolute top-0.5 bottom-0.5 rounded-[5px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          style={{
            left: thumb.left,
            width: thumb.width,
            transition: reduced ? "none" : `left 180ms ${EASE}, width 180ms ${EASE}, background-color 420ms ${EASE}`,
          }}
        />
      ) : null}
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          data-checked={value === option ? "true" : undefined}
          tabIndex={-1}
          onClick={() => onChange(option)}
          className={cn(
            "relative z-[1] cursor-pointer rounded-[5px] border-0 bg-transparent px-1.5 py-1 text-[11px] font-medium leading-none outline-none",
            value === option ? "text-zinc-950" : "text-zinc-500",
          )}
        >
          {THEME_LABEL[option]}
        </button>
      ))}
    </div>
  );
}

function moveRoving(root: HTMLElement, delta: number) {
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-roving]:not([disabled])")];
  if (!nodes.length) return;
  const current = nodes.findIndex((node) => node === document.activeElement);
  const next = nodes[(Math.max(current, 0) + delta + nodes.length) % nodes.length];
  next?.focus({ preventScroll: true });
}

export const AccountMenu = React.forwardRef<HTMLDivElement, AccountMenuProps>(
  (
    {
      user = DEFAULT_USER,
      plan: controlledPlan,
      items = DEFAULT_ITEMS,
      theme: controlledTheme,
      onThemeChange,
      onProfileSave,
      onLogout,
      onUpgrade,
      onManageBilling,
      onDowngrade,
      onNotificationRead,
      onMarkAllRead,
      helpHref = "#",
      planLabel = "Current plan",
      upgradeLabel = "Upgrade",
      upgradeSuccessLabel = "Upgraded",
      logoutLabel = "Log out",
      className,
      ...props
    },
    ref,
  ) => {
    const reduced = usePrefersReducedMotion();
    const systemDark = useSystemDark();
    const hydrating = useIsHydrating();
    const uid = React.useId();
    const menuId = `${uid}-menu`;
    const planLabelId = `${uid}-plan`;
    const titleId = `${uid}-title`;
    const avatarRef = React.useRef<HTMLButtonElement>(null);
    const signInRef = React.useRef<HTMLButtonElement>(null);
    const resetRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const mainPaneRef = React.useRef<HTMLDivElement>(null);
    const subPaneRef = React.useRef<HTMLDivElement>(null);
    const rowRefs = React.useRef<Array<HTMLElement | null>>([]);
    const typeBuffer = React.useRef("");
    const typeTimer = React.useRef(0);
    const returnIndex = React.useRef(1);
    const upgradeTimers = React.useRef<number[]>([]);
    const defaultName = nameFromHandle(user.handle);
    const [demoPlan, setDemoPlan] = React.useState<AccountMenuPlan>(DEMO_FREE_PLAN);
    const [demoTheme, setDemoTheme] = React.useState<AccountMenuTheme>("system");
    const defaultProfile: AccountMenuProfile = { name: defaultName, handle: user.handle, email: user.email ?? "", phone: user.phone ?? "" };
    const [profile, setProfile] = React.useState<AccountMenuProfile>(defaultProfile);
    const [draft, setDraft] = React.useState<AccountMenuProfile>(defaultProfile);
    const [notes, setNotes] = React.useState<Note[]>(() => DEMO_NOTES.map((note) => ({ ...note, unread: true })));
    const [badgeExit, setBadgeExit] = React.useState(false);
    const lastBadge = React.useRef(3);
    const [saved, setSaved] = React.useState(false);
    const [savedLeaving, setSavedLeaving] = React.useState(false);
    const savedTimers = React.useRef<number[]>([]);
    const [avatarTone, setAvatarTone] = React.useState(0);
    const [billingVisit, setBillingVisit] = React.useState(0);
    const [notesVisit, setNotesVisit] = React.useState(0);
    const [unreadBump, setUnreadBump] = React.useState(0);
    const [notesEmpty, setNotesEmpty] = React.useState(false);
    const markAllTimers = React.useRef<number[]>([]);
    const [shortcutsVisit, setShortcutsVisit] = React.useState(0);
    const [pressedKeys, setPressedKeys] = React.useState<ReadonlySet<string>>(() => new Set());
    const [toast, setToast] = React.useState<{ id: number; message: string; leaving: boolean } | null>(null);
    const toastTimers = React.useRef<number[]>([]);
    const planCardRef = React.useRef<HTMLDivElement>(null);
    const [planCardHeight, setPlanCardHeight] = React.useState<number>();
    const [profileVisit, setProfileVisit] = React.useState(0);
    const saveGhostRef = React.useRef<HTMLSpanElement>(null);
    const savedGhostRef = React.useRef<HTMLSpanElement>(null);
    const [saveWidths, setSaveWidths] = React.useState<{ idle: number; done: number } | null>(null);
    const [signedOut, setSignedOut] = React.useState(false);
    const [logoutStep, setLogoutStep] = React.useState<"idle" | "confirm">("idle");
    const [downgradeAsk, setDowngradeAsk] = React.useState(false);
    const [view, setView] = React.useState<ViewId>("main");
    const [sub, setSub] = React.useState<Exclude<ViewId, "main">>("profile");
    const [live, setLive] = React.useState("");
    const [paneHeight, setPaneHeight] = React.useState<number>();
    const isDemo = controlledPlan === undefined;
    const plan = controlledPlan ?? demoPlan;
    const theme = controlledTheme ?? demoTheme;
    const resolvedDark = (theme === "system" ? systemDark : theme === "dark");
    const [themeShift, setThemeShift] = React.useState(0);
    // Only a click on the Appearance control animates; restoring the stored choice
    // on load (or a fresh tab) must land instantly.
    const themeByUser = React.useRef(false);
    const lastResolvedDark = React.useRef(resolvedDark);
    React.useEffect(() => {
      if (lastResolvedDark.current === resolvedDark) return;
      lastResolvedDark.current = resolvedDark;
      if (!themeByUser.current) return;
      themeByUser.current = false;
      setThemeShift((count) => count + 1);
      const timer = window.setTimeout(() => setThemeShift((count) => -Math.abs(count)), 560);
      return () => window.clearTimeout(timer);
    }, [resolvedDark]);
    const paid = plan.name !== "Free";
    const [upgradeState, setUpgradeState] = React.useState<UpgradeState>("idle");
    const showDarkPill = upgradeState === "loading" || upgradeState === "success" || (!paid && upgradeState !== "settled");
    const [phase, setPhase] = React.useState<"closed" | "open" | "closing">("open");
    const [active, setActive] = React.useState(0);
    const [pill, setPill] = React.useState<{ top: number; left: number; width: number; height: number; radius: string } | null>(null);
    const [slotHeight, setSlotHeight] = React.useState(0);
    const open = phase !== "closed";
    const unread = notes.reduce((count, note) => count + (note.unread ? 1 : 0), 0);
    if (unread > 0) lastBadge.current = unread;
    const viewRef = React.useRef(view);
    viewRef.current = view;

    const initial = (profile.name.trim()[0] || user.initial).toUpperCase();

    useIsomorphicLayoutEffect(() => {
      if (controlledTheme !== undefined) return;
      const stored = readStoredTheme();
      if (stored) setDemoTheme(stored);
    }, [controlledTheme]);

    const changeTheme = (next: AccountMenuTheme) => {
      themeByUser.current = true;
      if (controlledTheme === undefined) {
        setDemoTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          /* demo persistence is best-effort */
        }
      }
      onThemeChange?.(next);
    };

    const say = (message: string) => {
      setLive("");
      window.setTimeout(() => setLive(message), 20);
    };

    // Small in-popover toast for demo-only actions; it also reaches screen readers via say().
    const showToast = (message: string) => {
      toastTimers.current.forEach((id) => window.clearTimeout(id));
      setToast({ id: Date.now(), message, leaving: false });
      say(message);
      toastTimers.current = [
        window.setTimeout(() => setToast((current) => (current ? { ...current, leaving: true } : current)), 1800),
        window.setTimeout(() => setToast(null), reduced ? 1900 : 2000),
      ];
    };

    const rows = React.useMemo<Row[]>(
      () => [
        showDarkPill ? { key: "upgrade", kind: "upgrade" as const } : { key: "manage", kind: "manage" as const },
        ...items.map((item) => ({ key: item.id, kind: "item" as const, item })),
        { key: "logout", kind: "logout" as const },
      ],
      [showDarkPill, items],
    );

    const rowLabel = (row: Row) => {
      if (row.kind === "upgrade") return upgradeLabel;
      if (row.kind === "manage") return "Manage";
      if (row.kind === "item") return row.item.label;
      return logoutLabel;
    };

    const close = React.useCallback(() => {
      setPhase("closing");
      window.setTimeout(() => {
        setPhase("closed");
        setView("main");
        (signedOut ? signInRef : avatarRef).current?.focus();
      }, reduced ? 1 : 120);
    }, [reduced, signedOut]);

    const openMenu = (index: number) => {
      setActive(index);
      setView("main");
      setPhase("open");
    };

    const clearUpgradeTimers = () => {
      upgradeTimers.current.forEach((id) => window.clearTimeout(id));
      upgradeTimers.current = [];
    };

    React.useEffect(() => {
      const timers = upgradeTimers;
      return () => timers.current.forEach((id) => window.clearTimeout(id));
    }, []);

    React.useEffect(() => {
      if (unread > 0) {
        setBadgeExit(false);
        return;
      }
      if (!reduced) setBadgeExit(true);
    }, [unread, reduced]);

    const goBack = React.useCallback(() => {
      setView("main");
      setDowngradeAsk(false);
      setActive(returnIndex.current);
    }, []);

    const openView = (next: Exclude<ViewId, "main">, index: number) => {
      returnIndex.current = index;
      setSub(next);
      if (next === "profile") setProfileVisit((count) => count + 1);
      if (next === "billing") setBillingVisit((count) => count + 1);
      if (next === "notifications") setNotesVisit((count) => count + 1);
      if (next === "shortcuts") setShortcutsVisit((count) => count + 1);
      setDraft(profile);
      setSaved(false);
      setView(next);
    };

    // idle → loading (dots) → success (check, ~1.2s) → settled (Pro badge + Manage).
    const runUpgrade = () => {
      if (upgradeState === "loading" || upgradeState === "success") return;
      onUpgrade?.();
      clearUpgradeTimers();
      setUpgradeState("loading");
      upgradeTimers.current.push(
        window.setTimeout(() => {
          setUpgradeState("success");
          if (isDemo) setDemoPlan(DEMO_PRO_PLAN);
          if (viewRef.current === "billing") showToast("Upgraded to Pro");
          else say("Upgraded to Pro");
          upgradeTimers.current.push(window.setTimeout(() => setUpgradeState("settled"), reduced ? 1 : 1200));
        }, reduced ? 400 : 900),
      );
    };

    const confirmDowngrade = () => {
      onDowngrade?.();
      clearUpgradeTimers();
      setUpgradeState("idle");
      if (isDemo) setDemoPlan(DEMO_FREE_PLAN);
      setDowngradeAsk(false);
      if (viewRef.current === "billing") showToast("Downgraded to Free");
      else say("Downgraded to Free");
    };

    const saveProfile = () => {
      const next = {
        name: draft.name.trim() || profile.name,
        handle: normalizeHandle(draft.handle),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      };
      setProfile(next);
      setDraft(next);
      savedTimers.current.forEach((id) => window.clearTimeout(id));
      setSavedLeaving(false);
      setSaved(true);
      onProfileSave?.(next);
      say("Saved");
      // Hold the check, then let it shrink and blur away before "Save" returns.
      savedTimers.current = [
        window.setTimeout(() => setSavedLeaving(true), reduced ? 1600 : 1820),
        window.setTimeout(() => {
          setSaved(false);
          setSavedLeaving(false);
        }, reduced ? 1700 : 2040),
      ];
    };

    const readOne = (id: string) => {
      setNotes((current) => current.map((note) => (note.id === id ? { ...note, unread: false } : note)));
      setUnreadBump((count) => count + 1);
    };

    const markRead = (id: string) => {
      if (!notes.some((note) => note.id === id && note.unread)) return;
      readOne(id);
      onNotificationRead?.(id);
    };

    // Rows settle into the read state one after another, 40ms apart.
    const markAllRead = () => {
      const pending = notes.filter((note) => note.unread).map((note) => note.id);
      if (!pending.length) return;
      markAllTimers.current.forEach((id) => window.clearTimeout(id));
      if (reduced) {
        setNotes((current) => current.map((note) => ({ ...note, unread: false })));
        setUnreadBump((count) => count + 1);
      } else {
        markAllTimers.current = pending.map((id, index) => window.setTimeout(() => readOne(id), index * 40));
      }
      onMarkAllRead?.();
      say("Marked all as read");
    };

    // While the shortcuts view is open, a listed key presses its keycap for 120ms.
    // The listener only observes: the real shortcut handlers still run as before.
    React.useEffect(() => {
      if (view !== "shortcuts") return;
      const timers = new Map<string, number>();
      const onKey = (event: KeyboardEvent) => {
        const cap = KEYCAP_FOR_KEY[event.key];
        if (!cap) return;
        setPressedKeys((current) => new Set(current).add(cap));
        window.clearTimeout(timers.get(cap));
        timers.set(
          cap,
          window.setTimeout(() => {
            setPressedKeys((current) => {
              const next = new Set(current);
              next.delete(cap);
              return next;
            });
          }, 120),
        );
      };
      document.addEventListener("keydown", onKey, true);
      return () => {
        document.removeEventListener("keydown", onKey, true);
        timers.forEach((id) => window.clearTimeout(id));
        setPressedKeys(new Set());
      };
    }, [view]);

    // Once the last row has faded to read, the list hands over to the empty state.
    React.useEffect(() => {
      if (unread > 0) {
        setNotesEmpty(false);
        return;
      }
      const timer = window.setTimeout(() => setNotesEmpty(true), reduced ? 0 : 260);
      return () => window.clearTimeout(timer);
    }, [unread, reduced]);

    const openHelp = (item: AccountMenuItem) => {
      const href = item.href ?? helpHref;
      item.onSelect?.(href);
      openInNewTab(href);
    };

    const confirmLogout = () => {
      onLogout?.();
      setLogoutStep("idle");
      setSignedOut(true);
      setPhase("closed");
      setView("main");
    };

    const select = (index: number) => {
      const row = rows[index];
      if (!row) return;
      if (row.kind === "upgrade") {
        runUpgrade();
        return;
      }
      if (row.kind === "manage") {
        onManageBilling?.();
        return;
      }
      if (row.kind === "logout") {
        setLogoutStep("confirm");
        setActive(index);
        return;
      }
      if (row.item.id === "appearance") return;
      if (row.item.id === "profile" || row.item.id === "billing" || row.item.id === "notifications" || row.item.id === "shortcuts") {
        openView(row.item.id, index);
        return;
      }
      if (row.item.id === "help") {
        openHelp(row.item);
        return;
      }
      row.item.onSelect?.();
      close();
    };

    const selectRef = React.useRef(select);
    selectRef.current = select;
    const goBackRef = React.useRef(goBack);
    goBackRef.current = goBack;

    React.useEffect(() => {
      if (phase !== "open") return;
      const onPointer = (event: PointerEvent) => {
        const target = event.target as Node;
        if (menuRef.current?.contains(target) || avatarRef.current?.contains(target) || signInRef.current?.contains(target) || resetRef.current?.contains(target)) return;
        close();
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (menuRef.current?.contains(event.target as Node)) return;
          event.preventDefault();
          if (viewRef.current !== "main") goBackRef.current();
          else close();
          return;
        }
        if (isField(event.target) && !event.metaKey && !event.ctrlKey) return;
        const hit = items.find((item) => item.shortcut && shortcutMatches(event, item.shortcut));
        if (!hit) return;
        event.preventDefault();
        const index = rows.findIndex((row) => row.kind === "item" && row.item.id === hit.id);
        if (index >= 0) selectRef.current(index);
      };
      document.addEventListener("pointerdown", onPointer);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", onPointer);
        document.removeEventListener("keydown", onKey);
      };
    }, [phase, close, items, rows]);

    React.useLayoutEffect(() => {
      const node = view === "main" ? mainPaneRef.current : subPaneRef.current;
      if (!node) return;
      // The visible pane is in normal flow, so a 0 read must not be written back.
      // An explicit 0 would clip it, and an absolute pane would then stay 0.
      const measure = () => {
        const next = node.offsetHeight;
        if (next > 0) setPaneHeight(next);
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
      // `open` re-measures on reopen: closing from a sub view remounts the panes,
      // and a stale sub-view height would otherwise clip the main menu.
    }, [view, sub, open]);

    React.useLayoutEffect(() => {
      const menu = menuRef.current;
      if (phase === "closed" || !menu) return;
      // Reserve the main view's height even while a shorter sub view is shown.
      // The demo is vertically centred, so a shrinking slot would pull the whole
      // panel up and down on every drill-in and Back, which reads as close/reopen.
      const shell = menu.querySelector<HTMLElement>(".account-menu-shell");
      const main = mainPaneRef.current;
      const chrome = shell ? menu.offsetHeight - shell.offsetHeight : 0;
      setSlotHeight(Math.max(menu.offsetHeight, main ? main.offsetHeight + chrome : 0));
    }, [phase, paneHeight, plan, rows, view]);

    React.useLayoutEffect(() => {
      if (phase !== "open" || view !== "main") return;
      const row = rowRefs.current[active];
      const pane = mainPaneRef.current;
      if (!row || !pane) return;
      let top = 0;
      let left = 0;
      let node: HTMLElement | null = row;
      while (node && node !== pane) {
        top += node.offsetTop;
        left += node.offsetLeft;
        node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
      }
      setPill({ top, left, width: row.offsetWidth, height: row.offsetHeight, radius: getComputedStyle(row).borderRadius });
      if (logoutStep === "confirm" && rows[active]?.kind === "logout") {
        row.querySelector<HTMLElement>("[data-logout='cancel']")?.focus({ preventScroll: true });
        return;
      }
      row.focus({ preventScroll: true });
    }, [active, phase, rows, view, logoutStep]);

    React.useLayoutEffect(() => {
      if (phase !== "open" || view === "main") return;
      subPaneRef.current?.querySelector<HTMLElement>("[data-title]")?.focus({ preventScroll: true });
    }, [view, phase, sub]);

    React.useEffect(() => {
      if (signedOut) signInRef.current?.focus();
    }, [signedOut]);

    const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (view !== "main") return;
      const activeRow = rows[active];
      if (logoutStep === "confirm" && activeRow?.kind === "logout" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const target = event.key === "ArrowRight" ? "confirm" : "cancel";
        menuRef.current?.querySelector<HTMLElement>(`[data-logout='${target}']`)?.focus({ preventScroll: true });
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => (index + 1) % rows.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => (index - 1 + rows.length) % rows.length);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(rows.length - 1);
      } else if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        activeRow?.kind === "item" &&
        activeRow.item.id === "appearance"
      ) {
        event.preventDefault();
        const current = THEMES.indexOf(theme);
        const delta = event.key === "ArrowRight" ? 1 : -1;
        changeTheme(THEMES[(current + delta + THEMES.length) % THEMES.length]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        close();
      } else if ((event.key === "Enter" || event.key === " ") && !(event.target as HTMLElement).closest("button")) {
        event.preventDefault();
        select(active);
      } else if (/^[\p{L}\p{N}]$/u.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
        typeBuffer.current = (typeBuffer.current + event.key).toLowerCase();
        window.clearTimeout(typeTimer.current);
        typeTimer.current = window.setTimeout(() => {
          typeBuffer.current = "";
        }, 500);
        const match = rows.findIndex((row) => rowLabel(row).toLowerCase().startsWith(typeBuffer.current));
        if (match >= 0) setActive(match);
      }
    };

    const onSubKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isField(event.target) && event.key !== "Escape" && event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        event.stopPropagation();
        return;
      }
      if (event.key === "Escape" || event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        goBack();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        if (subPaneRef.current) moveRoving(subPaneRef.current, event.key === "ArrowDown" ? 1 : -1);
      }
    };

    const rowProps = (index: number) => ({
      ref: (node: HTMLElement | null) => {
        rowRefs.current[index] = node;
      },
      role: "menuitem" as const,
      tabIndex: active === index ? 0 : -1,
      onMouseEnter: () => setActive(index),
      onClick: () => select(index),
    });

    const subTitle = items.find((item) => item.id === sub)?.label ?? sub;
    const mainHidden = view !== "main";
    // Both panes stay opaque while they slide, so the panel never reads as empty mid-swap.
    // The leaving pane only hides once it is fully off-screen.
    const paneMotion = (hidden: boolean, edge: "-100%" | "100%"): React.CSSProperties => ({
      transform: hidden ? `translateX(${edge})` : "none",
      opacity: hidden ? 0 : 1,
      transition: reduced
        ? "opacity 120ms ease-out"
        : hidden
          ? `transform 280ms ${EASE}, opacity 0s linear 280ms`
          : `transform 280ms ${EASE}, opacity 0s`,
    });

    const resetDemo = () => {
      clearUpgradeTimers();
      toastTimers.current.forEach((id) => window.clearTimeout(id));
      setToast(null);
      setUpgradeState("idle");
      setDemoPlan(DEMO_FREE_PLAN);
      setDemoTheme("system");
      try {
        localStorage.setItem(THEME_KEY, "system");
      } catch {
        /* ignore */
      }
      const fresh = defaultProfile;
      setAvatarTone(0);
      setProfile(fresh);
      setDraft(fresh);
      markAllTimers.current.forEach((id) => window.clearTimeout(id));
      setNotes(DEMO_NOTES.map((note) => ({ ...note, unread: true })));
      setBadgeExit(false);
      setSaved(false);
      setSignedOut(false);
      setLogoutStep("idle");
      setDowngradeAsk(false);
      setView("main");
      setLive("");
    };

    // The plan card eases its height when Free and Pro swap content.
    React.useLayoutEffect(() => {
      const node = planCardRef.current;
      if (!node) return;
      const measure = () => setPlanCardHeight(node.offsetHeight);
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [sub, billingVisit, open]);

    // Edits are tracked against the saved profile, field by field.
    const dirty = {
      name: draft.name !== profile.name,
      handle: draft.handle !== profile.handle,
      email: draft.email !== profile.email,
      phone: draft.phone !== profile.phone,
    };
    const profileDirty = dirty.name || dirty.handle || dirty.email || dirty.phone;

    // The Save pill hugs "Save", then widens to fit "✓ Saved" before the check draws.
    // Both widths come from hidden ghost labels so fonts and locales stay exact.
    React.useLayoutEffect(() => {
      const idle = saveGhostRef.current?.offsetWidth;
      const done = savedGhostRef.current?.offsetWidth;
      if (!idle || !done) return;
      setSaveWidths((current) =>
        current && current.idle === idle + 24 && current.done === done + 24 ? current : { idle: idle + 24, done: done + 24 },
      );
    }, [sub, view]);

    const pristine =
      !paid &&
      upgradeState === "idle" &&
      !signedOut &&
      unread === DEMO_NOTES.length &&
      profile.handle === user.handle &&
      profile.name === defaultName &&
      profile.email === defaultProfile.email &&
      profile.phone === defaultProfile.phone &&
      avatarTone === 0 &&
      (controlledTheme !== undefined || demoTheme === "system");

    return (
      <div
        ref={ref}
        data-tsuna-id="settings-save-panel"
        data-theme={resolvedDark ? "dark" : "light"}
        data-theme-shifting={themeShift > 0 ? "true" : undefined}
        suppressHydrationWarning
        className={cn(
          "account-menu relative flex min-h-screen w-full items-center justify-center bg-[#fafafa] text-zinc-950",
          className,
        )}
        {...props}
      >
        {hydrating && controlledTheme === undefined ? (
          <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        ) : null}
        <style>{`
          @keyframes account-menu-in { from { opacity: 0; transform: translateY(-4px) scale(0.96); } to { opacity: 1; transform: none; } }
          @keyframes account-menu-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-4px) scale(0.96); } }
          @keyframes account-menu-section { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
          @keyframes account-menu-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes account-menu-fade-out { from { opacity: 1; } to { opacity: 0; } }
          @keyframes account-menu-swap { from { opacity: 0; transform: translateY(3px) scale(0.92); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
          @keyframes account-menu-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.55; } 30% { transform: translateY(-3px); opacity: 1; } }
          @keyframes account-menu-check { from { transform: scale(0.4) rotate(-20deg); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } to { transform: none; } }
          @keyframes account-menu-badge-out { to { opacity: 0; transform: scale(0.4); } }
          .account-menu-pop { transform-origin: top right; animation: account-menu-in 180ms ease-out both; }
          .account-menu-pop[data-closing="true"] { animation: account-menu-out 120ms ease-in both; }
          .account-menu-section { animation: account-menu-section 180ms ${EASE} both; }
          .account-menu-fade { animation: account-menu-fade 220ms ease-out both; }
          .account-menu-fade-out { animation: account-menu-fade-out 220ms ease-out both; }
          .account-menu-cta { background-color: #1c1e2b; color: #f4f4f5; }
          .account-menu-cta:hover:not([aria-disabled="true"]) { background-color: #2a2d3e; }
          .account-menu-cta .account-menu-cta-check { color: #4ade80; }
          .account-menu-cta .account-menu-cta-dot { background-color: #7b97ff; }
          .account-menu-swap { animation: account-menu-swap 260ms ${EASE} var(--saved-delay, 0ms) both; }
          .account-menu-dot { animation: account-menu-dot 900ms ease-in-out infinite; }
          .account-menu-check { animation: account-menu-check 360ms ${EASE} both; }
          .account-menu-badge-out { animation: account-menu-badge-out 180ms ease-out forwards; }
          @keyframes account-menu-theme-icon { from { transform: rotate(-180deg) scale(0.6); opacity: 0.3; } 60% { transform: rotate(12deg) scale(1.08); opacity: 1; } to { transform: none; } }
          .account-menu[data-theme-shifting="true"],
          .account-menu[data-theme-shifting="true"] *:not(.account-menu-thumb):not(.account-menu-shell):not(.account-menu-pane):not(.account-menu-swap):not(.account-menu-dot) {
            transition: background-color 420ms ${EASE}, color 420ms ${EASE}, border-color 420ms ${EASE}, fill 420ms ${EASE}, stroke 420ms ${EASE}, box-shadow 420ms ${EASE};
          }
          .account-menu-theme-icon { animation: account-menu-theme-icon 520ms ${EASE} both; }
          @keyframes account-menu-saved-ring { from { stroke-dashoffset: 1; fill-opacity: 0; } 70% { stroke-dashoffset: 0; fill-opacity: 0; } to { stroke-dashoffset: 0; fill-opacity: 1; } }
          @keyframes account-menu-saved-pop { 0%, 55% { transform: scale(1); } 78% { transform: scale(1.22); } to { transform: scale(1); } }
          @keyframes account-menu-saved-tick { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
          @keyframes account-menu-saved-out { to { opacity: 0; transform: scale(0.82); filter: blur(4px); } }
          .account-menu-saved { transform-origin: center; animation: account-menu-saved-pop 620ms ${EASE} var(--saved-delay, 0ms) both; }
          .account-menu-saved-ring {
            fill: #3bb15b; stroke: #3bb15b; stroke-width: 1.5;
            stroke-dasharray: 1; transform: rotate(-90deg); transform-origin: center;
            animation: account-menu-saved-ring 420ms ease-out var(--saved-delay, 0ms) both;
          }
          .account-menu-saved-tick {
            fill: none; stroke: #fff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
            stroke-dasharray: 1; animation: account-menu-saved-tick 260ms ease-out calc(480ms + var(--saved-delay, 0ms)) both;
          }
          .account-menu-saved-out { animation: account-menu-saved-out 220ms ease-in forwards; }
          @keyframes account-menu-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .account-menu-rise { animation: account-menu-rise 260ms ${EASE} both; }
          .account-menu-cta:disabled { opacity: 0.4; cursor: default; }
          .account-menu-keycap {
            box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
            transition: transform 80ms ease-out, box-shadow 80ms ease-out;
          }
          .account-menu-keycap[data-pressed="true"] { transform: translateY(1px); box-shadow: none; }
          @keyframes account-menu-bump { 0% { transform: scale(1); } 45% { transform: scale(1.15); } to { transform: scale(1); } }
          .account-menu-bump { animation: account-menu-bump 260ms ${EASE}; }
          .account-menu-cta[aria-busy="true"]:disabled { opacity: 0.7; }
          @keyframes account-menu-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          @keyframes account-menu-toast-out { to { opacity: 0; transform: translateY(4px); } }
          .account-menu-toast-in { animation: account-menu-toast-in 220ms ${EASE} both; }
          .account-menu-toast-out { animation: account-menu-toast-out 180ms ease-in forwards; }
          .account-menu-shell { transition: height 280ms ${EASE}; }
          @media (prefers-reduced-motion: reduce) {
            .account-menu-pop, .account-menu-pop[data-closing="true"] { animation-name: account-menu-fade; animation-duration: 120ms; }
            .account-menu-section { animation-name: account-menu-fade; }
            .account-menu-fade, .account-menu-fade-out { animation-duration: 120ms; }
            .account-menu-swap { animation-name: account-menu-fade; animation-duration: 120ms; }
            .account-menu-dot, .account-menu-check, .account-menu-badge-out, .account-menu-theme-icon { animation: none; }
            .account-menu[data-theme-shifting="true"],
            .account-menu[data-theme-shifting="true"] * { transition-duration: 120ms; }
            .account-menu-shell { transition: none; }
            .account-menu-saved, .account-menu-saved-ring, .account-menu-saved-tick { animation: none; }
            .account-menu-rise { animation: none; }
            .account-menu-bump { animation: none; }
            .account-menu-keycap { transition: none; }
            .account-menu-keycap[data-pressed="true"] { transform: none; }
            .account-menu-note, .account-menu-note * { transition-duration: 0ms !important; }
            .account-menu-toast-in { animation: account-menu-fade 120ms ease-out both; }
            .account-menu-toast-out { animation: account-menu-fade-out 100ms ease-out forwards; }
            .account-menu-saved-out { animation: account-menu-fade-out 100ms ease-out forwards; }
          }
          .account-menu[data-theme="dark"] { background-color: #09090b; color: #fafafa; }
          .account-menu[data-theme="dark"] .account-menu-pop {
            background-color: #18181b;
            color: #fafafa;
            border-color: rgba(255, 255, 255, 0.1);
          }
          .account-menu[data-theme="dark"] .account-menu-pop .text-zinc-950 { color: #fafafa; }
          .account-menu[data-theme="dark"] .account-menu-chip {
            background-color: #18181b;
            color: #e4e4e7;
            border-color: rgba(255, 255, 255, 0.12);
          }
          .account-menu[data-theme="dark"] .account-menu-chip:hover { color: #fafafa; }
          .account-menu[data-theme="dark"] .account-menu-surface,
          .account-menu[data-theme="dark"] .account-menu-field,
          .account-menu[data-theme="dark"] .account-menu-thumb,
          .account-menu[data-theme="dark"] .account-menu-quiet {
            background-color: #27272a;
            color: #fafafa;
            border-color: rgba(255, 255, 255, 0.1);
          }
          .account-menu[data-theme="dark"] .account-menu-quiet { color: #a1a1aa; }
          .account-menu[data-theme="dark"] .account-menu-track { background-color: #09090b; }
          .account-menu[data-theme="dark"] .account-menu-highlight { background-color: rgba(255, 255, 255, 0.06); }
          .account-menu[data-theme="dark"] .account-menu-count,
          .account-menu[data-theme="dark"] .account-menu-unread { background-color: #fafafa; color: #18181b; }
          .account-menu[data-theme="dark"] .account-menu-cta { background-color: #fafafa; color: #18181b; }
          .account-menu[data-theme="dark"] .account-menu-cta:hover:not([aria-disabled="true"]) { background-color: #e4e4e7; }
          .account-menu[data-theme="dark"] .account-menu-cta .account-menu-cta-dot { background-color: #18181b; }
          .account-menu[data-theme="dark"] .account-menu-cta .account-menu-cta-check { color: #16a34a; }
          .account-menu[data-theme="dark"] .account-menu-text-btn { color: #a1a1aa; }
          .account-menu[data-theme="dark"] .account-menu-soft { background-color: #27272a; }
          .account-menu[data-theme="dark"] .account-menu-keycap { box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12); }
          .account-menu[data-theme="dark"] .account-menu-keycap[data-pressed="true"] { box-shadow: none; }
          .account-menu[data-theme="dark"] .account-menu-note:hover { background-color: rgba(255, 255, 255, 0.04); }
          .account-menu[data-theme="dark"] .account-menu-note-read { color: #d4d4d8; }
          .account-menu[data-theme="dark"] .account-menu-note-icon { background-color: rgba(255, 255, 255, 0.08); color: #d4d4d8; }
          .account-menu[data-theme="dark"] .account-menu-card-icon { background-color: #3f3f46; color: #e4e4e7; box-shadow: none; }
          .account-menu[data-theme="dark"] .account-menu-paid { background-color: rgba(74, 222, 128, 0.14); color: #4ade80; }
          .account-menu[data-theme="dark"] .account-menu-toast-pill { background-color: #fafafa; color: #18181b; }
          .account-menu[data-theme="dark"] .account-menu-text-btn:hover:not(:disabled) { color: #fafafa; }
          .account-menu[data-theme="dark"] .account-menu-pop [class*="border-black"] { border-color: rgba(255, 255, 255, 0.08); }
        `}</style>
        <div className="sr-only" aria-live="polite">{live}</div>

        <div className="relative flex w-[320px] max-sm:w-[calc(100vw-1.5rem)] flex-col items-end">
          <div className="flex items-center gap-2">
            {isDemo ? (
              <button
                ref={resetRef}
                type="button"
                disabled={pristine}
                onClick={resetDemo}
                className={cn(
                  "account-menu-chip inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-[12.5px] font-medium text-zinc-600",
                  "transition-opacity hover:text-zinc-950 disabled:cursor-default disabled:opacity-40 disabled:hover:text-zinc-600",
                  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                )}
              >
                <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.75} />
                Reset demo
              </button>
            ) : null}
            {signedOut ? (
              <button
                ref={signInRef}
                type="button"
                onClick={() => {
                  setSignedOut(false);
                  openMenu(0);
                }}
                className={cn(
                  "account-menu-chip inline-flex h-9 cursor-pointer items-center rounded-full border border-black/[0.08] bg-white px-3 text-[13px] font-medium text-zinc-950",
                  "outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                )}
              >
                Sign in
              </button>
            ) : (
              <button
                ref={avatarRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={phase === "open"}
                aria-controls={menuId}
                onClick={() => (phase === "open" ? close() : openMenu(0))}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openMenu(0);
                  }
                }}
                className={cn(
                  "grid size-9 cursor-pointer place-items-center rounded-[10px] border-0 bg-[#fde8f1] text-[14px] font-medium text-[#9d174d]",
                  phase === "open" && "bg-[#f8d5e6]",
                  FOCUS,
                )}
              >
                {initial}
              </button>
            )}
          </div>
          <div className="mt-2 w-full" style={{ minHeight: slotHeight || undefined }}>
          {open && !signedOut ? (
            <div
              ref={menuRef}
              id={menuId}
              role={view === "main" ? "menu" : "dialog"}
              aria-label={view === "main" ? profile.handle : undefined}
              aria-labelledby={view === "main" ? undefined : titleId}
              data-closing={phase === "closing" ? "true" : undefined}
              onKeyDown={onMenuKeyDown}
              className={cn(
                "account-menu-pop relative z-20 w-[320px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-2 text-left text-zinc-950",
                "shadow-[0_24px_50px_-28px_rgba(0,0,0,0.28),0_8px_20px_-16px_rgba(0,0,0,0.12)]",
                "max-sm:w-[calc(100vw-1.5rem)]",
              )}
            >
              {toast ? (
                <div
                  key={toast.id}
                  aria-hidden
                  className={cn(
                    "account-menu-toast pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center",
                    toast.leaving ? "account-menu-toast-out" : "account-menu-toast-in",
                  )}
                >
                  <span className="account-menu-toast-pill inline-flex h-8 items-center rounded-full bg-zinc-950 px-3 text-[12.5px] font-medium text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,0.45)]">
                    {toast.message}
                  </span>
                </div>
              ) : null}
              <div className="account-menu-shell relative overflow-hidden" style={paneHeight ? { height: paneHeight } : undefined}>
                <div
                  ref={mainPaneRef}
                  className={cn("account-menu-pane top-0 w-full", mainHidden ? "absolute inset-x-0" : "relative")}
                  style={paneMotion(mainHidden, "-100%")}
                  inert={mainHidden}
                  aria-hidden={mainHidden}
                >
                  {pill && view === "main" && active !== 0 ? (
                    <div
                      aria-hidden
                      className="account-menu-highlight pointer-events-none absolute z-0 bg-black/[0.04]"
                      style={{
                        borderRadius: pill.radius,
                        top: pill.top,
                        left: pill.left,
                        width: pill.width,
                        height: pill.height,
                        transition: reduced ? "none" : `top 180ms ${EASE}, left 180ms ${EASE}, width 180ms ${EASE}, height 180ms ${EASE}`,
                      }}
                    />
                  ) : null}

                  <div className="account-menu-section relative z-[1] flex items-center gap-3 px-2 py-1.5">
                    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-medium", AVATAR_TONES[avatarTone])}>
                      {initial}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium tracking-[-0.01em]">{profile.handle}</span>
                      <span className="block truncate text-[12.5px] text-zinc-500">{user.subtitle}</span>
                    </span>
                  </div>

                  <div
                    role="group"
                    aria-labelledby={planLabelId}
                    className="account-menu-surface account-menu-section relative z-[1] mx-1 mt-1 flex min-w-0 flex-nowrap items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
                      <div id={planLabelId} className="shrink-0 text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                        {planLabel}
                      </div>
                      <Crossfade value={plan.name} className="shrink-0 text-[17px] leading-6 font-semibold tracking-[-0.01em] text-zinc-950" />
                      {plan.price ? <PlanPrice value={plan.price} /> : null}
                    </div>
                    {showDarkPill ? (
                      <button
                        {...rowProps(0)}
                        type="button"
                        aria-busy={upgradeState === "loading"}
                        aria-disabled={upgradeState === "loading" || upgradeState === "success"}
                        className={cn(
                          "account-menu-cta relative inline-flex h-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 px-3 text-[13px] font-medium whitespace-nowrap",
                          "active:scale-[0.98] aria-disabled:cursor-default",
                          "outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        )}
                        style={{
                          width: upgradeState === "loading" ? 72 : undefined,
                          transition: reduced ? "none" : `width 420ms ${EASE}, background-color 150ms ease, transform 120ms ease`,
                        }}
                      >
                        <span key={upgradeState} className="account-menu-swap inline-flex items-center gap-1.5 whitespace-nowrap">
                          {upgradeState === "loading" ? (
                            <>
                              <span className="sr-only">Upgrading…</span>
                              {[0, 1, 2].map((dot) => (
                                <span key={dot} aria-hidden className="account-menu-dot account-menu-cta-dot size-[5px] rounded-full" style={{ animationDelay: `${dot * 120}ms` }} />
                              ))}
                            </>
                          ) : upgradeState === "success" ? (
                            <>
                              <Check aria-hidden className="account-menu-check account-menu-cta-check size-4" strokeWidth={2.5} />
                              {upgradeSuccessLabel}
                            </>
                          ) : (
                            upgradeLabel
                          )}
                        </span>
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="account-menu-quiet inline-flex h-7 items-center rounded-full bg-zinc-100 px-2 text-[12px] font-medium text-zinc-500">{plan.name}</span>
                        <button
                          {...rowProps(0)}
                          type="button"
                          className={cn("inline-flex h-8 cursor-pointer items-center rounded-lg border-0 bg-transparent px-2 text-[12.5px] font-medium whitespace-nowrap text-zinc-500 hover:text-zinc-950", FOCUS)}
                        >
                          Manage
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="account-menu-section relative z-[1] mt-1">
                    {items.map((item, index) => {
                      const rowIndex = 1 + index;
                      const Icon = item.icon;
                      const appearance = item.id === "appearance";
                      const hint = item.hint !== undefined ? item.hint : item.id === "billing" ? plan.name : undefined;
                      const showBadge = item.id === "notifications" && (unread > 0 || badgeExit);
                      const rowClass = cn("flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 text-left", FOCUS);
                      const body = (
                        <>
                          <Icon
                            key={appearance && themeShift !== 0 ? `theme-${Math.abs(themeShift)}` : undefined}
                            aria-hidden
                            className={cn("size-[18px] shrink-0 text-zinc-500", appearance && themeShift !== 0 && "account-menu-theme-icon")}
                            strokeWidth={1.75}
                          />
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{item.label}</span>
                          {appearance ? (
                            <ThemeControl value={theme} onChange={changeTheme} reduced={reduced} />
                          ) : (
                            <>
                              {showBadge ? (
                                <span
                                  className={cn(
                                    "account-menu-count grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-zinc-950 px-1 text-[10px] font-semibold leading-none text-white tabular-nums",
                                    badgeExit && unread === 0 && "account-menu-badge-out",
                                  )}
                                  onAnimationEnd={() => setBadgeExit(false)}
                                >
                                  {unread > 0 ? unread : lastBadge.current}
                                </span>
                              ) : null}
                              {hint ? <Crossfade value={hint} className="shrink-0 text-[12.5px] font-medium text-zinc-500" /> : null}
                              {item.shortcut ? <span className="shrink-0 font-mono text-[12px] text-zinc-500">{item.shortcut}</span> : null}
                              {item.external ? <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-zinc-400" strokeWidth={1.75} /> : null}
                            </>
                          )}
                        </>
                      );
                      if (appearance) {
                        return (
                          <div key={item.id} {...rowProps(rowIndex)} className={rowClass}>
                            {body}
                          </div>
                        );
                      }
                      return (
                        <button key={item.id} {...rowProps(rowIndex)} type="button" aria-label={showBadge ? `${item.label}, ${unread || lastBadge.current}` : undefined} className={rowClass}>
                          {body}
                        </button>
                      );
                    })}
                  </div>

                  <div className="account-menu-section relative z-[1] mt-1 border-t border-black/[0.06] pt-1">
                    {logoutStep === "confirm" ? (
                      <div {...rowProps(rows.length - 1)} className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left" onClick={(event) => event.stopPropagation()}>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">Log out?</span>
                        <button data-logout="cancel" type="button" tabIndex={-1} onClick={() => setLogoutStep("idle")} className={cn("cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-[13px] font-medium text-zinc-500", FOCUS)}>
                          Cancel
                        </button>
                        <button data-logout="confirm" type="button" tabIndex={-1} onClick={confirmLogout} className={cn("cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-[13px] font-medium text-[#b42318]", FOCUS)}>
                          Log out
                        </button>
                      </div>
                    ) : (
                      <button
                        {...rowProps(rows.length - 1)}
                        type="button"
                        className={cn(
                          "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 text-left text-zinc-950",
                          active === rows.length - 1 && "text-[#b42318]",
                          FOCUS,
                        )}
                      >
                        <LogOut aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
                        <span className="text-[14px] font-medium">{logoutLabel}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div
                  ref={subPaneRef}
                  className={cn("account-menu-pane top-0 w-full", view === "main" ? "absolute inset-x-0" : "relative")}
                  style={paneMotion(view === "main", "100%")}
                  inert={view === "main"}
                  aria-hidden={view === "main"}
                  onKeyDown={onSubKeyDown}
                >
                  <div className="flex h-10 items-center gap-1 px-1">
                    <button data-roving type="button" tabIndex={-1} aria-label="Back" onClick={goBack} className={cn("grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-zinc-500", FOCUS)}>
                      <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
                    </button>
                    <h2 id={titleId} data-title data-roving tabIndex={-1} className="m-0 truncate text-[14px] font-medium outline-none">
                      {subTitle}
                    </h2>
                    {sub === "notifications" ? (
                      <>
                        {unread > 0 ? (
                          <span
                            key={unreadBump}
                            aria-label={`${unread} unread`}
                            className={cn(
                              // Same black-on-white treatment as the main menu's Notifications badge.
                              "account-menu-accent-pill account-menu-count ml-0.5 inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[11px] font-semibold text-white tabular-nums",
                              unreadBump > 0 && "account-menu-bump",
                            )}
                          >
                            {unread}
                          </span>
                        ) : null}
                        <button
                          data-roving
                          type="button"
                          tabIndex={-1}
                          disabled={unread === 0}
                          onClick={markAllRead}
                          className="account-menu-text-btn ml-auto shrink-0 cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-[12px] font-medium text-zinc-500 outline-none transition-opacity duration-200 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70 disabled:cursor-default disabled:opacity-40 disabled:hover:text-zinc-500"
                        >
                          Mark all as read
                        </button>
                      </>
                    ) : null}
                  </div>

                  {sub === "profile" ? (
                    <form
                      key={profileVisit}
                      className="px-2 pt-1 pb-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!profileDirty) return;
                        saveProfile();
                      }}
                    >
                      <div className="mb-4 flex flex-col items-center pt-1">
                        <span className="relative">
                          <span aria-hidden className={cn("grid size-14 place-items-center rounded-2xl text-[20px] font-medium transition-colors duration-200", AVATAR_TONES[avatarTone])}>
                            {initial}
                          </span>
                          <button
                            data-roving
                            type="button"
                            aria-label="Change avatar color"
                            onClick={() => setAvatarTone((tone) => (tone + 1) % AVATAR_TONES.length)}
                            className={cn(
                              "account-menu-chip absolute -right-1.5 -bottom-1.5 grid size-6 cursor-pointer place-items-center rounded-full border border-black/[0.08] bg-white text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:text-zinc-950",
                              "outline-none focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70",
                            )}
                          >
                            <Camera aria-hidden className="size-3" strokeWidth={2} />
                          </button>
                        </span>
                        <span className="mt-2 max-w-full truncate text-[13px] text-zinc-500">{profile.handle}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(
                          [
                            { key: "name", label: "Name", wide: false },
                            { key: "handle", label: "Username", wide: false },
                            { key: "email", label: "Email", wide: true },
                            { key: "phone", label: "Phone", wide: true },
                          ] as const
                        ).map((field, index) => {
                          const id = `${uid}-profile-${field.key}`;
                          const set = (value: string) => setDraft((current) => ({ ...current, [field.key]: value }));
                          return (
                            <div
                              key={field.key}
                              className={cn("account-menu-rise min-w-0", field.wide && "sm:col-span-2")}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <label htmlFor={id} className={PROFILE_LABEL}>
                                {field.label}
                                {dirty[field.key] ? (
                                  <>
                                    <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                                    <span className="sr-only">(edited)</span>
                                  </>
                                ) : null}
                              </label>
                              {field.key === "handle" ? (
                                // The @ is fixed, muted chrome; the field edits the bare username.
                                <span className="relative block">
                                  <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[14px] text-zinc-400">@</span>
                                  <input
                                    id={id}
                                    data-roving
                                    value={draft.handle.replace(/^@+/, "")}
                                    onChange={(event) => set(`@${event.target.value.replace(/^@+/, "")}`)}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className={cn(PROFILE_FIELD, "pl-[1.6rem]")}
                                  />
                                </span>
                              ) : (
                                <input
                                  id={id}
                                  data-roving
                                  value={draft[field.key]}
                                  onChange={(event) => set(event.target.value)}
                                  {...(field.key === "email"
                                    ? { type: "email", inputMode: "email" as const, autoComplete: "email", spellCheck: false }
                                    : field.key === "phone"
                                      ? { type: "tel", inputMode: "tel" as const, autoComplete: "tel" }
                                      : { autoComplete: "name" })}
                                  className={cn(PROFILE_FIELD, field.key === "phone" && "tabular-nums")}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-1">
                        {/* Cancel puts the fields back to the saved values. */}
                        <button
                          data-roving
                          type="button"
                          disabled={!profileDirty}
                          onClick={() => setDraft(profile)}
                          className={cn(
                            "account-menu-text-btn inline-flex h-8 cursor-pointer items-center rounded-full border-0 bg-transparent px-3 text-[13px] font-medium text-zinc-500 hover:text-zinc-950",
                            "disabled:cursor-default disabled:opacity-40 disabled:hover:text-zinc-500",
                            "outline-none focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70",
                          )}
                        >
                          Cancel
                        </button>
                        {/* Confirmation lives in the button: it widens first, then the check draws in; on exit it blurs away and the pill narrows. */}
                        <button
                          data-roving
                          type="submit"
                          disabled={!profileDirty && !saved}
                          className="account-menu-cta relative inline-flex h-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 px-3 text-[13px] font-medium whitespace-nowrap"
                          style={{
                            width: saveWidths ? (saved ? saveWidths.done : saveWidths.idle) : undefined,
                            transition: reduced ? "none" : `width 260ms ${EASE}`,
                          }}
                        >
                          <span aria-hidden className="pointer-events-none invisible absolute inline-flex items-center gap-1.5">
                            <span ref={saveGhostRef}>Save</span>
                          </span>
                          <span aria-hidden className="pointer-events-none invisible absolute inline-flex items-center">
                            <span ref={savedGhostRef} className="inline-flex items-center gap-1.5">
                              <span className="size-4" />
                              Saved
                            </span>
                          </span>
                          <span
                            key={saved ? "saved" : "save"}
                            className={cn(
                              "inline-flex items-center gap-1.5",
                              saved && savedLeaving ? "account-menu-saved-out" : "account-menu-swap",
                            )}
                            style={saved && !savedLeaving && !reduced ? ({ "--saved-delay": "220ms" } as React.CSSProperties) : undefined}
                          >
                            {saved ? (
                              <>
                                <SavedCheck />
                                Saved
                              </>
                            ) : (
                              "Save"
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {sub === "billing" ? (
                    <div key={billingVisit} className="flex flex-col gap-4 px-2 pt-1 pb-2">
                      <div className="account-menu-rise" style={{ animationDelay: "0ms" }}>
                        <div
                          className="account-menu-soft overflow-hidden rounded-[12px] bg-[#f4f5f7]"
                          style={{
                            height: planCardHeight,
                            transition: reduced ? "none" : `height 280ms ${EASE}`,
                          }}
                        >
                          <div ref={planCardRef} className="p-[14px]">
                            <div key={paid ? "pro" : "free"} className="account-menu-swap">
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-[15px] font-semibold tracking-[-0.01em]">{plan.name}</span>
                                <span className="text-[13px] text-zinc-500 tabular-nums">{plan.price}</span>
                              </div>
                              {paid ? (
                                <>
                                  <p className="m-0 mt-1 text-[12.5px] text-zinc-500 tabular-nums">Renews {RENEWAL} · $12</p>
                                  {downgradeAsk ? (
                                    <div className="mt-2.5 flex items-center gap-1">
                                      <span className="min-w-0 flex-1 text-[13px]">Downgrade to Free?</span>
                                      <button data-roving type="button" onClick={() => setDowngradeAsk(false)} className="account-menu-text-btn cursor-pointer rounded-full border-0 bg-transparent px-2.5 py-1 text-[13px] font-medium text-zinc-500 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70">
                                        Cancel
                                      </button>
                                      <button data-roving type="button" onClick={confirmDowngrade} className="account-menu-text-btn cursor-pointer rounded-full border-0 bg-transparent px-2.5 py-1 text-[13px] font-medium text-zinc-500 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70">
                                        Downgrade
                                      </button>
                                    </div>
                                  ) : (
                                    <button data-roving type="button" onClick={() => setDowngradeAsk(true)} className="account-menu-text-btn -ml-1 mt-1.5 inline-flex cursor-pointer rounded-full border-0 bg-transparent px-1 py-1 text-[13px] font-medium text-zinc-500 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70">
                                      Downgrade to Free
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="m-0 mt-1 text-[12.5px] leading-[1.45] text-zinc-500">Pro adds unlimited projects and priority support.</p>
                                  <button
                                    data-roving
                                    type="button"
                                    aria-busy={upgradeState === "loading"}
                                    disabled={upgradeState === "loading"}
                                    onClick={runUpgrade}
                                    className="account-menu-cta mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[10px] border-0 px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70 disabled:cursor-default"
                                  >
                                    {upgradeState === "loading" ? "Upgrading…" : "Upgrade to Pro"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <section className="account-menu-rise" style={{ animationDelay: "40ms" }} aria-labelledby={`${uid}-billing-card`}>
                        <h3 id={`${uid}-billing-card`} className="m-0 mb-1.5 text-[12px] font-medium text-zinc-500">
                          Payment method
                        </h3>
                        {paid ? (
                          <div className="account-menu-soft flex min-h-12 items-center gap-2.5 rounded-[10px] bg-[#f4f5f7] py-2 pr-1.5 pl-3">
                            <span aria-hidden className="account-menu-card-icon grid h-5 w-7 shrink-0 place-items-center rounded-[4px] bg-white text-zinc-600 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
                              <CreditCard className="size-3.5" strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-medium tabular-nums">Visa •••• 4242</span>
                              <span className="block text-[12px] text-zinc-500 tabular-nums">Expires 08/28</span>
                            </span>
                            <button
                              data-roving
                              type="button"
                              onClick={() => showToast("Card update is a demo")}
                              className="account-menu-text-btn shrink-0 cursor-pointer rounded-full border-0 bg-transparent px-2.5 py-1 text-[13px] font-medium text-zinc-500 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <p className="m-0 text-[13px] text-zinc-500">No card on file</p>
                        )}
                      </section>

                      <section className="account-menu-rise" style={{ animationDelay: "80ms" }} aria-labelledby={`${uid}-billing-invoices`}>
                        <h3 id={`${uid}-billing-invoices`} className="m-0 mb-0.5 text-[12px] font-medium text-zinc-500">
                          Invoices
                        </h3>
                        {paid ? (
                          <ul className="m-0 list-none p-0">
                            {DEMO_INVOICES.map((date) => (
                              <li key={date} className="flex h-10 items-center gap-2 border-t border-black/[0.06] first:border-t-0">
                                <span className="min-w-0 flex-1 truncate text-[13px] tabular-nums">
                                  {date} <span className="text-zinc-500">· $12.00</span>
                                </span>
                                <span className="account-menu-paid inline-flex h-5 shrink-0 items-center rounded-full bg-[#e7f6ec] px-1.5 text-[11px] font-medium text-[#1f7a3d]">
                                  Paid
                                </span>
                                <button
                                  data-roving
                                  type="button"
                                  aria-label={`Download invoice for ${date}`}
                                  onClick={() => showToast("Invoice download is a demo")}
                                  className="account-menu-text-btn grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-zinc-500 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[#7b97ff]/70"
                                >
                                  <Download aria-hidden className="size-3.5" strokeWidth={1.9} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="m-0 mt-1 text-[13px] text-zinc-500">No invoices yet</p>
                        )}
                      </section>
                    </div>
                  ) : null}

                  {sub === "notifications" ? (
                    <div className="px-1 pt-1 pb-2">
                      {notesEmpty ? (
                        <div className="account-menu-fade flex flex-col items-center px-4 pt-5 pb-6 text-center">
                          <span aria-hidden className="account-menu-soft grid size-11 place-items-center rounded-full bg-[#f4f5f7] text-[#1f7a3d]">
                            <Check className="size-5" strokeWidth={2.25} />
                          </span>
                          <p className="m-0 mt-3 text-[14px] font-medium">You&apos;re all caught up</p>
                          <p className="m-0 mt-1 text-[12.5px] text-zinc-500">New notifications will show up here.</p>
                        </div>
                      ) : (
                        <ul key={notesVisit} className={cn("m-0 flex list-none flex-col p-0", unread === 0 && "account-menu-fade-out")}>
                          {notes.map((note, index) => {
                            const kind = NOTE_KIND[note.id] ?? NOTE_KIND.comment;
                            const KindIcon = kind.icon;
                            return (
                              <li key={note.id} className="account-menu-rise border-b border-black/[0.06] last:border-b-0" style={{ animationDelay: `${index * 30}ms` }}>
                                <button
                                  data-roving
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => markRead(note.id)}
                                  aria-label={`${note.title}: ${note.body}, ${note.time}${note.unread ? ", unread" : ""}`}
                                  className={cn(
                                    "account-menu-note flex w-full cursor-pointer items-start gap-3 rounded-none border-0 px-2.5 py-3 text-left outline-none",
                                    "transition-[background-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7b97ff]/70",
                                    // No boxed fill: rows sit on the popover, split by hairlines; unread reads from the dot and title.
                                    "bg-transparent hover:bg-black/[0.03]",
                                    note.unread && "account-menu-note-unread",
                                  )}
                                >
                                  <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-full", NOTE_ICON_TILE)}>
                                    <KindIcon className="size-4" strokeWidth={1.9} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={cn(
                                        "block truncate text-[13.5px] font-medium transition-colors duration-200",
                                        note.unread ? "text-zinc-950" : "account-menu-note-read text-zinc-600",
                                      )}
                                    >
                                      {note.title}
                                    </span>
                                    <span className="block truncate text-[12.5px] text-zinc-500">{note.body}</span>
                                  </span>
                                  <span className="flex shrink-0 flex-col items-end gap-1.5 pt-px">
                                    <span className="text-[12px] text-zinc-500">{note.time}</span>
                                    <span
                                      aria-hidden
                                      className={cn("account-menu-unread size-1.5 rounded-full bg-zinc-950 transition-opacity duration-200 ease-out", note.unread ? "opacity-100" : "opacity-0")}
                                    />
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}

                  {sub === "shortcuts" ? (
                    <div key={shortcutsVisit} className="flex flex-col gap-3 px-1 pt-1 pb-2">
                      {SHORTCUT_GROUPS.map((group, groupIndex) => {
                        const offset = SHORTCUT_GROUPS.slice(0, groupIndex).reduce((total, previous) => total + previous.rows.length, 0);
                        const labelId = `${uid}-shortcuts-${groupIndex}`;
                        return (
                          <section key={group.label} aria-labelledby={labelId}>
                            <h3
                              id={labelId}
                              className="account-menu-rise m-0 mb-0.5 border-b border-black/[0.06] px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase"
                              style={{ animationDelay: `${offset * 30}ms` }}
                            >
                              {group.label}
                            </h3>
                            <ul className="m-0 list-none p-0">
                              {group.rows.map((row, rowIndex) => (
                                <li
                                  key={row.label}
                                  className="account-menu-rise flex h-9 items-center justify-between gap-3 px-2.5 text-[13.5px]"
                                  style={{ animationDelay: `${(offset + rowIndex) * 30}ms` }}
                                >
                                  <span>{row.label}</span>
                                  <span className="inline-flex items-center gap-1">
                                    {row.keys.map((key) => (
                                      <Keycap key={key} label={key} pressed={pressedKeys.has(key)} />
                                    ))}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </section>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    );
  },
);

AccountMenu.displayName = "AccountMenu";
