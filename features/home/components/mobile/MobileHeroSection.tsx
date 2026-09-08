import Image from "next/image";
import { getMarketHeroBackground } from "@/services/content/homepage-marketplace.content";
import {
  MarketHeroBadge,
  MarketHeroCopy,
} from "@/features/home/components/marketplace/MarketHeroCopy";

export async function MobileHeroSection() {
  const backgroundUrl = await getMarketHeroBackground();

  return (
    <section className="mobile-home-hero">
      <div className="mobile-home-hero__media">
        <div className="mobile-home-hero__bg">
          <Image
            alt="أفق أبوظبي — أبراج الاتحاد والكورنيش"
            className="object-cover"
            fill
            priority
            quality={72}
            sizes="(max-width: 430px) 100vw, 480px"
            src={backgroundUrl}
          />
        </div>
        <div aria-hidden className="mobile-home-hero__media-overlay" />
        <MarketHeroBadge />
      </div>

      <div className="mobile-home-hero__content">
        <MarketHeroCopy variant="mobile" />
      </div>
    </section>
  );
}
