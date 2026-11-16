"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Crown,
  Download,
  Eye,
  FolderPlus,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TeamMemberAccess = "Full" | "Edit" | "View";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Shown in the Group column (see `groups`). Defaults to the first group. */
  groupId?: string;
  /** Project names; the first letter of each becomes a small tile (up to 3, then "+N"). */
  projects?: readonly string[];
  /** Pre-formatted, e.g. "Jun 24, 2026". */
  joined?: string;
  /** Pre-formatted, e.g. "3m ago". The activeNow label gets a green dot. */
  lastActive?: string;
  /** Defaults from the role: Owner/Admin = Full, Editor = Edit, others = View. */
  access?: TeamMemberAccess;
  /** Invited but not joined yet: dashed avatar, "Invited" in Last active, and a Resend invite action. */
  pending?: boolean;
  /** No role select and no menu, e.g. the owner. */
  locked?: boolean;
};

export type TeamMembersGroup = { id: string; label: string };

export type TeamMembersLabels = {
  breadcrumb?: string;
  inviteMember?: string;
  newGroup?: string;
  export?: string;
  more?: string;
  allMembers?: string;
  group?: string;
  search?: string;
  searchShortcut?: string;
  filter?: string;
  memberCount?: string;
  name?: string;
  role?: string;
  projects?: string;
  joined?: string;
  lastActive?: string;
  access?: string;
  actions?: string;
  activeNow?: string;
  invited?: string;
  changeRole?: string;
  resendInvite?: string;
  inviteResent?: string;
  remove?: string;
  removed?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  roleLabel?: string;
  sendInvite?: string;
  invalidEmail?: string;
  noResults?: string;
};

export type TeamMembersTableProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: string;
  /** Kept for screen readers as the page description. */
  description?: string;
  groups?: readonly TeamMembersGroup[];
  members?: readonly TeamMember[];
  /** Roles offered in the role menus. */
  roles?: readonly string[];
  /** One muted line under each role in the role menus, keyed by role name (case-insensitive). */
  roleDescriptions?: Readonly<Record<string, string>>;
  /** Pre-filled address in the invite popover. */
  defaultInviteEmail?: string;
  defaultInviteRole?: string;
  onInvite?: (email: string, role: string) => void;
  onRoleChange?: (id: string, role: string) => void;
  onResendInvite?: (id: string) => void;
  onRemove?: (id: string) => void;
  /** The table's Filter button. */
  onFilterClick?: () => void;
  onNewGroup?: () => void;
  onExport?: () => void;
  labels?: TeamMembersLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CSS = `
@keyframes team-members-table-grow { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
@keyframes team-members-table-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes team-members-table-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes team-members-table-pop { from { opacity: 0; transform: scale(0.97) translateY(-4px); } to { opacity: 1; transform: none; } }
.team-members-table-grow { animation: team-members-table-grow 220ms ${EASE_OUT} both; }
.team-members-table-fade-in { animation: team-members-table-fade-in 200ms ${EASE} both; }
.team-members-table-fade-out { animation: team-members-table-fade-out 160ms ${EASE} both; }
.team-members-table-pop { animation: team-members-table-pop 160ms ${EASE} both; transform-origin: top right; }
@keyframes team-members-table-menu-in { from { opacity: 0; transform: translateY(var(--team-members-table-menu-y, -4px)) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes team-members-table-menu-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(var(--team-members-table-menu-y, -4px)) scale(0.98); } }
.team-members-table-menu-in { animation: team-members-table-menu-in 140ms ${EASE_OUT} both; }
.team-members-table-menu-out { animation: team-members-table-menu-out 100ms ${EASE} both; pointer-events: none; }
.team-members-table-swap-in { animation: team-members-table-fade-in 120ms ${EASE} both; }
.team-members-table-swap-out { animation: team-members-table-fade-out 120ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .team-members-table-grow, .team-members-table-fade-in, .team-members-table-pop, .team-members-table-menu-in, .team-members-table-swap-in { animation: none; }
  .team-members-table-fade-out, .team-members-table-menu-out, .team-members-table-swap-out { animation: none; opacity: 0; }
}
`;

const DEFAULT_GROUPS: readonly TeamMembersGroup[] = [
  { id: "core", label: "Core team" },
  { id: "contributors", label: "Contributors" },
];

const DEFAULT_MEMBERS: readonly TeamMember[] = [
  {
    id: "m1",
    name: "Hana Sato",
    email: "hana@lumen.dev",
    role: "Owner",
    groupId: "core",
    projects: ["Atlas", "Billing", "Checkout", "Docs"],
    joined: "Jan 12, 2025",
    lastActive: "Active now",
    locked: true,
  },
  {
    id: "m2",
    name: "Kenji Arai",
    email: "kenji@lumen.dev",
    role: "Admin",
    groupId: "core",
    projects: ["Atlas", "Billing"],
    joined: "Mar 3, 2025",
    lastActive: "3m ago",
  },
  {
    id: "m3",
    name: "Leila Haddad",
    email: "leila@lumen.dev",
    role: "Editor",
    groupId: "core",
    projects: ["Checkout", "Docs", "Mobile"],
    joined: "Jun 24, 2026",
    lastActive: "2h ago",
  },
  {
    id: "m4",
    name: "Tomás Rivera",
    email: "tomas@lumen.dev",
    role: "Editor",
    groupId: "contributors",
    projects: ["Docs"],
    joined: "Aug 18, 2026",
    lastActive: "Yesterday",
  },
  {
    id: "m5",
    name: "Mei Lin Chow",
    email: "mei@lumen.dev",
    role: "Viewer",
    groupId: "contributors",
    projects: ["Mobile", "Atlas"],
    joined: "Oct 2, 2026",
    lastActive: "Nov 9",
  },
];

const DEFAULT_ROLES: readonly string[] = ["Admin", "Editor", "Viewer"];

const DEFAULT_ROLE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  owner: "Full access, including billing",
  admin: "Manage members and settings",
  editor: "Edit projects and content",
  viewer: "View only",
};

const DEFAULT_LABELS: Required<TeamMembersLabels> = {
  breadcrumb: "Team",
  inviteMember: "Invite member",
  newGroup: "New group",
  export: "Export",
  more: "More",
  allMembers: "All members",
  group: "Group",
  search: "Search",
  searchShortcut: "⌘F",
  filter: "Filter",
  memberCount: "Members",
  name: "Name",
  role: "Role",
  projects: "Projects",
  joined: "Joined",
  lastActive: "Last active",
  access: "Access",
  actions: "Actions",
  activeNow: "Active now",
  invited: "Invited",
  changeRole: "Change role",
  resendInvite: "Resend invite",
  inviteResent: "Invite resent",
  remove: "Remove",
  removed: "Removed",
  emailLabel: "Email address",
  emailPlaceholder: "name@company.com",
  roleLabel: "Role",
  sendInvite: "Send invite",
  invalidEmail: "Enter a valid email, like name@company.com.",
  noResults: "No members match your search.",
};

/** One icon per role (case-insensitive); unknown roles show text only. */
const ROLE_ICON: Record<string, LucideIcon> = {
  owner: Crown,
  admin: ShieldCheck,
  editor: PenLine,
  viewer: Eye,
};
const roleIcon = (role: string): LucideIcon | undefined => ROLE_ICON[role.trim().toLowerCase()];

/** Rows sort Owner → Admin → Editor → Viewer; other roles come last. Ties keep their order. */
const ROLE_ORDER = ["owner", "admin", "editor", "viewer"];
const roleRank = (role: string) => {
  const index = ROLE_ORDER.indexOf(role.trim().toLowerCase());
  return index < 0 ? ROLE_ORDER.length : index;
};

function accessFor(member: TeamMember): TeamMemberAccess {
  if (member.access) return member.access;
  const role = member.role.trim().toLowerCase();
  if (role === "owner" || role === "admin") return "Full";
  if (role === "editor") return "Edit";
  return "View";
}

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

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

/** The label crossfades when the value changes. */
function FadeSwap({ value }: { value: string }) {
  const [pair, setPair] = React.useState({ prev: value, current: value });
  if (pair.current !== value) setPair({ prev: pair.current, current: value });
  const changed = pair.prev !== pair.current;
  return (
    <span className="inline-grid">
      {changed ? (
        <span key={`out-${pair.prev}-${pair.current}`} aria-hidden className="team-members-table-swap-out col-start-1 row-start-1">
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={cn("col-start-1 row-start-1", changed && "team-members-table-swap-in")}>
        {pair.current}
      </span>
    </span>
  );
}

const ROLE_MENU_ATTR = "data-team-members-role-menu";
const INVITE_ROLE_KEY = "__invite__";
const SOFT_FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200";

type RoleMenuProps = {
  anchor: HTMLElement;
  label: string;
  value: string;
  roles: readonly string[];
  describe: (role: string) => string | undefined;
  closing: boolean;
  onSelect: (role: string) => void;
  onClose: (restoreFocus: boolean) => void;
};

/** Role picker drawn in a portal, so the table card and the invite popover never clip it. */
function RoleMenu({ anchor, label, value, roles, describe, closing, onSelect, onClose }: RoleMenuProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const close = React.useRef(onClose);
  React.useEffect(() => {
    close.current = onClose;
  });
  const [place, setPlace] = React.useState<{ top: number; left: number; minWidth: number; above: boolean } | null>(null);

  // Below the trigger with a 4px gap, left edges aligned; flips up when there is no room below.
  React.useLayoutEffect(() => {
    const update = () => {
      const menu = ref.current;
      if (!menu || !anchor.isConnected) return;
      const box = anchor.getBoundingClientRect();
      const minWidth = Math.max(box.width, 180);
      menu.style.minWidth = `${minWidth}px`;
      const { offsetWidth: width, offsetHeight: height } = menu;
      const above = box.bottom + 4 + height > window.innerHeight - 8 && box.top - 4 - height >= 8;
      setPlace({
        top: above ? box.top - 4 - height : box.bottom + 4,
        left: Math.max(8, Math.min(box.left, window.innerWidth - 8 - width)),
        minWidth,
        above,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchor]);

  // Focus the selected option once the menu is placed (it is hidden while being measured).
  const placed = place !== null;
  React.useEffect(() => {
    if (!placed) return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']") ?? []);
    (items.find((item) => item.getAttribute("aria-checked") === "true") ?? items[0])?.focus({ preventScroll: true });
  }, [placed]);

  // Close on outside press.
  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (ref.current?.contains(node) || anchor.contains(node)) return;
      close.current(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [anchor]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // The menu sits inside the component's React tree: keep keys from reaching the root handlers.
    event.stopPropagation();
    const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']") ?? []);
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (index: number) => items[(index + items.length) % items.length]?.focus({ preventScroll: true });
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusAt(at + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusAt(at < 0 ? -1 : at - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(-1);
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close.current(true);
    }
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      {...{ [ROLE_MENU_ATTR]: "" }}
      onKeyDown={onKeyDown}
      className={cn(
        "fixed z-50 rounded-[10px] border border-zinc-200 bg-white p-1 text-zinc-900",
        "shadow-[0_12px_28px_-14px_rgba(15,23,42,0.35),0_2px_6px_-3px_rgba(15,23,42,0.12)]",
        place && (closing ? "team-members-table-menu-out" : "team-members-table-menu-in"),
      )}
      style={
        {
          top: place?.top ?? 0,
          left: place?.left ?? 0,
          minWidth: place?.minWidth,
          visibility: place ? undefined : "hidden",
          transformOrigin: place?.above ? "bottom left" : "top left",
          "--team-members-table-menu-y": place?.above ? "4px" : "-4px",
        } as React.CSSProperties
      }
    >
      {roles.map((role) => {
        const Icon = roleIcon(role);
        const selected = role === value;
        const description = describe(role);
        return (
          <button
            key={role}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            tabIndex={-1}
            onPointerMove={(event) => {
              if (document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
            }}
            onClick={() => onSelect(role)}
            className={cn(
              "flex min-h-8 w-full cursor-pointer items-center gap-2.5 rounded-[8px] border-0 bg-transparent px-2.5 py-[5px] text-left",
              "transition-colors [transition-duration:120ms] hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none motion-reduce:transition-none",
            )}
          >
            {Icon ? (
              <Icon aria-hidden size={15} strokeWidth={1.75} className="shrink-0 text-zinc-500" />
            ) : (
              <span aria-hidden className="size-[15px] shrink-0" />
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] leading-[1.35] font-medium text-zinc-900">{role}</span>
              {description ? <span className="truncate text-[12px] leading-[1.35] text-zinc-500">{description}</span> : null}
            </span>
            <Check
              aria-hidden
              size={15}
              strokeWidth={2}
              className={cn("shrink-0 text-zinc-900", selected ? "opacity-100" : "opacity-0")}
            />
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

type Row = TeamMember & { fresh?: boolean };

// Column visibility: Group and Joined from 900px, Projects from 640px, Last active from 560px.
const COL_WIDE = "hidden min-[900px]:table-cell";
const COL_MID = "hidden min-[640px]:table-cell";
// Below 560px Last active is hidden so the name and role keep room.
const COL_NARROW = "hidden min-[560px]:table-cell";
const TH = "h-10 px-4 align-middle text-[13px] font-normal text-zinc-500";
const PILL =
  "inline-flex h-6 max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 text-[12px] font-medium text-zinc-700";
const OUTLINE_BUTTON = cn(
  "inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800",
  "transition-colors [transition-duration:160ms] hover:border-zinc-300 hover:text-zinc-950 motion-reduce:transition-none",
  FOCUS,
);
const DARK_BUTTON = cn(
  "inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-zinc-950 px-3 text-[13px] font-medium text-white",
  "transition-colors [transition-duration:160ms] hover:bg-zinc-800 motion-reduce:transition-none",
  FOCUS,
);
const MENU_ITEM = cn(
  "flex h-9 w-full cursor-pointer items-center gap-2 rounded-[8px] border-0 bg-transparent px-2.5 text-left text-[13px] font-medium",
  "transition-colors [transition-duration:160ms] focus-visible:outline-none motion-reduce:transition-none",
);
const POPOVER =
  "team-members-table-pop absolute z-30 rounded-xl border border-zinc-200 bg-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.35),0_2px_6px_-3px_rgba(15,23,42,0.12)]";

export const TeamMembersTable = React.forwardRef<HTMLDivElement, TeamMembersTableProps>(
  (
    {
      title = "Members",
      description = "Invite teammates and choose what they can do.",
      groups = DEFAULT_GROUPS,
      members = DEFAULT_MEMBERS,
      roles = DEFAULT_ROLES,
      roleDescriptions = DEFAULT_ROLE_DESCRIPTIONS,
      defaultInviteEmail = "rin@lumen.dev",
      defaultInviteRole,
      onInvite,
      onRoleChange,
      onResendInvite,
      onRemove,
      onFilterClick,
      onNewGroup,
      onExport,
      labels,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = usePrefersReducedMotion();
    const uid = React.useId();
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const [rows, setRows] = React.useState<Row[]>(() => members.map((member) => ({ ...member })));
    const [query, setQuery] = React.useState("");
    const [email, setEmail] = React.useState(defaultInviteEmail);
    const [inviteRole, setInviteRole] = React.useState(defaultInviteRole ?? roles[1] ?? roles[0] ?? "Editor");
    const [touched, setTouched] = React.useState(false);
    const [popover, setPopover] = React.useState<"invite" | "header" | null>(null);
    const [leaving, setLeaving] = React.useState<readonly string[]>([]);
    const [menu, setMenu] = React.useState<{ id: string; top: number; right: number } | null>(null);
    const [announce, setAnnounce] = React.useState("");
    const menuRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const inviteButton = React.useRef<HTMLButtonElement>(null);
    const headerMenuButton = React.useRef<HTMLButtonElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const triggers = React.useRef(new Map<string, HTMLButtonElement>());
    const roleTriggers = React.useRef(new Map<string, HTMLButtonElement>());
    const [roleMenu, setRoleMenu] = React.useState<{ key: string; anchor: HTMLElement; closing: boolean } | null>(null);
    const counter = React.useRef(0);
    const timers = React.useRef<number[]>([]);

    const valid = EMAIL.test(email.trim());
    const showHelper = touched && !valid;
    const needle = query.trim().toLowerCase();
    const matches = (row: Row) =>
      !needle || row.name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle);
    const firstGroup = groups[0]?.id;
    const groupOf = (row: Row) =>
      row.groupId && groups.some((group) => group.id === row.groupId) ? row.groupId : firstGroup;

    React.useEffect(() => {
      const pending = timers.current;
      return () => pending.forEach((id) => window.clearTimeout(id));
    }, []);

    // Row menu: focus first item, close on outside press.
    React.useEffect(() => {
      if (!menu) return;
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
      const onPointerDown = (event: PointerEvent) => {
        const node = event.target as Node;
        if (menuRef.current?.contains(node) || triggers.current.get(menu.id)?.contains(node)) return;
        setMenu(null);
      };
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [menu]);

    // Header popovers: focus inside, close on outside press.
    React.useEffect(() => {
      if (!popover) return;
      popoverRef.current
        ?.querySelector<HTMLElement>(popover === "invite" ? "input" : "[role='menuitem']")
        ?.focus();
      const onPointerDown = (event: PointerEvent) => {
        const node = event.target as Node;
        if (popoverRef.current?.contains(node)) return;
        if (node instanceof Element && node.closest(`[${ROLE_MENU_ATTR}]`)) return;
        if (inviteButton.current?.contains(node) || headerMenuButton.current?.contains(node)) return;
        setPopover(null);
      };
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [popover]);

    const closePopover = () => {
      const opener = popover === "header" ? headerMenuButton.current : inviteButton.current;
      setPopover(null);
      opener?.focus();
    };

    const closeMenu = (restoreFocus: boolean) => {
      if (menu && restoreFocus) triggers.current.get(menu.id)?.focus();
      setMenu(null);
    };

    const toggleMenu = (id: string, button: HTMLButtonElement) => {
      if (menu?.id === id) return setMenu(null);
      const root = localRef.current;
      if (!root) return;
      const frame = root.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      const scale = root.offsetWidth > 0 ? frame.width / root.offsetWidth || 1 : 1;
      setMenu({ id, top: (box.bottom - frame.top) / scale + 4, right: (frame.right - box.right) / scale });
    };

    const invite = (event: React.FormEvent) => {
      event.preventDefault();
      const address = email.trim();
      if (!EMAIL.test(address)) {
        setTouched(true);
        return;
      }
      counter.current += 1;
      setRows((current) => [
        {
          id: `invite-${counter.current}`,
          name: address,
          email: address,
          role: inviteRole,
          groupId: firstGroup,
          pending: true,
          fresh: true,
        },
        ...current,
      ]);
      setEmail("");
      setTouched(false);
      setQuery("");
      setPopover(null);
      setRoleMenu(null);
      setAnnounce(`${text.invited}: ${address}`);
      onInvite?.(address, inviteRole);
    };

    const changeRole = (id: string, role: string) => {
      setRows((current) => current.map((row) => (row.id === id ? { ...row, role } : row)));
      onRoleChange?.(id, role);
    };

    const describeRole = (role: string) => {
      const key = role.trim().toLowerCase();
      const match = Object.keys(roleDescriptions).find((name) => name.trim().toLowerCase() === key);
      return match ? roleDescriptions[match] : undefined;
    };

    const openRoleMenu = (key: string, anchor: HTMLElement) => setRoleMenu({ key, anchor, closing: false });

    const closeRoleMenu = (restoreFocus: boolean) => {
      if (!roleMenu || roleMenu.closing) return;
      const { key } = roleMenu;
      if (restoreFocus) roleTriggers.current.get(key)?.focus();
      if (reduced) return setRoleMenu(null);
      setRoleMenu({ ...roleMenu, closing: true });
      timers.current.push(
        window.setTimeout(() => setRoleMenu((current) => (current?.key === key && current.closing ? null : current)), 100),
      );
    };

    const toggleRoleMenu = (key: string, anchor: HTMLElement) => {
      if (roleMenu?.key === key && !roleMenu.closing) closeRoleMenu(false);
      else openRoleMenu(key, anchor);
    };

    const onRoleTriggerKeyDown = (key: string) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openRoleMenu(key, event.currentTarget);
      }
    };

    const openRolePicker = (id: string) => {
      closeMenu(false);
      const anchor = roleTriggers.current.get(id);
      if (anchor) openRoleMenu(id, anchor);
    };

    const resend = (id: string) => {
      const row = rows.find((entry) => entry.id === id);
      closeMenu(true);
      setAnnounce(`${text.inviteResent}: ${row?.email ?? ""}`);
      onResendInvite?.(id);
    };

    const remove = (id: string) => {
      const row = rows.find((entry) => entry.id === id);
      closeMenu(false);
      setAnnounce(`${text.removed}: ${row?.name ?? ""}`);
      onRemove?.(id);
      const drop = () => {
        setRows((current) => current.filter((entry) => entry.id !== id));
        setLeaving((current) => current.filter((entry) => entry !== id));
      };
      if (reduced) return drop();
      setLeaving((current) => [...current, id]);
      timers.current.push(window.setTimeout(drop, 460));
    };

    const onRootKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (event.key === "Escape" && popover) {
        event.preventDefault();
        closePopover();
      }
    };

    const menuRow = menu ? rows.find((row) => row.id === menu.id) : undefined;
    const groupLabel = (row: Row) => groups.find((group) => group.id === groupOf(row))?.label ?? "—";
    const visibleRows = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => matches(row))
      .sort((a, b) => roleRank(a.row.role) - roleRank(b.row.role) || a.index - b.index)
      .map(({ row }) => row);
    const count = rows.filter((row) => !leaving.includes(row.id)).length;

    const inviteRoleOpen = roleMenu?.key === INVITE_ROLE_KEY && !roleMenu.closing;

    const renderInvitePopover = () => (
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={text.inviteMember}
        className={cn(POPOVER, "top-full left-0 mt-2 w-[320px] max-w-[calc(100vw-32px)] p-3 min-[640px]:right-0 min-[640px]:left-auto")}
      >
        <form onSubmit={invite} noValidate className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            aria-label={text.emailLabel}
            aria-invalid={showHelper || undefined}
            aria-describedby={showHelper ? `${uid}-helper` : undefined}
            placeholder={text.emailPlaceholder}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => {
              if (email.trim()) setTouched(true);
            }}
            className={cn(
              "h-9 w-full min-w-0 rounded-[8px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400",
              "transition-colors [transition-duration:160ms] hover:border-zinc-300 motion-reduce:transition-none",
              FOCUS,
            )}
          />
          {showHelper ? (
            <p id={`${uid}-helper`} className="team-members-table-fade-in m-0 -mt-0.5 text-[12px] text-zinc-500">
              {text.invalidEmail}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              ref={(node) => {
                if (node) roleTriggers.current.set(INVITE_ROLE_KEY, node);
                else roleTriggers.current.delete(INVITE_ROLE_KEY);
              }}
              aria-haspopup="menu"
              aria-expanded={inviteRoleOpen}
              aria-label={`${text.roleLabel}: ${inviteRole}`}
              onClick={(event) => toggleRoleMenu(INVITE_ROLE_KEY, event.currentTarget)}
              onKeyDown={onRoleTriggerKeyDown(INVITE_ROLE_KEY)}
              className={cn(
                "flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[8px] border border-zinc-200 bg-white pr-2.5 pl-3 text-left text-[13px] text-zinc-900",
                "transition-colors [transition-duration:160ms] hover:border-zinc-300 motion-reduce:transition-none",
                SOFT_FOCUS,
                inviteRoleOpen && "border-zinc-300",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{inviteRole}</span>
              <ChevronDown
                aria-hidden
                size={14}
                strokeWidth={1.75}
                className={cn(
                  "shrink-0 text-zinc-400 transition-transform [transition-duration:160ms] motion-reduce:transition-none",
                  inviteRoleOpen && "rotate-180",
                )}
              />
            </button>
            <button type="submit" className={cn(DARK_BUTTON, "h-9")}>
              {text.sendInvite}
            </button>
          </div>
        </form>
      </div>
    );

    const renderRow = (row: Row) => {
      const gone = leaving.includes(row.id);
      const online = !row.pending && row.lastActive === text.activeNow;
      const open = menu?.id === row.id;
      const roleOpen = roleMenu?.key === row.id && !roleMenu.closing;
      const RoleIcon = roleIcon(row.role);
      const projects = row.projects ?? [];
      const accessHint = `${text.access}: ${accessFor(row)}`;
      const lastActiveContent = row.pending ? (
        text.invited
      ) : online ? (
        <>
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
          {row.lastActive}
        </>
      ) : (
        (row.lastActive ?? "—")
      );
      const cell = (content: React.ReactNode, extra?: string) => (
        <div
          className={cn("grid motion-reduce:!transition-none", row.fresh && "team-members-table-grow")}
          style={
            gone
              ? { gridTemplateRows: "0fr", transition: `grid-template-rows 300ms ${EASE} 140ms`, animation: "none" }
              : { gridTemplateRows: "1fr" }
          }
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn("flex h-[52px] items-center px-4 motion-reduce:!transition-none", extra)}
              style={{ opacity: gone ? 0 : 1, transition: `opacity 220ms ${EASE}` }}
            >
              {content}
            </div>
          </div>
        </div>
      );
      return (
        <tr
          key={row.id}
          aria-hidden={gone || undefined}
          className={cn(
            "group border-b border-zinc-100 transition-colors [transition-duration:160ms] last:border-b-0 hover:bg-zinc-50 motion-reduce:transition-none",
            open && "bg-zinc-50",
          )}
        >
          <td className="p-0 align-middle">
            {cell(
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-zinc-600",
                    row.pending ? "border border-dashed border-zinc-300 bg-white" : "bg-zinc-100",
                  )}
                >
                  {initials(row.name)}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13px] leading-[1.25] font-medium text-zinc-900">{row.name}</span>
                  {row.email !== row.name ? (
                    <span className="truncate text-[12px] leading-[1.25] text-zinc-500">{row.email}</span>
                  ) : null}
                </span>
              </span>,
            )}
          </td>
          <td className="p-0 align-middle">
            {cell(
              row.locked ? (
                <span className={PILL} title={accessHint}>
                  {RoleIcon ? <RoleIcon aria-hidden size={12} strokeWidth={1.75} className="shrink-0 text-zinc-500" /> : null}
                  <span className="truncate">{row.role}</span>
                </span>
              ) : (
                <button
                  type="button"
                  ref={(node) => {
                    if (node) roleTriggers.current.set(row.id, node);
                    else roleTriggers.current.delete(row.id);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={roleOpen}
                  aria-label={`${row.name}: ${row.role}. ${accessHint}`}
                  title={accessHint}
                  tabIndex={gone ? -1 : 0}
                  onClick={(event) => toggleRoleMenu(row.id, event.currentTarget)}
                  onKeyDown={onRoleTriggerKeyDown(row.id)}
                  className={cn(
                    PILL,
                    "cursor-pointer pr-1.5 transition-colors [transition-duration:160ms] hover:border-zinc-300 motion-reduce:transition-none",
                    SOFT_FOCUS,
                    roleOpen && "border-zinc-300",
                  )}
                >
                  {RoleIcon ? <RoleIcon aria-hidden size={12} strokeWidth={1.75} className="shrink-0 text-zinc-500" /> : null}
                  <FadeSwap value={row.role} />
                  <ChevronDown
                    aria-hidden
                    size={12}
                    strokeWidth={1.75}
                    className={cn(
                      "shrink-0 text-zinc-400 transition-transform [transition-duration:160ms] motion-reduce:transition-none",
                      roleOpen && "rotate-180",
                    )}
                  />
                </button>
              ),
            )}
          </td>
          <td className={cn("p-0 align-middle", COL_NARROW)}>
            {cell(
              <span className="flex min-w-0 items-center gap-1.5 truncate text-[13px] text-zinc-500 tabular-nums">
                {lastActiveContent}
              </span>,
            )}
          </td>
          <td className={cn("p-0 align-middle", COL_MID)}>
            {cell(
              projects.length > 0 ? (
                <span className="flex items-center">
                  <span className="sr-only">{projects.join(", ")}</span>
                  {projects.slice(0, 3).map((project, index) => (
                    <span
                      key={`${project}-${index}`}
                      title={project}
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[6px] bg-zinc-100 text-[10px] font-semibold text-zinc-600 ring-2 ring-white",
                        index > 0 && "-ml-1",
                      )}
                    >
                      {project.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {projects.length > 3 ? (
                    <span
                      aria-hidden
                      title={projects.slice(3).join(", ")}
                      className="-ml-1 grid h-5 shrink-0 place-items-center rounded-[6px] bg-zinc-100 px-1 text-[10px] font-semibold text-zinc-500 ring-2 ring-white"
                    >
                      +{projects.length - 3}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="text-[13px] text-zinc-400">—</span>
              ),
            )}
          </td>
          <td className={cn("p-0 align-middle", COL_WIDE)}>
            {cell(<span className="truncate text-[13px] text-zinc-500">{groupLabel(row)}</span>)}
          </td>
          <td className={cn("p-0 align-middle", COL_WIDE)}>
            {cell(<span className="truncate text-[13px] text-zinc-500 tabular-nums">{row.joined ?? "—"}</span>)}
          </td>
          <td className="p-0 align-middle">
            {cell(
              row.locked ? null : (
                <button
                  type="button"
                  ref={(node) => {
                    if (node) triggers.current.set(row.id, node);
                    else triggers.current.delete(row.id);
                  }}
                  aria-label={`${text.actions}: ${row.name}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  tabIndex={gone ? -1 : 0}
                  onClick={(event) => toggleMenu(row.id, event.currentTarget)}
                  className={cn(
                    "grid size-7 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-zinc-500",
                    "opacity-0 transition-[opacity,background-color,color] [transition-duration:160ms] hover:bg-zinc-100 hover:text-zinc-900 motion-reduce:transition-none",
                    "group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
                    open && "bg-zinc-100 text-zinc-900 opacity-100",
                    FOCUS,
                  )}
                >
                  <MoreHorizontal aria-hidden size={16} strokeWidth={1.75} />
                </button>
              ),
              "justify-center px-0",
            )}
          </td>
        </tr>
      );
    };

    return (
      <div
        ref={localRef}
        data-tsuna-id="team-members-table"
        onKeyDown={onRootKeyDown}
        className={cn(
          "relative w-[1040px] max-w-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 sm:p-6",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>

        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="m-0 text-[13px] text-zinc-500">{text.breadcrumb}</p>
            <h2 className="m-0 mt-1 truncate text-[32px] leading-[1.1] font-normal tracking-[-0.03em] text-zinc-950">
              {title}
            </h2>
            {description ? <p className="sr-only">{description}</p> : null}
          </div>
          <div className="relative flex shrink-0 items-center gap-2 pb-0.5">
            <button
              type="button"
              ref={inviteButton}
              aria-haspopup="dialog"
              aria-expanded={popover === "invite"}
              onClick={() => setPopover((current) => (current === "invite" ? null : "invite"))}
              className={DARK_BUTTON}
            >
              <UserPlus aria-hidden size={15} strokeWidth={1.75} />
              {text.inviteMember}
            </button>
            <button type="button" onClick={onNewGroup} className={cn(OUTLINE_BUTTON, "hidden min-[640px]:inline-flex")}>
              <FolderPlus aria-hidden size={15} strokeWidth={1.75} className="text-zinc-500" />
              {text.newGroup}
            </button>
            <button type="button" onClick={onExport} className={cn(OUTLINE_BUTTON, "hidden min-[640px]:inline-flex")}>
              <Download aria-hidden size={15} strokeWidth={1.75} className="text-zinc-500" />
              {text.export}
            </button>
            <button
              type="button"
              ref={headerMenuButton}
              aria-label={text.more}
              aria-haspopup="menu"
              aria-expanded={popover === "header"}
              onClick={() => setPopover((current) => (current === "header" ? null : "header"))}
              className={cn(OUTLINE_BUTTON, "w-[34px] justify-center px-0 min-[640px]:hidden")}
            >
              <MoreHorizontal aria-hidden size={16} strokeWidth={1.75} />
            </button>

            {popover === "invite" ? renderInvitePopover() : null}
            {popover === "header" ? (
              <div
                ref={popoverRef}
                role="menu"
                aria-label={text.more}
                className={cn(POPOVER, "top-full right-0 mt-2 min-w-[168px] p-1")}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPopover(null);
                    onNewGroup?.();
                  }}
                  className={cn(MENU_ITEM, "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100")}
                >
                  <FolderPlus aria-hidden size={16} strokeWidth={1.75} className="text-zinc-400" />
                  {text.newGroup}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPopover(null);
                    onExport?.();
                  }}
                  className={cn(MENU_ITEM, "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100")}
                >
                  <Download aria-hidden size={16} strokeWidth={1.75} className="text-zinc-400" />
                  {text.export}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <section aria-label={text.allMembers} className="mt-5 rounded-[14px] bg-zinc-100/70 p-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2 pt-1 pb-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="m-0 truncate text-[14px] font-medium text-zinc-950">{text.allMembers}</h3>
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white px-1.5 text-[12px] font-medium text-zinc-600 tabular-nums">
                <Users aria-hidden size={12} strokeWidth={1.75} className="text-zinc-400" />
                <span className="sr-only">{text.memberCount}: </span>
                {count}
              </span>
            </div>
            <div className="flex w-full items-center gap-2 min-[640px]:w-auto">
              <label className="relative block min-w-0 flex-1 min-[640px]:w-[220px] min-[640px]:flex-none">
                <span className="sr-only">{text.search}</span>
                <Search
                  aria-hidden
                  size={15}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  placeholder={text.search}
                  aria-keyshortcuts="Meta+F Control+F"
                  onChange={(event) => setQuery(event.target.value)}
                  className={cn(
                    "h-7 w-full rounded-[8px] border border-zinc-200 bg-white pr-10 pl-8 text-[12.5px] text-zinc-900 placeholder:text-zinc-400 [&::-webkit-search-cancel-button]:hidden",
                    "transition-colors [transition-duration:160ms] hover:border-zinc-300 motion-reduce:transition-none",
                    FOCUS,
                  )}
                />
                <kbd
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-sans text-[11px] text-zinc-400"
                >
                  {text.searchShortcut}
                </kbd>
              </label>
              <button
                type="button"
                onClick={onFilterClick}
                className={cn(OUTLINE_BUTTON, "h-7 px-2.5 text-[12.5px] text-zinc-700")}
              >
                <SlidersHorizontal aria-hidden size={14} strokeWidth={1.75} className="text-zinc-500" />
                {text.filter}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200">
                  {/* Name has no width: it takes the free space, so the fixed columns group on the right. */}
                  <th scope="col" className={TH}>
                    {text.name}
                  </th>
                  <th scope="col" className={cn(TH, "w-[132px]")}>
                    {text.role}
                  </th>
                  <th scope="col" className={cn(TH, COL_NARROW, "w-[124px]")}>
                    {text.lastActive}
                  </th>
                  <th scope="col" className={cn(TH, COL_MID, "w-[112px]")}>
                    {text.projects}
                  </th>
                  <th scope="col" className={cn(TH, COL_WIDE, "w-[124px]")}>
                    {text.group}
                  </th>
                  <th scope="col" className={cn(TH, COL_WIDE, "w-[120px]")}>
                    {text.joined}
                  </th>
                  <th scope="col" className={cn(TH, "w-[44px] px-0")}>
                    <span className="sr-only">{text.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>{visibleRows.map(renderRow)}</tbody>
            </table>
            {visibleRows.length === 0 ? (
              <p className="team-members-table-fade-in m-0 px-4 py-10 text-center text-[13px] text-zinc-500">{text.noResults}</p>
            ) : null}
          </div>
        </section>

        {menu ? (
          <div
            ref={menuRef}
            role="menu"
            aria-label={text.actions}
            onKeyDown={(event) => {
              if (event.key === "Escape" || event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();
                closeMenu(true);
                return;
              }
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []);
                const at = items.indexOf(document.activeElement as HTMLButtonElement);
                const next = (at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
                items[next]?.focus();
              }
            }}
            className={cn(POPOVER, "min-w-[176px] p-1")}
            style={{ top: menu.top, right: menu.right }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => openRolePicker(menu.id)}
              className={cn(MENU_ITEM, "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100")}
            >
              <UserCog aria-hidden size={16} strokeWidth={1.75} className="text-zinc-400" />
              {text.changeRole}
            </button>
            {menuRow?.pending ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => resend(menu.id)}
                className={cn(MENU_ITEM, "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100")}
              >
                <RefreshCw aria-hidden size={16} strokeWidth={1.75} className="text-zinc-400" />
                {text.resendInvite}
              </button>
            ) : null}
            <span aria-hidden className="mx-1 my-1 block h-px bg-zinc-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => remove(menu.id)}
              className={cn(MENU_ITEM, "text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50")}
            >
              <Trash2 aria-hidden size={16} strokeWidth={1.75} />
              {text.remove}
            </button>
          </div>
        ) : null}

        {roleMenu
          ? (() => {
              const row = roleMenu.key === INVITE_ROLE_KEY ? undefined : rows.find((entry) => entry.id === roleMenu.key);
              if (roleMenu.key !== INVITE_ROLE_KEY && !row) return null;
              const value = row ? row.role : inviteRole;
              return (
                <RoleMenu
                  key={roleMenu.key}
                  anchor={roleMenu.anchor}
                  label={row ? `${text.role}: ${row.name}` : text.roleLabel}
                  value={value}
                  roles={roles.includes(value) ? roles : [value, ...roles]}
                  describe={describeRole}
                  closing={roleMenu.closing}
                  onSelect={(next) => {
                    if (row) changeRole(row.id, next);
                    else setInviteRole(next);
                    closeRoleMenu(true);
                  }}
                  onClose={closeRoleMenu}
                />
              );
            })()
          : null}

        <span aria-live="polite" className="sr-only">
          {announce}
        </span>
      </div>
    );
  },
);

TeamMembersTable.displayName = "TeamMembersTable";
