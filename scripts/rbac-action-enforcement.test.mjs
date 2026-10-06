/**
 * RBAC action enforcement — standalone (no path aliases).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

function hasAdminPermission(user, permission) {
  if (!user || user.role !== "admin") return false;
  const perms = user.adminPermissions;
  if (!perms || perms.length === 0) return true;
  return perms.includes(permission);
}

function hasAdminAction(user, permission, action = "view") {
  if (!hasAdminPermission(user, permission)) return false;
  const perms = user.adminPermissions;
  if (!perms || perms.length === 0) return true;
  const actions = user.adminActionMatrix?.[permission];
  if (!actions || actions.length === 0) return true;
  return actions.includes(action);
}

const PERMISSION_MAP = {
  "disputes.view": { module: "disputes", action: "view" },
  "disputes.manage": { module: "disputes", action: "edit" },
  "listings.approve": { module: "listings", action: "approve" },
  "escrow.manage": { module: "payments", action: "edit" },
  "users.view": { module: "users", action: "view" },
};

function hasPermission(user, key) {
  const spec = PERMISSION_MAP[key];
  if (!spec) return false;
  return hasAdminAction(user, spec.module, spec.action);
}

test("view-only disputes admin fails edit action", () => {
  const user = {
    role: "admin",
    adminPermissions: ["disputes"],
    adminActionMatrix: { disputes: ["view"] },
  };
  assert.equal(hasAdminPermission(user, "disputes"), true);
  assert.equal(hasAdminAction(user, "disputes", "view"), true);
  assert.equal(hasAdminAction(user, "disputes", "edit"), false);
  assert.equal(hasPermission(user, "disputes.view"), true);
  assert.equal(hasPermission(user, "disputes.manage"), false);
});

test("finance admin cannot mutate listings", () => {
  const user = {
    role: "admin",
    adminPermissions: ["orders", "payments", "reports"],
    adminActionMatrix: {
      orders: ["view", "edit"],
      payments: ["view", "edit"],
      reports: ["view", "export"],
    },
  };
  assert.equal(hasAdminAction(user, "payments", "edit"), true);
  assert.equal(hasAdminPermission(user, "listings"), false);
  assert.equal(hasPermission(user, "listings.approve"), false);
});

test("read-only admin cannot release escrow (payments.edit)", () => {
  const user = {
    role: "admin",
    adminPermissions: ["payments", "orders", "disputes"],
    adminActionMatrix: {
      payments: ["view"],
      orders: ["view"],
      disputes: ["view"],
    },
  };
  assert.equal(hasAdminAction(user, "payments", "edit"), false);
  assert.equal(hasPermission(user, "escrow.manage"), false);
});

test("normal user has zero admin permissions", () => {
  const user = { role: "user" };
  assert.equal(hasAdminPermission(user, "users"), false);
  assert.equal(hasPermission(user, "users.view"), false);
});

const ALL_MODULES = [
  "users",
  "listings",
  "orders",
  "disputes",
  "payments",
  "reports",
  "settings",
  "categories",
];

function isSuperAdminUser(user) {
  return Boolean(
    user &&
      user.role === "admin" &&
      (!user.adminPermissions || user.adminPermissions.length === 0),
  );
}

function visibleAdminPermissions(user) {
  if (!user || user.role !== "admin") return [];
  if (isSuperAdminUser(user)) return [...ALL_MODULES];
  return ALL_MODULES.filter((item) => (user.adminPermissions ?? []).includes(item));
}

function sanitizeAdminPermissions(input) {
  if (!Array.isArray(input)) return [];
  const next = [];
  for (const item of input) {
    if (typeof item === "string" && ALL_MODULES.includes(item) && !next.includes(item)) {
      next.push(item);
    }
  }
  return next;
}

test("super admin visible matrix lists every module including disputes/reports/settings/categories", () => {
  const superAdmin = { role: "admin", adminPermissions: [] };
  const visible = visibleAdminPermissions(superAdmin);
  assert.equal(isSuperAdminUser(superAdmin), true);
  assert.deepEqual(visible, ALL_MODULES);
  for (const module of ["disputes", "reports", "settings", "categories"]) {
    assert.equal(visible.includes(module), true);
  }
});

test("sub-admin visible matrix only includes granted modules", () => {
  const sub = {
    role: "admin",
    adminPermissions: ["listings", "orders"],
  };
  const visible = visibleAdminPermissions(sub);
  assert.equal(isSuperAdminUser(sub), false);
  assert.equal(visible.includes("listings"), true);
  assert.equal(visible.includes("disputes"), false);
  assert.equal(visible.includes("reports"), false);
  assert.equal(visible.includes("settings"), false);
  assert.equal(visible.includes("categories"), false);
});

test("sanitize drops unknown keys and keeps disputes/reports/settings/categories", () => {
  assert.deepEqual(
    sanitizeAdminPermissions([
      "disputes",
      "reports",
      "settings",
      "categories",
      "not-a-module",
      "disputes",
    ]),
    ["disputes", "reports", "settings", "categories"],
  );
  assert.deepEqual(sanitizeAdminPermissions([]), []);
});

test("empty module list must not be treated as a limited-admin save payload", () => {
  const sanitized = sanitizeAdminPermissions([]);
  assert.equal(sanitized.length === 0, true);
  assert.equal(isSuperAdminUser({ role: "admin", adminPermissions: sanitized }), true);
});

test("users desk source shows live modules and rejects empty sub-admin saves", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const panel = readFileSync(
    path.join(root, "features/admin/components/AdminUsersPanel.tsx"),
    "utf8",
  );
  const route = readFileSync(
    path.join(root, "app/api/admin/users/[id]/route.ts"),
    "utf8",
  );
  const checks = readFileSync(
    path.join(root, "services/auth/admin-permission-checks.ts"),
    "utf8",
  );
  assert.match(panel, /permissionSummary/);
  assert.match(panel, /كل الصلاحيات/);
  assert.match(panel, /ADMIN_PERMISSION_HINTS/);
  assert.match(panel, /ALL_ADMIN_PERMISSIONS/);
  assert.match(panel, /permissionTemplate/);
  assert.match(route, /EMPTY_PERMISSIONS/);
  assert.match(route, /adminAccess/);
  assert.match(route, /permissionTemplate/);
  assert.match(route, /assignmentFromTemplate/);
  for (const module of ["disputes", "reports", "settings", "categories"]) {
    assert.match(checks, new RegExp(`"${module}"`));
  }
});
