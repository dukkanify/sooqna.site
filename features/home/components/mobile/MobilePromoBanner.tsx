import Link from "next/link";
import { AppImage } from "@/shared/components/AppImage";
import { Icon } from "@/shared/ui/Icon";

export function MobilePromoBanner() {
  return (
    <section aria-label="بيع سيارتك" className="mobile-home-promo">
      <div className="mobile-home-promo__panel">
        <div className="mobile-home-promo__copy">
          <p className="mobile-home-promo__badge">
            <Icon name="shield" size={13} />
            بيع آمن وموثوق
          </p>
          <p className="mobile-home-promo__title">بيع سيارتك خلال دقائق</p>
          <p className="mobile-home-promo__desc">وصل لمشتري جادين بسرعة وأمان</p>
          <Link className="mobile-home-promo__cta" href="/listings/new">
            ابدأ الآن
            <Icon name="chevron-left" size={14} />
          </Link>
        </div>

        <div className="mobile-home-promo__media">
          <AppImage
            alt="سيارة مرسيدس للبيع على سوقنا"
            className="object-cover"
            fallbackCategory="cars"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 420px"
            src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80"
          />
        </div>
      </div>
    </section>
  );
}
