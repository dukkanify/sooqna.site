/**
 * RBAC action enforcement — standalone (no path aliases).
 */
import assert from "node:assert/strict";
import test from "node:test";

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
