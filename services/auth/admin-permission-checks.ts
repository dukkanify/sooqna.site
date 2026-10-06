import type {
  AdminAction,
  AdminActionMatrix,
  AdminPermission,
  UserProfile,
} from "@/types/domain/user";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "users",
  "listings",
  "orders",
  "disputes",
  "payments",
  "reports",
  "settings",
  "categories",
];

export const ALL_ADMIN_ACTIONS: AdminAction[] = [
  "view",
  "add",
  "edit",
  "delete",
  "approve",
  "export",
];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  users: "المستخدمون",
  listings: "الإعلانات",
  orders: "الطلبات",
  disputes: "النزاعات",
  payments: "المدفوعات",
  reports: "التقارير",
  settings: "الإعدادات",
  categories: "التصنيفات والمواقع",
};

export const ADMIN_ACTION_LABELS: Record<AdminAction, string> = {
  view: "عرض",
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
  approve: "اعتماد",
  export: "تصدير",
};

/** What each module actually unlocks — shown on the users desk. */
export const ADMIN_PERMISSION_HINTS: Record<AdminPermission, string> = {
  users: "اعتماد الحسابات ومنح أو سحب الصلاحيات. إنشاء حساب الدخول منفصل عن منح الصلاحية.",
  listings: "مراجعة الإعلانات واعتمادها أو رفضها وبلاغاتها.",
  orders: "عرض الطلبات والمعاملات وحالة الدفع.",
  disputes: "فتح النزاعات وحلّها ومتابعة الأدلة.",
  payments: "تفاصيل الدفع والضمان والاسترداد والإجراءات المالية السابقة.",
  reports: "التقارير المالية والتحليلات وسجل الإجراءات.",
  settings: "إعدادات المنصة والرسوم والصيانة.",
  categories: "التصنيفات والنماذج والمواقع.",
};

const PERMISSION_SET = new Set<string>(ALL_ADMIN_PERMISSIONS);

export function isSuperAdminUser(
  user: Pick<UserProfile, "role" | "adminPermissions"> | null | undefined,
): boolean {
  return Boolean(
    user &&
      user.role === "admin" &&
      (!user.adminPermissions || user.adminPermissions.length === 0),
  );
}

/** Modules to show as granted. Super admin = all eight, never an empty matrix. */
export function visibleAdminPermissions(
  user: Pick<UserProfile, "role" | "adminPermissions"> | null | undefined,
): AdminPermission[] {
  if (!user || user.role !== "admin") return [];
  if (isSuperAdminUser(user)) return [...ALL_ADMIN_PERMISSIONS];
  return ALL_ADMIN_PERMISSIONS.filter((item) =>
    (user.adminPermissions ?? []).includes(item),
  );
}

export function sanitizeAdminPermissions(input: unknown): AdminPermission[] {
  if (!Array.isArray(input)) return [];
  const next: AdminPermission[] = [];
  for (const item of input) {
    if (typeof item !== "string" || !PERMISSION_SET.has(item)) continue;
    if (!next.includes(item as AdminPermission)) {
      next.push(item as AdminPermission);
    }
  }
  return next;
}

export function sanitizeAdminActionMatrix(
  input: unknown,
  modules: AdminPermission[],
): AdminActionMatrix {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const matrix: AdminActionMatrix = {};
  for (const permission of modules) {
    const raw = source[permission];
    if (!Array.isArray(raw) || raw.length === 0) {
      matrix[permission] = [...ALL_ADMIN_ACTIONS];
      continue;
    }
    const actions = ALL_ADMIN_ACTIONS.filter((action) => raw.includes(action));
    matrix[permission] = actions.length > 0 ? actions : [...ALL_ADMIN_ACTIONS];
  }
  return matrix;
}

/** Empty/undefined adminPermissions = full access for admins. */
export function hasAdminPermission(
  user: Pick<UserProfile, "role" | "adminPermissions"> | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!user || user.role !== "admin") return false;
  const perms = user.adminPermissions;
  if (!perms || perms.length === 0) return true;
  return perms.includes(permission);
}

/**
 * Module + action matrix check.
 * Super admin (empty modules) → all actions.
 * Module granted without matrix entry → all actions for that module (compat).
 */
export function hasAdminAction(
  user:
    | Pick<UserProfile, "role" | "adminPermissions" | "adminActionMatrix">
    | null
    | undefined,
  permission: AdminPermission,
  action: AdminAction = "view",
): boolean {
  if (!hasAdminPermission(user, permission)) return false;
  if (!user) return false;
  const perms = user.adminPermissions;
  if (!perms || perms.length === 0) return true;
  const matrix: AdminActionMatrix | undefined = user.adminActionMatrix;
  const actions = matrix?.[permission];
  if (!actions || actions.length === 0) return true;
  return actions.includes(action);
}
