"use client";

import {
  SOCIAL_LINK_LABELS_AR,
  SOCIAL_LINK_PLACEHOLDERS,
  SOCIAL_LINK_PLATFORMS,
  type SocialLinkPlatform,
} from "@/shared/constants/social-links";
import { Input } from "@/shared/ui/Input";
import type { SocialLinks } from "@/types";

type ProfileSocialLinksFieldsProps = {
  links?: SocialLinks;
  publicVisible: boolean;
  errors?: Partial<Record<SocialLinkPlatform, string>>;
};

export function ProfileSocialLinksFields({
  links,
  publicVisible,
  errors,
}: ProfileSocialLinksFieldsProps) {
  return (
    <fieldset className="grid gap-4 rounded-[var(--radius-2xl)] border border-border/60 p-4">
      <legend className="px-1 text-sm font-black text-ink">
        روابط التواصل الاجتماعي
      </legend>
      <p className="text-sm font-medium leading-7 text-muted">
        حقول اختيارية. أضف روابط حساباتك، وتحكّم في إظهارها للعامة على صفحة
        البائع.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {SOCIAL_LINK_PLATFORMS.map((platform) => (
          <Input
            key={platform}
            defaultValue={links?.[platform] ?? ""}
            error={errors?.[platform]}
            label={SOCIAL_LINK_LABELS_AR[platform]}
            name={`social_${platform}`}
            placeholder={SOCIAL_LINK_PLACEHOLDERS[platform]}
            type="url"
          />
        ))}
      </div>

      <label className="flex gap-3 rounded-[var(--radius-xl)] bg-surface-muted p-4 text-sm font-medium leading-7 text-ink">
        <input
          className="mt-1 size-4 accent-primary"
          defaultChecked={publicVisible}
          name="socialLinksPublic"
          type="checkbox"
        />
        <span>
          إظهار روابط التواصل للعامة على صفحة البائع
          <span className="mt-1 block text-muted">
            عند إلغاء التحديد تبقى الروابط محفوظة في ملفك فقط.
          </span>
        </span>
      </label>
    </fieldset>
  );
}
