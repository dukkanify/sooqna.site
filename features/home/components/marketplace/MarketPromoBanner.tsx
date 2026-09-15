import Link from "next/link";
import { AppImage } from "@/shared/components/AppImage";
import { Icon } from "@/shared/ui/Icon";

export function MarketPromoBanner() {
  return (
    <section aria-label="بيع سيارتك" className="border-b border-border/50 bg-surface py-8 md:py-10">
      <div className="app-container px-4">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1628] shadow-[0_18px_48px_rgb(11_22_40/20%)]">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 start-1/4 size-64 rounded-full bg-secondary/18 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -end-10 size-52 rounded-full bg-secondary/12 blur-3xl"
          />

          <div className="relative grid md:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.9fr)] md:items-stretch">
            <div className="flex flex-col justify-center gap-4 px-6 pb-5 pt-7 sm:px-8 md:gap-5 md:px-10 md:py-11">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/30 bg-white/5 px-3 py-1 text-xs font-semibold text-secondary">
                <Icon name="shield" size={14} />
                بيع آمن وموثوق
              </p>
              <div className="space-y-2.5">
                <h2 className="max-w-md text-2xl font-bold leading-[1.45] text-secondary md:text-[1.85rem]">
                  بيع سيارتك خلال دقائق
                </h2>
                <p className="max-w-md text-[0.95rem] leading-8 text-white/80">
                  وصل لمشتري جادين بسرعة وأمان
                </p>
              </div>
              <Link
                className="mt-1 inline-flex min-h-12 w-fit items-center gap-1.5 rounded-full bg-secondary px-6 text-sm font-bold text-[#0b1628] transition hover:bg-[#d4b87a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-secondary"
                href="/listings/new"
              >
                ابدأ الآن
                <Icon name="chevron-left" size={16} />
              </Link>
            </div>

            <div className="relative mx-5 mb-5 h-[13rem] overflow-hidden rounded-2xl bg-[#152033] sm:h-[15rem] md:mx-0 md:mb-0 md:h-auto md:min-h-full md:rounded-none">
              <AppImage
                alt="سيارة مرسيدس للبيع على سوقنا"
                className="object-cover"
                fallbackCategory="cars"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 420px"
                src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0b1628]/45 via-[#0b1628]/10 to-transparent md:bg-gradient-to-l md:from-transparent md:via-[#0b1628]/10 md:to-[#0b1628]/55"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
