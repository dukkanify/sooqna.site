import assert from "node:assert/strict";
import test from "node:test";

/**
 * Standalone RBAC / media / delivery transition checks without Next path aliases.
 */

const ROLE_TEMPLATES = {
  finance_admin: [
    "orders.view",
    "orders.manage",
    "payments.view",
    "payments.manage",
    "escrow.view",
    "escrow.manage",
    "reports.view",
    "reports.export",
  ],
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
  ],
};

const PERMISSION_MAP = {
  "users.view": { module: "users", action: "view" },
  "users.edit": { module: "users", action: "edit" },
  "listings.approve": { module: "listings", action: "approve" },
  "payments.view": { module: "payments", action: "view" },
  "payments.manage": { module: "payments", action: "edit" },
  "escrow.manage": { module: "payments", action: "edit" },
  "disputes.view": { module: "disputes", action: "view" },
  "disputes.manage": { module: "disputes", action: "edit" },
  "settings.edit": { module: "settings", action: "edit" },
};

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

function hasPermission(user, key) {
  const spec = PERMISSION_MAP[key];
  if (!spec) return false;
  return hasAdminAction(user, spec.module, spec.action);
}

function modulesFromKeys(keys) {
  return Array.from(new Set(keys.map((k) => PERMISSION_MAP[k]?.module).filter(Boolean)));
}

function resolveMediaClass(folder) {
  const root = (folder ?? "general").split("/")[0];
  if (root === "listings" || root === "listing") return "listing";
  if (root === "evidence") return "evidence";
  if (root === "disputes" || root === "dispute") return "dispute";
  return "general";
}

function defaultVisibilityFor(mediaClass) {
  return mediaClass === "listing" || mediaClass === "general"
    ? "public"
    : "private";
}

function isValidOrderTransition(current, next) {
  const allowed = {
    pending_payment: ["paid_held_in_escrow", "refunded", "cancelled"],
    paid_held_in_escrow: [
      "seller_preparing",
      "shipped",
      "ready_for_pickup",
      "delivered",
      "disputed",
      "refunded",
      "confirmed",
    ],
    seller_preparing: [
      "shipped",
      "ready_for_pickup",
      "delivered",
      "disputed",
      "refunded",
    ],
    shipped: ["delivered", "disputed", "refunded"],
    ready_for_pickup: ["delivered", "disputed", "refunded"],
    delivered: ["confirmed", "disputed", "refunded"],
    confirmed: ["released", "disputed", "refunded"],
    released: [],
    disputed: ["released", "refunded"],
    refunded: [],
    cancelled: [],
  };
  return allowed[current]?.includes(next) ?? false;
}

test("permission matrix: super admin empty modules ⇒ full access", () => {
  const superAdmin = { role: "admin", adminPermissions: [] };
  assert.equal(hasPermission(superAdmin, "users.view"), true);
  assert.equal(hasPermission(superAdmin, "payments.manage"), true);
  assert.equal(hasPermission(superAdmin, "disputes.manage"), true);
});

test("permission matrix: finance admin cannot moderate listings", () => {
  const modules = modulesFromKeys(ROLE_TEMPLATES.finance_admin);
  const finance = {
    role: "admin",
    adminPermissions: modules,
    adminActionMatrix: {
      orders: ["view", "edit"],
      payments: ["view", "edit"],
      reports: ["view", "export"],
    },
  };
  assert.equal(hasPermission(finance, "payments.view"), true);
  assert.equal(hasPermission(finance, "escrow.manage"), true);
  assert.equal(hasPermission(finance, "listings.approve"), false);
  assert.equal(hasPermission(finance, "users.edit"), false);
});

test("permission matrix: read-only cannot manage disputes", () => {
  const modules = modulesFromKeys(ROLE_TEMPLATES.read_only_admin);
  const readonly = {
    role: "admin",
    adminPermissions: modules,
    adminActionMatrix: Object.fromEntries(modules.map((m) => [m, ["view"]])),
  };
  assert.equal(hasPermission(readonly, "disputes.view"), true);
  assert.equal(hasPermission(readonly, "disputes.manage"), false);
  assert.equal(hasPermission(readonly, "settings.edit"), false);
});

test("permission matrix: normal user has no admin permissions", () => {
  const user = { role: "user" };
  assert.equal(hasPermission(user, "users.view"), false);
  assert.equal(hasPermission(user, "orders.manage"), false);
});

test("media class visibility: listing public, evidence/dispute private", () => {
  assert.equal(resolveMediaClass("listings/x"), "listing");
  assert.equal(resolveMediaClass("evidence/x"), "evidence");
  assert.equal(resolveMediaClass("disputes/x"), "dispute");
  assert.equal(defaultVisibilityFor("listing"), "public");
  assert.equal(defaultVisibilityFor("evidence"), "private");
  assert.equal(defaultVisibilityFor("dispute"), "private");
});

test("delivery lifecycle transitions: shipping vs pickup paths", () => {
  assert.equal(
    isValidOrderTransition("paid_held_in_escrow", "seller_preparing"),
    true,
  );
  assert.equal(isValidOrderTransition("seller_preparing", "shipped"), true);
  assert.equal(
    isValidOrderTransition("seller_preparing", "ready_for_pickup"),
    true,
  );
  assert.equal(isValidOrderTransition("shipped", "delivered"), true);
  assert.equal(isValidOrderTransition("ready_for_pickup", "delivered"), true);
  assert.equal(isValidOrderTransition("delivered", "confirmed"), true);
  assert.equal(isValidOrderTransition("confirmed", "released"), true);
  assert.equal(isValidOrderTransition("shipped", "confirmed"), false);
});
