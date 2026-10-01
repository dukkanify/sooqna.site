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
  email?: string;
  fullName?: string;
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

const TXN_LABELS: Record<string, string> = {
  deposit: "إيداع",
  withdrawal: "سحب",
  escrow_hold: "حجز ضمان",
  escrow_release: "تحرير ضمان",
  refund: "استرداد",
  platform_fee: "رسوم منصة",
  stripe_payment: "دفع Stripe",
};

function walletLabel(wallet: WalletRow): string {
  return wallet.fullName?.trim() || wallet.email?.trim() || wallet.userId;
}

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
    return data.wallets.filter((wallet) => {
      const haystack = [
        wallet.userId,
        wallet.fullName,
        wallet.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, query]);

  const visibleSummary = useMemo(() => {
    if (!data) return null;
    if (filtered.length === data.wallets.length) return data.summary;
    return {
      accounts: filtered.length,
      available: filtered.reduce((sum, w) => sum + w.availableBalance, 0),
      pending: filtered.reduce((sum, w) => sum + w.pendingBalance, 0),
      held: filtered.reduce((sum, w) => sum + w.heldInEscrow, 0),
      currency: data.summary.currency,
    };
  }, [data, filtered]);

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

  if (!data || !visibleSummary) {
    return (
      <Card className="admin-desk-table-card p-8 text-center" variant="flat">
        <p className="text-sm text-muted">جاري تحميل المحافظ...</p>
      </Card>
    );
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <div className="grid gap-1">
          <p className="text-sm text-muted">
            دفتر محافظ لايف جاهز للإطلاق — أرصدة حقيقية فقط (بدون حسابات تجريبية أو
            دفعات وهمية أو بذور desk/finance).
          </p>
          <p className="text-xs leading-6 text-muted">
            الأصفار طبيعية قبل أول دفع Stripe حقيقي. اربط أي تعديل إداري بمستخدم
            فعّال، أو راجع الضمان والطلبات المباشرة.
          </p>
        </div>
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
          <p className="admin-ops__kpi-value">{visibleSummary.accounts}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">متاح</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={visibleSummary.available} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">معلّق ضمان</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={visibleSummary.pending} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">محجوز ضمان</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={visibleSummary.held} size="md" />
          </div>
        </div>
      </div>

      <Card className="admin-desk-help p-4" variant="flat">
        <h2 className="text-sm font-semibold text-ink">تعديل رصيد إداري</h2>
        <p className="mt-1 text-xs leading-6 text-muted">
          يحدّث دفتر المحفظة فقط (ليس تحويل Stripe). الإيداع يزيد المتاح، والسحب
          يخصمه. اختر مستخدماً من الجدول لتعبئة المعرّف.
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
              placeholder="اسم، بريد، أو معرّف..."
              value={query}
            />
          </div>
          <p className="pb-2 text-xs font-semibold text-muted">
            {filtered.length} محفظة حقيقية
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
                    {data.wallets.length === 0
                      ? "لا محافظ حقيقية بعد — الدفتر نظيف وجاهز لأول عملية لايف."
                      : "لا توجد محافظ حقيقية مطابقة لبحثك."}
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
                        {walletLabel(wallet)}
                      </button>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">
                        {wallet.userId}
                      </p>
                      {wallet.email ? (
                        <p className="text-[11px] text-muted">{wallet.email}</p>
                      ) : null}
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
                        ? `${TXN_LABELS[wallet.lastTransaction.type] ?? wallet.lastTransaction.type} — ${new Date(
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
              <p className="text-sm text-muted">لا توجد محافظ حقيقية مطابقة.</p>
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
                    {walletLabel(wallet)}
                  </button>
                  <CurrencyAmount amount={wallet.availableBalance} size="sm" />
                </div>
                <p className="font-mono text-[11px] text-muted">{wallet.userId}</p>
                <div className="admin-desk-mobile-card__meta">
                  <span>معلّق {wallet.pendingBalance.toLocaleString(intlLocale(locale))}</span>
                  <span>محجوز {wallet.heldInEscrow.toLocaleString(intlLocale(locale))}</span>
                  <span>{wallet.transactionsCount} حركة</span>
                </div>
                {wallet.lastTransaction ? (
                  <p className="text-xs text-muted">
                    {TXN_LABELS[wallet.lastTransaction.type] ??
                      wallet.lastTransaction.type}{" "}
                    —{" "}
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

      <div className="admin-ops__quick-links">
        <Link className="admin-ops__chip-link" href="/admin/escrow">
          الضمان
        </Link>
        <Link className="admin-ops__chip-link" href="/admin/orders">
          الطلبات
        </Link>
        <Link className="admin-ops__text-link" href="/admin/reports">
          التقارير
        </Link>
      </div>
    </div>
  );
}
