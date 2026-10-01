"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

type WalletRow = {
  availableBalance: number;
  currency: string;
  heldInEscrow: number;
  lastTransaction: { date: string; description: string; type: string } | null;
  pendingBalance: number;
  transactionsCount: number;
  userId: string;
};

type WalletsPayload = {
  summary: {
    accounts: number;
    available: number;
    currency: string;
    held: number;
    pending: number;
  };
  wallets: WalletRow[];
};

export function AdminWalletsPanel() {
  const locale = useLocale();
  const [data, setData] = useState<WalletsPayload | null>(null);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/wallets")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.summary) setData(payload as WalletsPayload);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.wallets;
    return data.wallets.filter((wallet) =>
      wallet.userId.toLowerCase().includes(q),
    );
  }, [data, query]);

  async function handleAdjust() {
    const session = getSessionUser();
    if (!session) return;
    const parsedAmount = Number(amount);
    if (!userId.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage("أدخل معرّف مستخدم ومبلغاً صالحاً.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await adminFetch("/api/admin/wallets", {
        method: "POST",
        body: JSON.stringify({
          userId: userId.trim(),
          amount: parsedAmount,
          type,
          description: description.trim() || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setMessage("تعذّر تعديل المحفظة.");
        return;
      }
      if (payload?.summary) setData(payload as WalletsPayload);
      setMessage(type === "deposit" ? "تم الإيداع." : "تم السحب.");
      setAmount("");
      setDescription("");
    } catch {
      setMessage("تعذّر تعديل المحفظة.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <Card className="admin-desk-table-card p-8 text-center" variant="flat">
        <p className="text-sm text-muted">جاري تحميل المحافظ...</p>
      </Card>
    );
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          أرصدة المستخدمين المتاحة والمعلّقة والمحجوزة — عدّل إدارياً أو راجع
          الحركات مباشرة.
        </p>
        <div className="admin-desk-toolbar__actions">
          <Button href="/admin/escrow" size="sm" variant="secondary">
            الضمان
          </Button>
          <Button href="/admin/orders" size="sm" variant="ghost">
            الطلبات
          </Button>
        </div>
      </div>

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">عدد المحافظ</p>
          <p className="admin-ops__kpi-value">{data.summary.accounts}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">متاح</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={data.summary.available} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">معلّق</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={data.summary.pending} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">محجوز ضمان</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={data.summary.held} size="md" />
          </div>
        </div>
      </div>

      <Card className="admin-desk-help p-4" variant="flat">
        <h2 className="text-sm font-semibold text-ink">تعديل رصيد إداري</h2>
        <p className="mt-1 text-xs leading-6 text-muted">
          الإيداع يزيد الرصيد المتاح، والسحب يخصمه. اضغط معرّف محفظة من الجدول
          لتعبئة الحقل تلقائياً.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="معرّف المستخدم"
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user-..."
            value={userId}
          />
          <Input
            label="المبلغ (د.إ)"
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            value={amount}
          />
          <Select
            label="النوع"
            onChange={(e) =>
              setType(
                e.target.value === "withdrawal" ? "withdrawal" : "deposit",
              )
            }
            options={[
              { label: "إيداع", value: "deposit" },
              { label: "سحب", value: "withdrawal" },
            ]}
            value={type}
          />
          <Input
            label="ملاحظة (اختياري)"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            loading={busy}
            onClick={handleAdjust}
            size="sm"
            variant="primary"
          >
            تنفيذ
          </Button>
          {message ? <p className="text-xs font-medium text-muted">{message}</p> : null}
        </div>
      </Card>

      <Card className="admin-desk-filters p-4" variant="flat">
        <div className="admin-desk-filters__grid">
          <div className="min-w-[200px] flex-1">
            <Input
              label="بحث"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="معرّف المستخدم..."
              value={query}
            />
          </div>
          <p className="pb-2 text-xs font-semibold text-muted">
            {filtered.length} محفظة
          </p>
        </div>
      </Card>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>متاح</th>
                <th>معلّق</th>
                <th>محجوز</th>
                <th>الحركات</th>
                <th>آخر حركة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={6}>
                    لا توجد محافظ مطابقة.
                  </td>
                </tr>
              ) : (
                filtered.map((wallet) => (
                  <tr key={wallet.userId}>
                    <td className="admin-desk-cell-wrap">
                      <button
                        className="admin-desk-cell-title text-start font-bold text-ink underline-offset-2 hover:underline"
                        onClick={() => setUserId(wallet.userId)}
                        type="button"
                      >
                        {wallet.userId}
                      </button>
                    </td>
                    <td>
                      <CurrencyAmount
                        amount={wallet.availableBalance}
                        size="sm"
                      />
                    </td>
                    <td>
                      <CurrencyAmount amount={wallet.pendingBalance} size="sm" />
                    </td>
                    <td>
                      <CurrencyAmount amount={wallet.heldInEscrow} size="sm" />
                    </td>
                    <td>{wallet.transactionsCount}</td>
                    <td className="admin-desk-cell-wrap text-xs text-muted">
                      {wallet.lastTransaction
                        ? `${wallet.lastTransaction.type} — ${new Date(
                            wallet.lastTransaction.date,
                          ).toLocaleString(intlLocale(locale))}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {filtered.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد محافظ مطابقة.</p>
            </li>
          ) : (
            filtered.map((wallet) => (
              <li key={wallet.userId} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <button
                    className="min-w-0 flex-1 text-start text-sm font-bold text-ink"
                    onClick={() => setUserId(wallet.userId)}
                    type="button"
                  >
                    {wallet.userId}
                  </button>
                  <CurrencyAmount amount={wallet.availableBalance} size="sm" />
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <span>معلّق {wallet.pendingBalance.toLocaleString(intlLocale(locale))}</span>
                  <span>محجوز {wallet.heldInEscrow.toLocaleString(intlLocale(locale))}</span>
                  <span>{wallet.transactionsCount} حركة</span>
                </div>
                {wallet.lastTransaction ? (
                  <p className="text-xs text-muted">
                    {wallet.lastTransaction.type} —{" "}
                    {new Date(wallet.lastTransaction.date).toLocaleString(
                      intlLocale(locale),
                    )}
                  </p>
                ) : null}
                <div className="admin-desk-mobile-card__actions">
                  <Button
                    onClick={() => setUserId(wallet.userId)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    تعبئة للتعديل
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Link className="admin-ops__text-link" href="/admin/escrow">
        عرض الضمان ←
      </Link>
    </div>
  );
}
