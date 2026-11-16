"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type PermissionsMatrixRole = {
  id: string;
  name: string;
  /** Always has every permission and cannot be edited, e.g. the owner. */
  locked?: boolean;
};

export type PermissionsMatrixPermission = {
  id: string;
  label: string;
  description?: string;
  /** Sits under the danger-zone label, with the name in the destructive color. */
  danger?: boolean;
};

/** Role id → permission ids it has. */
export type PermissionsMatrixGrants = Record<string, readonly string[]>;

export type PermissionsMatrixLabels = {
  all?: string;
  of?: string;
  danger?: string;
  reset?: string;
  save?: string;
  change?: string;
  changes?: string;
  ownerHint?: string;
};

export type PermissionsMatrixPanelProps = Omit<React.ComponentPropsWithoutRef<"div">, "title" | "onChange"> & {
  title?: string;
  description?: string;
  roles?: readonly PermissionsMatrixRole[];
  permissions?: readonly PermissionsMatrixPermission[];
  defaultGrants?: PermissionsMatrixGrants;
  onGrantsChange?: (grants: PermissionsMatrixGrants) => void;
  labels?: PermissionsMatrixLabels;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_CURVE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 500, damping: 30 } as const;
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2";

const CSS = `
@keyframes permissions-matrix-panel-in-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes permissions-matrix-panel-in-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
@keyframes permissions-matrix-panel-out-up { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-70%); } }
@keyframes permissions-matrix-panel-out-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(70%); } }
.permissions-matrix-panel-in-up { animation: permissions-matrix-panel-in-up 420ms ${EASE} both; }
.permissions-matrix-panel-in-down { animation: permissions-matrix-panel-in-down 420ms ${EASE} both; }
.permissions-matrix-panel-out-up { animation: permissions-matrix-panel-out-up 300ms ${EASE} both; }
.permissions-matrix-panel-out-down { animation: permissions-matrix-panel-out-down 300ms ${EASE} both; }
@media (prefers-reduced-motion: reduce) {
  .permissions-matrix-panel-in-up, .permissions-matrix-panel-in-down { animation: none; }
  .permissions-matrix-panel-out-up, .permissions-matrix-panel-out-down { animation: none; opacity: 0; }
}
`;

const DEFAULT_ROLES: readonly PermissionsMatrixRole[] = [
  { id: "owner", name: "Owner", locked: true },
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor" },
  { id: "viewer", name: "Viewer" },
];

const DEFAULT_PERMISSIONS: readonly PermissionsMatrixPermission[] = [
  { id: "view", label: "View projects", description: "Open projects and comments." },
  { id: "edit", label: "Edit content", description: "Create and change pages." },
  { id: "members", label: "Manage members", description: "Invite, remove, change roles." },
  { id: "billing", label: "Billing", description: "Plans, seats, and invoices." },
  { id: "api", label: "API keys", description: "Create and revoke keys." },
  { id: "delete", label: "Delete workspace", description: "Remove everything for good.", danger: true },
];

const DEFAULT_GRANTS: PermissionsMatrixGrants = {
  admin: ["view", "edit", "members", "api"],
  editor: ["view", "edit", "api"],
  viewer: ["view"],
};

const DEFAULT_LABELS: Required<PermissionsMatrixLabels> = {
  all: "All",
  of: "of",
  danger: "Danger zone",
  reset: "Reset",
  save: "Save",
  change: "change",
  changes: "changes",
  ownerHint: "Owners always have every permission",
};

function cloneGrants(roles: readonly PermissionsMatrixRole[], source: PermissionsMatrixGrants) {
  return Object.fromEntries(roles.map((role) => [role.id, [...(source[role.id] ?? [])]])) as Record<string, string[]>;
}

function changeCount(
  roles: readonly PermissionsMatrixRole[],
  permissions: readonly PermissionsMatrixPermission[],
  current: Record<string, string[]>,
  saved: Record<string, string[]>,
) {
  let count = 0;
  for (const role of roles) {
    if (role.locked) continue;
    const now = new Set(current[role.id] ?? []);
    const base = new Set(saved[role.id] ?? []);
    for (const permission of permissions) {
      if (now.has(permission.id) !== base.has(permission.id)) count += 1;
    }
  }
  return count;
}

/** Old digits slide out and new ones slide in. */
function RollCount({ value }: { value: number }) {
  const [pair, setPair] = React.useState({ prev: value, current: value });
  if (pair.current !== value) setPair({ prev: pair.current, current: value });
  const changed = pair.prev !== pair.current;
  const dir = pair.current < pair.prev ? "down" : "up";
  return (
    <span className="relative inline-grid overflow-hidden tabular-nums">
      {changed ? (
        <span
          key={`out-${pair.prev}-${pair.current}`}
          aria-hidden
          className={cn("absolute inset-0 text-center", `permissions-matrix-panel-out-${dir}`)}
        >
          {pair.prev}
        </span>
      ) : null}
      <span key={pair.current} className={changed ? `permissions-matrix-panel-in-${dir}` : undefined}>
        {pair.current}
      </span>
    </span>
  );
}

function GrantMark({ on, locked, reduced }: { on: boolean; locked?: boolean; reduced: boolean }) {
  const fade = { duration: reduced ? 0 : 0.15 };
  return (
    <span className="relative grid size-6 place-items-center">
      <AnimatePresence initial={false}>
        {on ? (
          <motion.span
            key="on"
            className={cn(
              "absolute grid size-6 place-items-center rounded-full bg-zinc-100",
              locked ? "text-zinc-400" : "text-zinc-950",
            )}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            <motion.span
              className="grid"
              initial={reduced ? false : { scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={reduced ? { duration: 0 } : SPRING}
            >
              <Check aria-hidden className="size-4" />
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            key="off"
            className="size-1 rounded-full bg-zinc-400"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

export const PermissionsMatrixPanel = React.forwardRef<HTMLDivElement, PermissionsMatrixPanelProps>(
  (
    {
      title = "Roles and permissions",
      description = "Choose what each role can do in this workspace.",
      roles = DEFAULT_ROLES,
      permissions = DEFAULT_PERMISSIONS,
      defaultGrants = DEFAULT_GRANTS,
      onGrantsChange,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const text = { ...DEFAULT_LABELS, ...labels };
    const reduced = useReducedMotion() === true;
    const [saved, setSaved] = React.useState(() => cloneGrants(roles, defaultGrants));
    const [grants, setGrants] = React.useState(() => cloneGrants(roles, defaultGrants));
    const [hot, setHot] = React.useState<string | null>(null);
    const regular = permissions.filter((permission) => !permission.danger);
    const danger = permissions.filter((permission) => permission.danger);
    const lastId = (danger.at(-1) ?? regular.at(-1))?.id;
    const changes = changeCount(roles, permissions, grants, saved);

    const granted = (role: PermissionsMatrixRole, permissionId: string) =>
      Boolean(role.locked) || (grants[role.id] ?? []).includes(permissionId);
    const countFor = (role: PermissionsMatrixRole) =>
      role.locked ? permissions.length : permissions.filter((permission) => (grants[role.id] ?? []).includes(permission.id)).length;

    const apply = (next: Record<string, string[]>) => {
      setGrants(next);
      onGrantsChange?.(next);
    };

    const toggle = (roleId: string, permissionId: string) => {
      const list = grants[roleId] ?? [];
      const next = {
        ...grants,
        [roleId]: list.includes(permissionId) ? list.filter((id) => id !== permissionId) : [...list, permissionId],
      };
      apply(next);
    };

    const columnHover = (roleId: string) => ({
      "data-col": roleId,
      onMouseEnter: () => setHot(roleId),
      onMouseLeave: (event: React.MouseEvent) => {
        const next = event.relatedTarget;
        if (next instanceof Element && next.closest(`[data-col="${roleId}"]`)) return;
        setHot((current) => (current === roleId ? null : current));
      },
    });

    const renderRow = (permission: PermissionsMatrixPermission, divided: boolean) => (
      <tr key={permission.id} className={cn("h-14", divided && "border-t border-zinc-100")}>
        <th scope="row" className="h-14 py-0 pr-3 pl-5 text-left align-middle font-normal">
          <span className={cn("block text-[13px] font-medium leading-4", permission.danger ? "text-destructive" : "text-zinc-900")}>
            {permission.label}
          </span>
          {permission.description ? (
            <span className="mt-0.5 block text-[12px] leading-4 text-zinc-500">{permission.description}</span>
          ) : null}
        </th>
        {roles.map((role) => {
          const on = granted(role, permission.id);
          const locked = Boolean(role.locked);
          return (
            <td
              key={role.id}
              {...columnHover(role.id)}
              className={cn(
                "h-14 w-[104px] px-1 text-center align-middle",
                hot === role.id && "bg-zinc-100/80",
                hot === role.id && permission.id === lastId && "rounded-b-xl",
              )}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={locked || undefined}
                aria-label={locked ? `${role.name}: ${permission.label}. ${text.ownerHint}` : `${role.name}: ${permission.label}`}
                title={locked ? text.ownerHint : undefined}
                tabIndex={locked ? -1 : 0}
                onMouseDown={locked ? (event) => event.preventDefault() : undefined}
                onClick={() => {
                  if (!locked) toggle(role.id, permission.id);
                }}
                onFocus={() => setHot(role.id)}
                onBlur={(event) => {
                  const next = event.relatedTarget;
                  if (next instanceof Element && next.closest(`[data-col="${role.id}"]`)) return;
                  setHot((current) => (current === role.id ? null : current));
                }}
                className={cn(
                  "mx-auto grid size-10 place-items-center rounded-lg border-0 bg-transparent p-0",
                  locked ? "cursor-default" : "cursor-pointer hover:bg-zinc-100/80",
                  locked ? "focus-visible:ring-0" : FOCUS,
                )}
              >
                <GrantMark on={on} locked={locked} reduced={reduced} />
              </button>
            </td>
          );
        })}
      </tr>
    );

    return (
      <div
        ref={ref}
        data-tsuna-id="permissions-matrix-panel"
        className={cn(
          "w-[680px] max-w-full overflow-clip rounded-2xl border border-zinc-200 bg-white text-zinc-900",
          "shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28),0_4px_12px_-8px_rgba(15,23,42,0.14)]",
          className,
        )}
        {...props}
      >
        <style>{CSS}</style>
        <div className="px-5 pt-5 pb-3">
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
          {description ? <p className="m-0 mt-1 text-[13px] text-zinc-500">{description}</p> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className="pb-3 pl-5" />
                {roles.map((role) => (
                  <th
                    key={role.id}
                    scope="col"
                    {...columnHover(role.id)}
                    className={cn(
                      "w-[104px] rounded-t-xl px-1 pt-1 pb-3 text-center align-bottom font-normal",
                      hot === role.id && "bg-zinc-100/80",
                    )}
                  >
                    <span className="block text-[13px] font-semibold leading-4 text-zinc-900">{role.name}</span>
                    <span className="mt-1 flex items-center justify-center text-[12px] leading-4 text-zinc-500">
                      {role.locked ? (
                        <>
                          <Lock aria-hidden className="size-3 shrink-0" />
                          <span className="ml-1">{text.all}</span>
                        </>
                      ) : (
                        <>
                          <RollCount value={countFor(role)} />
                          <span className="ml-1">
                            {text.of} {permissions.length}
                          </span>
                        </>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regular.map((permission) => renderRow(permission, true))}
              {danger.length > 0 ? (
                <tr>
                  <td className="px-5 pt-4 pb-1 text-left align-bottom">
                    <span className="text-[12px] font-medium leading-4 text-zinc-500">{text.danger}</span>
                  </td>
                  {roles.map((role) => (
                    <td
                      key={role.id}
                      {...columnHover(role.id)}
                      className={cn("pt-4 pb-1", hot === role.id && "bg-zinc-100/80")}
                    />
                  ))}
                </tr>
              ) : null}
              {danger.map((permission, index) => renderRow(permission, index > 0))}
            </tbody>
          </table>
        </div>

        <AnimatePresence initial={false}>
          {changes > 0 ? (
            <motion.div
              key="changes"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: EASE_CURVE }}
              className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3"
            >
              <p aria-live="polite" className="m-0 text-[13px] text-zinc-500 tabular-nums">
                {changes} {changes === 1 ? text.change : text.changes}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => apply(cloneGrants(roles, saved))}
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center rounded-lg border-0 bg-transparent px-3 text-[13px] font-medium text-zinc-900",
                    "hover:bg-zinc-100",
                    FOCUS,
                  )}
                >
                  {text.reset}
                </button>
                <button
                  type="button"
                  onClick={() => setSaved(cloneGrants(roles, grants))}
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center rounded-lg border-0 bg-zinc-950 px-3 text-[13px] font-medium text-white",
                    "hover:bg-zinc-900",
                    FOCUS,
                  )}
                >
                  {text.save}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  },
);

PermissionsMatrixPanel.displayName = "PermissionsMatrixPanel";
