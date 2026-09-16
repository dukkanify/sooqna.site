"use client";

import { useLocale } from "@/shared/i18n/useLocale";

type MarketHeroCopyProps = {
  variant?: "desktop" | "mobile";
};

const COPY = {
  ar: {
    titleBefore: "بيع وشراء بثقة في",
    titleAccent: "الإمارات",
    leadDesktop:
      "كل ما تحتاجه من سيارات، عقارات، إلكترونيات وخدمات في منصة إماراتية واحدة — بيع وشراء بثقة عبر سوقنا.",
    leadMobile:
      "بيع وشراء السيارات والعقارات والإلكترونيات والوظائف والخدمات في منصة إماراتية واحدة.",
  },
  en: {
    titleBefore: "Buy and sell with confidence in",
    titleAccent: "the UAE",
    leadDesktop:
      "Everything you need in cars, property, electronics, and services on one UAE marketplace — buy and sell with confidence on Sooqna.",
    leadMobile:
      "Buy and sell cars, property, electronics, jobs, and services on one UAE marketplace.",
  },
} as const;

/**
 * Locale-aware hero copy. Kept as one component so LiveLocalizer cannot
 * partially translate split Arabic text nodes (which left mixed AR/EN).
 */
export function MarketHeroCopy({ variant = "desktop" }: MarketHeroCopyProps) {
  const locale = useLocale();
  const copy = COPY[locale];
  const isMobile = variant === "mobile";

  return (
    <div data-no-tx>
      {isMobile ? (
        <>
          <h1 className="mobile-home-hero__title">
            {copy.titleBefore}{" "}
            <span className="mobile-home-hero__title-accent">{copy.titleAccent}</span>
          </h1>
          <p className="mobile-home-hero__desc">{copy.leadMobile}</p>
        </>
      ) : (
        <div className="market-hero-copy">
          <h1 className="market-hero-title">
            {copy.titleBefore}{" "}
            <span className="market-hero-title__accent">{copy.titleAccent}</span>
          </h1>
          <p className="market-hero-lead">{copy.leadDesktop}</p>
        </div>
      )}
    </div>
  );
}
