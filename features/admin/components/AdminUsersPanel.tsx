"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  AdminAction,
  AdminActionMatrix,
  AdminPermission,
  AdminUserPatch,
  AdminUserRecord,
} from "@/types";
import {
  ALL_ADMIN_ACTIONS,
  ALL_ADMIN_PERMISSIONS,
  ADMIN_ACTION_LABELS,
  ADMIN_PERMISSION_LABELS,
} from "@/services/auth/admin-permission-checks";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";

const roleLabels: Record<AdminUserRecord["role"], string> = {
  user: "مستخدم",
  business: "أعمال",
  admin: "مدير",
};

function isSuperAdminRecord(user: Pick<AdminUserRecord, "role" | "adminPermissions">) {
  return (
    user.role === "admin" &&
    (!user.adminPermissions || user.adminPermissions.length === 0)
  );
}

/** One clear status for the row — avoids badge clutter. */
function rowStatus(user: AdminUserRecord): {
  label: string;
  variant: "verified" | "pending" | "rejected" | "muted";
} {
  if (user.accountStatus === "suspended") {
    return { label: "موقوف", variant: "rejected" };
  }
  if (!user.emailVerifiedAt) {
    return { label: "يحتاج تحقق", variant: "pending" };
  }
  if (user.accountStatus === "pending") {
    return { label: "بانتظار الاعتماد", variant: "pending" };
  }
  if (user.role === "admin") {
    return {
      label: isSuperAdminRecord(user) ? "مدير أعلى" : "مدير فرعي",
      variant: "verified",
    };
  }
  if (!user.isVerified) {
    return { label: "نشط — غير موثّق", variant: "muted" };
  }
  return { label: "نشط", variant: "verified" };
}

function primaryAction(user: AdminUserRecord): {
  label: string;
  patch: AdminUserPatch;
} | null {
  if (!user.emailVerifiedAt) {
    return { label: "تحقق يدوياً", patch: { recoveryAction: "force_verify" } };
  }
  if (user.accountStatus === "pending") {
    return { label: "اعتماد", patch: { accountStatus: "active" } };
  }
  if (user.accountStatus === "active" && !user.isVerified) {
    return { label: "توثيق", patch: { isVerified: true } };
  }
  if (user.accountStatus === "suspended") {
    return { label: "إعادة تفعيل", patch: { accountStatus: "active" } };
  }
  return null;
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<
    Record<string, AdminPermission[]>
  >({});
  const [draftMatrices, setDraftMatrices] = useState<
    Record<string, AdminActionMatrix>
  >({});
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);
  const session = getSessionUser();
  const sessionIsSuper = Boolean(
    session &&
      isSuperAdminRecord({
        role: session.role ?? "user",
        adminPermissions: session.adminPermissions,
      }),
  );

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers((data.users ?? []) as AdminUserRecord[]);
      })
      .catch(() => setUsers([]));
  }, []);

  const pendingCount = useMemo(
    () => users.filter((user) => user.accountStatus === "pending").length,
    [users],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((user) =>
        statusFilter === "pending" ? user.accountStatus === "pending" : true,
      )
      .filter((user) => {
        if (!q) return true;
        return (
          user.fullName.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.phone.includes(q) ||
          user.city.includes(q)
        );
      })
      .sort((a, b) => {
        const aTime = Date.parse(a.joinedAt);
        const bTime = Date.parse(b.joinedAt);
        if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
          return bTime - aTime;
        }
        return 0;
      });
  }, [users, query, statusFilter]);

  async function patchUser(id: string, patch: AdminUserPatch) {
    setBusyId(id);
    setMessage(null);
    try {
      const response = await adminFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({
          variant: "error",
          text:
            data.error === "CANNOT_MODIFY_SUPER_ADMIN"
              ? "لا يمكن لمدير فرعي تعديل مدير أعلى."
              : data.error === "SELF_ESCALATION"
                ? "لا يمكنك توسيع صلاحياتك بنفسك."
                : data.error === "PERSON_NOT_VERIFIED"
                  ? "تحقق من الشخص أولاً قبل اعتماد الحساب."
                  : data.error === "ALREADY_VERIFIED"
                    ? "الحساب متحقّق مسبقاً."
                    : data.error === "NO_PASSWORD"
                      ? "هذا الحساب يدخل برمز OTP وليس بكلمة مرور."
                      : (data.message ?? "تعذر حفظ التغيير."),
        });
        return;
      }
      if (data.user) {
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? data.user : user)),
        );
        setDraftPermissions((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setDraftMatrices((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      if (patch.recoveryAction === "force_verify") {
        setMessage({
          variant: "success",
          text: data.recovery?.approved
            ? "تم التحقق اليدوي واعتماد الحساب."
            : "تم التحقق اليدوي من البريد.",
        });
      } else if (patch.recoveryAction === "resend_verification") {
        setMessage({
          variant: "success",
          text: data.recovery?.delivered
            ? "أُعيد إرسال رمز التحقق."
            : "تم إنشاء الرمز لكن التسليم قد يتأخر.",
        });
      } else if (patch.recoveryAction === "send_password_reset") {
        setMessage({
          variant: "success",
          text: "أُرسل رابط إعادة كلمة المرور إلى البريد.",
        });
      } else if (patch.adminPermissions || patch.adminActionMatrix) {
        setMessage({
          variant: "success",
          text: "تم حفظ صلاحيات المدير بنجاح.",
        });
      } else if (patch.accountStatus === "active") {
        setMessage({ variant: "success", text: "تم اعتماد الحساب." });
      } else if (patch.isVerified) {
        setMessage({ variant: "success", text: "تم توثيق الحساب." });
      }
    } finally {
      setBusyId(null);
    }
  }

  function draftFor(user: AdminUserRecord): AdminPermission[] {
    return draftPermissions[user.id] ?? user.adminPermissions ?? [];
  }

  function draftMatrixFor(user: AdminUserRecord): AdminActionMatrix {
    return draftMatrices[user.id] ?? user.adminActionMatrix ?? {};
  }

  function toggleDraftPermission(user: AdminUserRecord, permission: AdminPermission) {
    const current = draftFor(user);
    const has = current.includes(permission);
    const next = has
      ? current.filter((item) => item !== permission)
      : [...current, permission];
    setDraftPermissions((prev) => ({ ...prev, [user.id]: next }));
    if (has) {
      setDraftMatrices((prev) => {
        const matrix = { ...(prev[user.id] ?? user.adminActionMatrix ?? {}) };
        delete matrix[permission];
        return { ...prev, [user.id]: matrix };
      });
    } else {
      setDraftMatrices((prev) => ({
        ...prev,
        [user.id]: {
          ...(prev[user.id] ?? user.adminActionMatrix ?? {}),
          [permission]: [...ALL_ADMIN_ACTIONS],
        },
      }));
    }
  }

  function toggleDraftAction(
    user: AdminUserRecord,
    permission: AdminPermission,
    action: AdminAction,
  ) {
    const matrix = { ...draftMatrixFor(user) };
    const current = matrix[permission] ?? [...ALL_ADMIN_ACTIONS];
    const has = current.includes(action);
    const next = has
      ? current.filter((item) => item !== action)
      : [...current, action];
    matrix[permission] = next;
    setDraftMatrices((prev) => ({ ...prev, [user.id]: matrix }));
  }

  function hasUnsavedPermissions(user: AdminUserRecord): boolean {
    const draft = draftPermissions[user.id];
    const draftMatrix = draftMatrices[user.id];
    if (!draft && !draftMatrix) return false;
    if (draft) {
      const saved = user.adminPermissions ?? [];
      if (
        draft.length !== saved.length ||
        draft.some((item) => !saved.includes(item))
      ) {
        return true;
      }
    }
    if (draftMatrix) {
      return (
        JSON.stringify(draftMatrix) !==
        JSON.stringify(user.adminActionMatrix ?? {})
      );
    }
    return false;
  }

  return (
    <div className="grid gap-3">
      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            label="بحث"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="اسم أو بريد..."
            value={query}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <Button
            onClick={() => setStatusFilter("all")}
            size="sm"
            type="button"
            variant={statusFilter === "all" ? "primary" : "ghost"}
          >
            الكل ({users.length})
          </Button>
          <Button
            onClick={() => setStatusFilter("pending")}
            size="sm"
            type="button"
            variant={statusFilter === "pending" ? "primary" : "ghost"}
          >
            بانتظار ({pendingCount})
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-users__empty">لا يوجد مستخدمون مطابقون.</p>
      ) : (
        <ul className="admin-users__list">
          {filtered.map((user) => {
            const status = rowStatus(user);
            const action = primaryAction(user);
            const open = openId === user.id;
            return (
              <li key={user.id} className="admin-users__row">
                <div className="admin-users__row-main">
                  <div className="admin-users__identity">
                    <p className="admin-users__name">
                      {user.fullName}
                      {user.role !== "user" ? (
                        <span className="admin-users__role">
                          · {roleLabels[user.role]}
                        </span>
                      ) : null}
                    </p>
                    <p className="admin-users__email" dir="ltr">
                      {user.email}
                    </p>
                  </div>
                  <div className="admin-users__actions">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {action ? (
                      <Button
                        loading={busyId === user.id}
                        onClick={() => patchUser(user.id, action.patch)}
                        size="sm"
                        type="button"
                        variant="primary"
                      >
                        {action.label}
                      </Button>
                    ) : null}
                    <Button
                      aria-expanded={open}
                      onClick={() =>
                        setOpenId((prev) => (prev === user.id ? null : user.id))
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {open ? "إخفاء" : "المزيد"}
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="admin-users__more">
                    <p className="admin-users__meta">
                      {[
                        user.phone,
                        user.city,
                        `انضم ${user.joinedAt}`,
                        `${user.listingsCount} إعلان`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <div className="admin-users__more-actions">
                      {!user.emailVerifiedAt ? (
                        <Button
                          loading={busyId === user.id}
                          onClick={() =>
                            patchUser(user.id, {
                              recoveryAction: "resend_verification",
                            })
                          }
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          إعادة إرسال رمز
                        </Button>
                      ) : null}
                      <Button
                        loading={busyId === user.id}
                        onClick={() =>
                          patchUser(user.id, {
                            recoveryAction: "send_password_reset",
                          })
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        رابط كلمة المرور
                      </Button>
                      {user.accountStatus !== "suspended" ? (
                        <Button
                          loading={busyId === user.id}
                          onClick={() =>
                            patchUser(user.id, { accountStatus: "suspended" })
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          إيقاف
                        </Button>
                      ) : null}
                      {user.role !== "admin" && sessionIsSuper ? (
                        <Button
                          loading={busyId === user.id}
                          onClick={() =>
                            patchUser(user.id, {
                              role: "admin",
                              adminPermissions: ["listings", "orders"],
                            })
                          }
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          مدير فرعي
                        </Button>
                      ) : null}
                      {user.role === "admin" &&
                      !isSuperAdminRecord(user) &&
                      sessionIsSuper &&
                      user.id !== session?.id ? (
                        <Button
                          loading={busyId === user.id}
                          onClick={() =>
                            patchUser(user.id, {
                              role: "user",
                              adminPermissions: [],
                            })
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          إلغاء المدير
                        </Button>
                      ) : null}
                    </div>

                    {user.role === "admin" &&
                    sessionIsSuper &&
                    !(isSuperAdminRecord(user) && user.id !== session?.id) ? (
                      <div className="admin-users__perms">
                        <p className="admin-users__perms-title">صلاحيات المدير</p>
                        <div className="admin-users__perms-grid">
                          {ALL_ADMIN_PERMISSIONS.map((permission) => {
                            const checked = draftFor(user).includes(permission);
                            const actions =
                              draftMatrixFor(user)[permission] ?? [
                                ...ALL_ADMIN_ACTIONS,
                              ];
                            return (
                              <div key={permission}>
                                <label className="admin-users__perm-label">
                                  <input
                                    checked={checked}
                                    disabled={
                                      busyId === user.id ||
                                      (user.id === session?.id && !sessionIsSuper)
                                    }
                                    onChange={() =>
                                      toggleDraftPermission(user, permission)
                                    }
                                    type="checkbox"
                                  />
                                  {ADMIN_PERMISSION_LABELS[permission]}
                                </label>
                                {checked ? (
                                  <div className="admin-users__perm-actions">
                                    {ALL_ADMIN_ACTIONS.map((item) => (
                                      <label
                                        key={item}
                                        className="admin-users__perm-action"
                                      >
                                        <input
                                          checked={actions.includes(item)}
                                          disabled={busyId === user.id}
                                          onChange={() =>
                                            toggleDraftAction(
                                              user,
                                              permission,
                                              item,
                                            )
                                          }
                                          type="checkbox"
                                        />
                                        {ADMIN_ACTION_LABELS[item]}
                                      </label>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                        <div className="admin-users__more-actions">
                          <Button
                            disabled={!hasUnsavedPermissions(user)}
                            loading={busyId === user.id}
                            onClick={() =>
                              patchUser(user.id, {
                                adminPermissions: draftFor(user),
                                adminActionMatrix: draftMatrixFor(user),
                              })
                            }
                            size="sm"
                            type="button"
                          >
                            حفظ
                          </Button>
                          {hasUnsavedPermissions(user) ? (
                            <Button
                              onClick={() => {
                                setDraftPermissions((prev) => {
                                  const next = { ...prev };
                                  delete next[user.id];
                                  return next;
                                });
                                setDraftMatrices((prev) => {
                                  const next = { ...prev };
                                  delete next[user.id];
                                  return next;
                                });
                              }}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              إلغاء
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
