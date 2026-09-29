"use client";

import { useState } from "react";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import type { SocialLinks, UserProfile } from "@/types";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { getSessionUser, setSessionUser } from "@/services/storage";
import { isUaePassEnabled } from "@/shared/constants/feature-flags";
import { SOCIAL_LINK_PLATFORMS } from "@/shared/constants/social-links";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import {
  SOCIAL_LINK_INVALID_AR,
  sanitizeSocialLinks,
} from "@/shared/validation/social-links";
import { ChangeEmailSection } from "./ChangeEmailSection";
import { ProfileSocialLinksFields } from "./ProfileSocialLinksFields";

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

function readSocialLinksFromForm(formData: FormData): SocialLinks {
  const raw: SocialLinks = {};
  for (const platform of SOCIAL_LINK_PLATFORMS) {
    raw[platform] = String(formData.get(`social_${platform}`) ?? "").trim();
  }
  return raw;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const cities = useMarketplaceLocations();
  const [displayUser, setDisplayUser] = useState(() =>
    typeof window !== "undefined" ? (getSessionUser() ?? user) : user,
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formRevision, setFormRevision] = useState(0);
  const [socialErrors, setSocialErrors] = useState<
    Partial<Record<(typeof SOCIAL_LINK_PLATFORMS)[number], string>>
  >({});

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
          key={`${displayUser.id}-${formRevision}`}
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
            const socialRaw = readSocialLinksFromForm(formData);
            const socialSanitized = sanitizeSocialLinks(socialRaw);
            const socialLinksPublic = formData.get("socialLinksPublic") === "on";
            const businessName = String(formData.get("businessName") ?? "").trim();

            if (!socialSanitized.ok) {
              setSocialErrors({
                [socialSanitized.platform]: SOCIAL_LINK_INVALID_AR,
              });
              setSaveError(true);
              setSaveMessage(SOCIAL_LINK_INVALID_AR);
              return;
            }
            setSocialErrors({});

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
                    socialLinks: socialSanitized.links,
                    socialLinksPublic,
                    businessName,
                  }),
                });

                if (!response.ok) {
                  const err = (await response.json().catch(() => ({}))) as {
                    message?: string;
                    platform?: string;
                  };
                  setSaveError(true);
                  setSaveMessage(
                    err.message ?? "تعذر حفظ الملف الشخصي. حاول مرة أخرى.",
                  );
                  if (err.platform) {
                    setSocialErrors({
                      [err.platform]: err.message ?? SOCIAL_LINK_INVALID_AR,
                    });
                  }
                  return;
                }

                const payload = (await response.json()) as { user?: UserProfile };
                const updatedUser = payload.user ?? {
                  ...displayUser,
                  fullName,
                  phone,
                  city: cityName,
                  accountType,
                  socialLinks: socialSanitized.links,
                  socialLinksPublic,
                  businessProfile: businessName
                    ? { ...displayUser.businessProfile, businessName }
                    : (() => {
                        const { businessName: _drop, ...rest } =
                          displayUser.businessProfile ?? {};
                        return Object.keys(rest).length > 0 ? rest : undefined;
                      })(),
                };

                setSessionUser(updatedUser);
                setDisplayUser(updatedUser);
                setFormRevision((value) => value + 1);
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
              hint="لتغيير البريد استخدم القسم الآمن أسفل نموذج الحفظ"
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

          <Input
            defaultValue={displayUser.businessProfile?.businessName ?? ""}
            hint="اختياري — يظهر كاسم التاجر على إعلاناتك"
            label="اسم الشركة / التاجر"
            name="businessName"
            placeholder="مثال: معرض النور للسيارات"
            type="text"
          />

          <ProfileSocialLinksFields
            errors={socialErrors}
            links={displayUser.socialLinks}
            publicVisible={Boolean(displayUser.socialLinksPublic)}
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

        {/* Outside the save form so password/OTP fields don't trigger browser save or form submit. */}
        <div className="border-t border-border/60 p-6 pt-5">
          <ChangeEmailSection
            onUserUpdated={(next) => {
              setDisplayUser(next);
              setFormRevision((value) => value + 1);
            }}
            user={displayUser}
          />
        </div>
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
