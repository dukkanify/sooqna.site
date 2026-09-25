"use client";

import { useState } from "react";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import type { UserProfile } from "@/types";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { getSessionUser, setSessionUser } from "@/services/storage";
import { isUaePassEnabled } from "@/shared/constants/feature-flags";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

type ProfileFormProps = {
  user: UserProfile;
};

const accountTypeLabels: Record<UserProfile["accountType"], string> = {
  business: "متجر أو معرض",
  buyer: "مشتري",
  company: "شركة",
  individual: "فرد",
  seller: "بائع فردي",
};

export function ProfileForm({ user }: ProfileFormProps) {
  const cities = useMarketplaceLocations();
  const [displayUser, setDisplayUser] = useState(() =>
    typeof window !== "undefined" ? (getSessionUser() ?? user) : user,
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <LocalizedTree>
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <Card className="overflow-hidden p-0">
        <div className="luxury-gradient p-6 text-white">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid size-20 place-items-center rounded-[var(--radius-2xl)] bg-secondary text-2xl font-semibold text-primary shadow-[var(--shadow-md)]">
              {displayUser.fullName.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-black">{displayUser.fullName}</h2>
              <p className="mt-2 text-sm font-medium text-white/75">
                {displayUser.email}
              </p>
              <p className="mt-2">
                <Badge variant={displayUser.isVerified ? "verified" : "pending"}>
                  {displayUser.isVerified ? "حساب موثق" : "بانتظار التوثيق"}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        <form
          key={displayUser.id}
          className="grid gap-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const cityId = String(formData.get("city") ?? "");
            const cityName =
              cities.find((city) => city.id === cityId)?.name ?? displayUser.city;
            const accountType = String(
              formData.get("accountType") ?? displayUser.accountType,
            ) as UserProfile["accountType"];
            const fullName = String(
              formData.get("fullName") ?? displayUser.fullName,
            ).trim();
            const phone = String(formData.get("phone") ?? displayUser.phone).trim();

            setIsSaving(true);
            setSaveMessage("");
            setSaveError(false);

            void (async () => {
              try {
                const response = await fetch("/api/profile", {
                  method: "PATCH",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fullName,
                    phone,
                    city: cityName,
                    accountType,
                  }),
                });

                if (!response.ok) {
                  setSaveError(true);
                  setSaveMessage("تعذر حفظ الملف الشخصي. حاول مرة أخرى.");
                  return;
                }

                const payload = (await response.json()) as { user?: UserProfile };
                const updatedUser = payload.user ?? {
                  ...displayUser,
                  fullName,
                  phone,
                  city: cityName,
                  accountType,
                };

                setSessionUser(updatedUser);
                setDisplayUser(updatedUser);
                setSaveMessage("تم حفظ التغييرات في حسابك.");
              } catch {
                setSaveError(true);
                setSaveMessage("تعذر حفظ الملف الشخصي. حاول مرة أخرى.");
              } finally {
                setIsSaving(false);
              }
            })();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              defaultValue={displayUser.fullName}
              label="الاسم الكامل"
              name="fullName"
              type="text"
            />
            <Input
              defaultValue={displayUser.email}
              disabled
              label="البريد الإلكتروني"
              name="email"
              type="email"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              defaultValue={displayUser.phone}
              label="رقم الهاتف"
              name="phone"
              type="tel"
            />
            <Select
              defaultValue={cities.find((city) => city.name === displayUser.city)?.id}
              label="الإمارة / المدينة"
              name="city"
              options={cities.map((city) => ({
                label: city.name,
                value: city.id,
              }))}
            />
          </div>

          <Select
            defaultValue={displayUser.accountType}
            label="نوع الحساب"
            name="accountType"
            options={[
              { label: "فرد", value: "individual" },
              { label: "شركة", value: "company" },
              { label: "مشتري", value: "buyer" },
              { label: "بائع فردي", value: "seller" },
              { label: "متجر أو معرض", value: "business" },
            ]}
          />

          {saveMessage ? (
            <FormMessage variant={saveError ? "error" : "success"}>
              {saveMessage}
            </FormMessage>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-2xl)] bg-surface-muted p-4">
            <p className="text-sm font-medium text-muted">
              التغييرات تُحفظ في حسابك وتظهر على كل الأجهزة بعد تسجيل الدخول.
            </p>
            <Button loading={isSaving} type="submit">
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-black text-ink">حالة الحساب</h2>
          <div className="mt-5 grid gap-3 text-sm font-medium">
            <div className="flex justify-between rounded-[var(--radius-xl)] bg-surface-muted p-4">
              <span className="text-muted">نوع الحساب</span>
              <span className="font-semibold text-ink">
                {accountTypeLabels[displayUser.accountType]}
              </span>
            </div>
            <div className="flex justify-between rounded-[var(--radius-xl)] bg-surface-muted p-4">
              <span className="text-muted">التوثيق</span>
              <Badge variant={displayUser.isVerified ? "verified" : "pending"}>
                {displayUser.isVerified ? "موثق" : "غير موثق"}
              </Badge>
            </div>
            <div className="flex justify-between rounded-[var(--radius-xl)] bg-surface-muted p-4">
              <span className="text-muted">تاريخ الانضمام</span>
              <span className="font-semibold text-ink">{displayUser.joinedAt}</span>
            </div>
          </div>
        </Card>

        {isUaePassEnabled() ? (
          <Card className="border-primary-soft bg-primary-soft p-6">
            <h2 className="text-lg font-black text-primary">توثيق الهوية</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-primary">
              يمكنك توثيق هويتك لرفع حدود البيع والسحب من المحفظة عند تفعيل خدمة التوثيق.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
    </LocalizedTree>
  );
}
