"use client";

import { useTx } from "@/shared/i18n/useTx";

type AuthBrandTitleProps = {
  title: string;
};

export function AuthBrandTitle({ title }: AuthBrandTitleProps) {
  const t = useTx();
  const translated = t(title);
  const parts = translated.split(/(سوقنا|Sooqna)/g);

  return (
    <h1 className="auth-shell__title">
      {parts.map((part, index) =>
        part === "سوقنا" || part === "Sooqna" ? (
          <span className="auth-shell__title-accent" key={`${part}-${index}`}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </h1>
  );
}
