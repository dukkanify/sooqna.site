"use client";

import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";

type ListingEnglishCopyFieldsProps = {
  defaultDescriptionEnglish?: string;
  defaultTitleEnglish?: string;
};

export function ListingEnglishCopyFields({
  defaultDescriptionEnglish,
  defaultTitleEnglish,
}: ListingEnglishCopyFieldsProps) {
  return (
    <details className="rounded-[var(--radius-xl)] border border-border bg-surface-muted/40 px-3 py-2.5">
      <summary className="cursor-pointer select-none text-sm font-semibold text-ink">
        نسخة إنجليزية اختيارية
      </summary>
      <p className="mt-2 text-xs leading-5 text-muted">
        اكتب النص الإنجليزي إن رغبت. إن تركته فارغاً تُحفظ ترجمة تلقائية دون
        تعديل النص العربي.
      </p>
      <div className="mt-3 grid gap-3">
        <Input
          compact
          defaultValue={defaultTitleEnglish}
          dir="ltr"
          lang="en"
          label="العنوان بالإنجليزية (اختياري)"
          name="titleEnglish"
          placeholder="Optional English title"
        />
        <Textarea
          compact
          defaultValue={defaultDescriptionEnglish}
          dir="ltr"
          lang="en"
          label="الوصف بالإنجليزية (اختياري)"
          name="descriptionEnglish"
          placeholder="Optional English description"
          rows={3}
        />
      </div>
    </details>
  );
}
