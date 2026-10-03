import type { Listing } from "@/types";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import {
  getListingFeatureItems,
  getListingSpecEntries,
  type SpecEntry,
} from "@/shared/listings/listing-specs";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { listingUsesQuotePricing } from "@/shared/listings/quote-pricing";

type ListingSpecificationsProps = {
  listing: Listing;
};

const CAR_SPEC_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "المركبة",
    keys: ["brand", "model", "year", "condition", "regionalSpecs"],
  },
  {
    title: "الأداء",
    keys: [
      "fuelType",
      "transmission",
      "drivetrain",
      "engineSize",
      "cylinders",
      "horsepower",
    ],
  },
  {
    title: "الاستخدام",
    keys: ["mileage", "accidentHistory", "serviceHistory", "warranty"],
  },
  {
    title: "المظهر",
    keys: ["exteriorColor", "interiorColor", "bodyType"],
  },
];

const GOODS_SPEC_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "المنتج",
    keys: [
      "brand",
      "model",
      "condition",
      "color",
      "size",
      "clothingSize",
      "shoeSize",
      "material",
      "gender",
      "ageGroup",
      "bookTitle",
      "author",
      "publisher",
      "isbn",
      "pages",
      "language",
      "edition",
      "genre",
      "sportType",
    ],
  },
  {
    title: "السعر والتوفر",
    keys: ["priceBasis", "saleType", "unitPrice", "quantity", "advertiserRole", "advertiserType"],
  },
];

const RE_SPEC_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "تفاصيل المبنى",
    keys: ["buildingName", "unitNumber", "floor", "totalFloors"],
  },
  {
    title: "موعد التوفر",
    keys: ["availabilityTiming", "availabilityDate", "expectedHandoverDate"],
  },
  {
    title: "العقار",
    keys: [
      "propertyType",
      "purpose",
      "bedrooms",
      "bathrooms",
      "area",
      "areaSqft",
      "parking",
      "furnished",
      "completionStatus",
    ],
  },
  {
    title: "المعلن",
    keys: [
      "advertiserType",
      "advertiserRole",
      "regulatoryAuthority",
      "licenseNumber",
      "brn",
      "bln",
    ],
  },
  {
    title: "الموقع",
    keys: ["developer", "community", "emirate", "city"],
  },
];

function SpecGrid({ entries }: { entries: SpecEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-border bg-surface-muted px-3.5 py-2.5 text-sm"
        >
          <dt className="font-medium text-muted">{entry.label}</dt>
          <dd className="text-end font-semibold text-ink">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ListingSpecifications({ listing }: ListingSpecificationsProps) {
  const specEntries = getListingSpecEntries(listing);
  const featureItems = getListingFeatureItems(listing);
  const showNegotiable =
    listing.id.startsWith("local-") &&
    typeof listing.negotiable === "boolean" &&
    listing.categoryId !== "jobs" &&
    !listingUsesQuotePricing(listing);
  const showReason = Boolean(listing.reasonForSelling?.trim());

  if (
    specEntries.length === 0 &&
    featureItems.length === 0 &&
    !showNegotiable &&
    !showReason
  ) {
    return null;
  }

  const isCars = listing.categoryId === "cars";
  const isRealEstate = listing.categoryId === "real-estate";
  const isGoods = [
    "fashion",
    "kids",
    "books",
    "sports",
    "furniture",
    "electronics",
    "mobiles",
  ].includes(listing.categoryId);
  const groupDefs = isCars
    ? CAR_SPEC_GROUPS
    : isRealEstate
      ? RE_SPEC_GROUPS
      : isGoods
        ? GOODS_SPEC_GROUPS
        : null;
  const usedKeys = new Set<string>();
  const groups = groupDefs
    ? groupDefs
        .map((group) => {
          const entries = group.keys
            .map((key) => specEntries.find((entry) => entry.key === key))
            .filter((entry): entry is SpecEntry => Boolean(entry));
          for (const entry of entries) usedKeys.add(entry.key);
          return { title: group.title, entries };
        })
        .filter((group) => group.entries.length > 0)
    : [];
  const leftover = groupDefs
    ? specEntries.filter((entry) => !usedKeys.has(entry.key))
    : specEntries;

  return (
    <LocalizedTree>
      <Card className="mt-8 marketplace-panel p-5 md:p-6">
        <h2 className="text-lg font-black text-ink">المواصفات والميزات</h2>

        {groupDefs ? (
          <div className="mt-4 space-y-5">
            {groups.map((group) => (
              <section key={group.title}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                  {group.title}
                </h3>
                <SpecGrid entries={group.entries} />
              </section>
            ))}
            {leftover.length > 0 ? (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                  تفاصيل إضافية
                </h3>
                <SpecGrid entries={leftover} />
              </section>
            ) : null}
          </div>
        ) : (
          <SpecGrid entries={leftover} />
        )}

        {featureItems.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {featureItems.map((feature) => (
              <li
                key={feature}
                className="inline-flex items-center gap-2 text-sm font-medium text-ink"
              >
                <Icon className="text-success" name="check" size={14} />
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {showReason ? (
            <p className="rounded-[var(--radius-xl)] bg-surface-muted px-4 py-3 text-muted">
              <span className="font-semibold text-ink">سبب البيع: </span>
              <span data-ugc>{listing.reasonForSelling}</span>
            </p>
          ) : null}
          {showNegotiable ? (
            <p className="rounded-[var(--radius-xl)] bg-surface-muted px-4 py-3 text-muted">
              <span className="font-semibold text-ink">قابل للتفاوض: </span>
              {listing.negotiable ? "نعم" : "السعر نهائي"}
            </p>
          ) : null}
        </div>
      </Card>
    </LocalizedTree>
  );
}

/** @deprecated Use ListingSpecifications */
export { ListingSpecifications as ListingFeatures };
