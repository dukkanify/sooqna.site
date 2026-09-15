/**
 * Dotted permission keys for the Sooqna admin RBAC matrix.
 * Maps onto existing module + action checks without breaking stored user data.
 */
import {
  hasAdminAction,
  hasAdminPermission,
} from "@/services/auth/admin-permission-checks";
import type {
  AdminAction,
  AdminPermission,
  UserProfile,
} from "@/types/domain/user";

export type PermissionKey =
  | "users.view"
  | "users.edit"
  | "listings.view"
  | "listings.edit"
  | "listings.approve"
  | "listings.reject"
  | "categories.view"
  | "categories.edit"
  | "orders.view"
  | "orders.manage"
  | "payments.view"
  | "payments.manage"
  | "escrow.view"
  | "escrow.manage"
  | "disputes.view"
  | "disputes.manage"
  | "reports.view"
  | "reports.export"
  | "settings.view"
  | "settings.edit"
  | "admin.audit.view";

type PermissionSpec = {
  module: AdminPermission;
  action: AdminAction;
};

const PERMISSION_MAP: Record<PermissionKey, PermissionSpec> = {
  "users.view": { module: "users", action: "view" },
  "users.edit": { module: "users", action: "edit" },
  "listings.view": { module: "listings", action: "view" },
  "listings.edit": { module: "listings", action: "edit" },
  "listings.approve": { module: "listings", action: "approve" },
  "listings.reject": { module: "listings", action: "delete" },
  "categories.view": { module: "categories", action: "view" },
  "categories.edit": { module: "categories", action: "edit" },
  "orders.view": { module: "orders", action: "view" },
  "orders.manage": { module: "orders", action: "edit" },
  "payments.view": { module: "payments", action: "view" },
  "payments.manage": { module: "payments", action: "edit" },
  "escrow.view": { module: "payments", action: "view" },
  "escrow.manage": { module: "payments", action: "edit" },
  "disputes.view": { module: "disputes", action: "view" },
  "disputes.manage": { module: "disputes", action: "edit" },
  "reports.view": { module: "reports", action: "view" },
  "reports.export": { module: "reports", action: "export" },
  "settings.view": { module: "settings", action: "view" },
  "settings.edit": { module: "settings", action: "edit" },
  "admin.audit.view": { module: "reports", action: "view" },
};

/** Representative role templates for admin assignment + tests. */
export const ROLE_PERMISSION_TEMPLATES = {
  super_admin: [] as PermissionKey[], // empty modules = full access
  content_moderator: [
    "listings.view",
    "listings.edit",
    "listings.approve",
    "listings.reject",
    "categories.view",
    "categories.edit",
    "reports.view",
  ] as PermissionKey[],
  finance_admin: [
    "orders.view",
    "orders.manage",
    "payments.view",
    "payments.manage",
    "escrow.view",
    "escrow.manage",
    "reports.view",
    "reports.export",
  ] as PermissionKey[],
  support_dispute_admin: [
    "users.view",
    "orders.view",
    "disputes.view",
    "disputes.manage",
    "escrow.view",
    "reports.view",
  ] as PermissionKey[],
  read_only_admin: [
    "users.view",
    "listings.view",
    "categories.view",
    "orders.view",
    "payments.view",
    "escrow.view",
    "disputes.view",
    "reports.view",
    "settings.view",
    "admin.audit.view",
  ] as PermissionKey[],
} as const;

export function hasPermission(
  user: Pick<UserProfile, "role" | "adminPermissions" | "adminActionMatrix"> | null | undefined,
  key: PermissionKey,
): boolean {
  const spec = PERMISSION_MAP[key];
  if (!spec) return false;
  return hasAdminAction(user, spec.module, spec.action);
}

export function hasAnyPermission(
  user: Pick<UserProfile, "role" | "adminPermissions" | "adminActionMatrix"> | null | undefined,
  keys: PermissionKey[],
): boolean {
  return keys.some((key) => hasPermission(user, key));
}

export function modulesFromPermissionKeys(
  keys: PermissionKey[],
): AdminPermission[] {
  return Array.from(new Set(keys.map((key) => PERMISSION_MAP[key].module)));
}

/** Convenience re-exports for callers that still use module checks. */
export { hasAdminPermission, hasAdminAction };
