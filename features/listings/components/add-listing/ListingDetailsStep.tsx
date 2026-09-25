import type { ListingCondition } from "@/types";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import type { AddListingErrors, ListingPreview } from "./types";
import {
  addListingStepBodyClass,
  addListingStepCardClass,
  addListingStepTitleClass,
} from "./utils";

type ListingDetailsStepProps = {
  errors: AddListingErrors;
  onPreviewChange: (updater: (current: ListingPreview) => ListingPreview) => void;
};

export function ListingDetailsStep({
  errors,
  onPreviewChange,
}: ListingDetailsStepProps) {
  const cities = useMarketplaceLocations();
  return (
    <Card className={addListingStepCardClass}>
      <h2 className={addListingStepTitleClass}>2. تفاصيل الإعلان</h2>
      <div className={addListingStepBodyClass}>
        <div>
          <Input
            compact
            label="عنوان الإعلان"
            name="title"
            onChange={(event) =>
              onPreviewChange((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="مثال: آيفون 15 برو بحالة ممتازة"
            required
          />
          {errors.title ? (
            <FormMessage variant="error">{errors.title}</FormMessage>
          ) : null}
        </div>

        <Textarea
          compact
          label="الوصف"
          name="description"
          onChange={(event) =>
            onPreviewChange((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="اكتب تفاصيل المنتج، الحالة، سبب البيع، وأي معلومات مهمة..."
          required
        />
        {errors.description ? (
          <FormMessage variant="error">{errors.description}</FormMessage>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
          <div>
            <Input
              compact
              inputMode="numeric"
              label="السعر بالدرهم"
              min="1"
              name="price"
              onChange={(event) =>
                onPreviewChange((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              placeholder="اكتب السعر"
              required
              type="number"
            />
            {errors.price ? (
              <FormMessage variant="error">{errors.price}</FormMessage>
            ) : null}
          </div>
          <Select
            compact
            label="حالة المنتج"
            name="condition"
            onChange={(event) =>
              onPreviewChange((current) => ({
                ...current,
                condition: event.target.value as ListingCondition,
              }))
            }
            options={[
              { label: "جديد", value: "new" },
              { label: "مستعمل", value: "used" },
            ]}
            placeholder="اختر..."
            required
          />
          <div className="col-span-2 md:col-span-1">
            <Select
              compact
              label="الإمارة / المدينة"
              name="city"
              onChange={(event) =>
                onPreviewChange((current) => ({
                  ...current,
                  city:
                    cities.find((city) => city.id === event.target.value)?.name ??
                    "",
                }))
              }
              options={cities.map((city) => ({
                label: city.name,
                value: city.id,
              }))}
              placeholder="اختر..."
              required
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-ink md:col-span-3">
            <input
              className="size-4 accent-primary"
              name="negotiable"
              onChange={(event) =>
                onPreviewChange((current) => ({
                  ...current,
                  negotiable: event.target.checked,
                }))
              }
              type="checkbox"
            />
            قابل للتفاوض
          </label>
        </div>
      </div>
    </Card>
  );
}
