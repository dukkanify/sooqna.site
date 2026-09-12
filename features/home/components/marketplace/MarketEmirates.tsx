import Link from "next/link";
import { AppImage } from "@/shared/components/AppImage";
import { DragScrollRow } from "@/shared/components/DragScrollRow";
import { Icon } from "@/shared/ui/Icon";
import { getUaeEmiratesCards } from "@/features/home/shared/uae-emirates";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { getRequestLocale } from "@/shared/i18n/locale";

export async function MarketEmirates() {
  const [emirates, locale] = await Promise.all([
    getUaeEmiratesCards(),
    getRequestLocale(),
  ]);

  return (
    <section className="bg-background py-8 md:py-10">
      <div className="app-container">
        <div className="mb-3 max-w-2xl md:mb-4">
          <p className="text-xs font-bold text-[#B8955F]">Emirates</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-ink md:text-2xl">
            الإمارات الأكثر شعبية
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            من دبي إلى الفجيرة — تصفح الإعلانات في إمارتك.
          </p>
        </div>

        <DragScrollRow
          ariaLabel="الإمارات الأكثر شعبية"
          className="market-emirates-rail -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:-mx-6 md:gap-3 md:px-6"
        >
          {emirates.map((emirate) => (
            <Link
              key={emirate.id}
              className="group relative h-36 w-[10.5rem] shrink-0 snap-start overflow-hidden rounded-xl shadow-[0_6px_18px_rgb(15_20_25/8%)] transition hover:shadow-[0_10px_24px_rgb(15_20_25/12%)] sm:h-40 sm:w-[12rem] md:h-44 md:w-[13.5rem]"
              href={emirate.href}
            >
              <AppImage
                alt={`${emirate.name} — ${emirate.landmark}`}
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                fallback="emirates"
                fill
                sizes="(max-width: 640px) 42vw, 216px"
                src={emirate.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[11px] font-semibold text-white/80">
                  {listingCountLabel(emirate.count, locale)}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    {emirate.name}
                  </h3>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                    <Icon name="arrow-left" size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </DragScrollRow>
      </div>
    </section>
  );
}
