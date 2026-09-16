"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type {
  AdminCategoryRecord,
  AdminListingRecord,
  ListingStatus,
} from "@/types";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { isDynamicCategory } from "@/shared/constants/category-fields";
import { listingStatusLabels } from "@/shared/constants/listingStatuses";
import { getLocalListings, getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import {
  CategoryFieldsForm,
  type CategoryFieldErrors,
} from "@/features/listings/components/add-listing/CategoryFieldsForm";
import { parseCategoryForm } from "@/features/listings/components/add-listing/category-form-utils";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { intlLocale } from "@/shared/i18n/locale";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { useLocale } from "@/shared/i18n/useLocale";

const statusFilterOptions: { label: string; value: string }[] = [
  { label: "إعلانات السوق", value: "marketplace" },
  { label: "الكل (مع التجريبي)", value: "all" },
  { label: listingStatusLabels.pending_review, value: "pending_review" },
  { label: listingStatusLabels.active, value: "active" },
  { label: listingStatusLabels.rejected, value: "rejected" },
  { label: listingStatusLabels.draft, value: "draft" },
  { label: listingStatusLabels.expired, value: "expired" },
  { label: "تجريبي فقط", value: "demo" },
];

function isDemoAdminListing(listing: AdminListingRecord): boolean {
  return listing.isDemo === true || listing.source === "SOOQNA_SHOWCASE";
}

const conditionOptions = [
  { label: "مستعمل", value: "used" },
  { label: "جديد", value: "new" },
];

const publishStatusOptions = [
  { label: "نشط فوراً", value: "active" },
  { label: "بانتظار المراجعة", value: "pending_review" },
  { label: "مسودة", value: "draft" },
];

function listingBadgeVariant(
  status: ListingStatus,
): "verified" | "pending" | "rejected" | "muted" | "sold" {
  if (status === "active") return "verified";
  if (status === "pending_review") return "pending";
  if (status === "rejected") return "rejected";
  if (status === "expired") return "sold";
  return "muted";
}

const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  city: "دبي",
  price: "",
  condition: "used",
  status: "active",
  sellerName: "",
  contactPhone: "",
  imageUrl: "",
  isFeatured: false,
};

export function AdminListingsPanel() {
  const cities = useMarketplaceLocations();
  const locale = useLocale();
  const [listings, setListings] = useState<AdminListingRecord[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("marketplace");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [showcaseBusy, setShowcaseBusy] = useState<string | null>(null);
  const [showcaseMessage, setShowcaseMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    price: "",
    city: "دبي",
    condition: "used",
    contactPhone: "",
    imageUrl: "",
    images: [] as string[],
    sellerName: "",
  });
  const [editFieldErrors, setEditFieldErrors] = useState<CategoryFieldErrors>(
    {},
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [openRowActions, setOpenRowActions] = useState<string | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;

    const timeoutId = window.setTimeout(() => {
      const localListings = getLocalListings();
      const sync =
        localListings.length > 0
          ? adminFetch("/api/admin/listings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ listings: localListings }),
            }).then((res) => res.json())
          : adminFetch("/api/admin/listings").then((res) => res.json());

      sync
        .then((data) => setListings(data.listings ?? []))
        .catch(() => setListings([]));

      adminFetch("/api/admin/categories")
        .then((res) => res.json())
        .then((data) => {
          const rows = (data.categories ?? []) as AdminCategoryRecord[];
          setCategories(rows);
          setForm((current) =>
            current.categoryId
              ? current
              : {
                  ...current,
                  categoryId:
                    rows.find((row) => row.enabled)?.id ?? rows[0]?.id ?? "",
                },
          );
        })
        .catch(() => setCategories([]));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return listings
      .filter((listing) => {
        const demo = isDemoAdminListing(listing);
        if (statusFilter === "demo") return demo;
        if (statusFilter === "marketplace") return !demo;
        if (statusFilter === "all") return true;
        // Status filters show real marketplace ads only (not showcase).
        return listing.status === statusFilter && !demo;
      })
      .filter((listing) =>
        categoryFilter === "all" ? true : listing.categoryId === categoryFilter,
      )
      .filter((listing) =>
        cityFilter === "all" ? true : listing.city === cityFilter,
      )
      .filter((listing) => {
        if (!q) return true;
        const contactPhone = (
          listing as AdminListingRecord & { contactPhone?: string }
        ).contactPhone;
        return (
          listing.title.toLowerCase().includes(q) ||
          listing.id.toLowerCase().includes(q) ||
          listing.slug.toLowerCase().includes(q) ||
          listing.sellerName.toLowerCase().includes(q) ||
          (contactPhone?.includes(q) ?? false)
        );
      });
  }, [listings, statusFilter, categoryFilter, cityFilter, searchQuery]);

  const categoryFilterOptions = useMemo(() => {
    const ids = [...new Set(listings.map((listing) => listing.categoryId))].sort();
    const labels = new Map(categories.map((category) => [category.id, category.name]));
    return [
      { label: "كل الأقسام", value: "all" },
      ...ids.map((id) => ({
        label: labels.get(id) ?? id,
        value: id,
      })),
    ];
  }, [categories, listings]);

  const cityFilterOptions = useMemo(() => {
    const listingCities = [
      ...new Set(listings.map((listing) => listing.city).filter(Boolean)),
    ].sort();
    return [
      { label: "كل المدن", value: "all" },
      ...listingCities.map((city) => ({ label: city, value: city })),
    ];
  }, [listings]);

  const pendingCount = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.status === "pending_review" && !isDemoAdminListing(listing),
      ).length,
    [listings],
  );

  const marketplaceCount = useMemo(
    () => listings.filter((listing) => !isDemoAdminListing(listing)).length,
    [listings],
  );

  const defaultStatusFilter = "marketplace";

  const hasActiveFilters =
    statusFilter !== defaultStatusFilter ||
    categoryFilter !== "all" ||
    cityFilter !== "all" ||
    searchQuery.trim().length > 0;

  function clearFilters() {
    setStatusFilter(defaultStatusFilter);
    setCategoryFilter("all");
    setCityFilter("all");
    setSearchQuery("");
  }

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.enabled)
        .map((category) => ({ label: category.name, value: category.id })),
    [categories],
  );

  const isDynamic = isDynamicCategory(form.categoryId);

  async function patchListing(
    id: string,
    patch: Partial<
      Pick<
        AdminListingRecord,
        | "status"
        | "isFeatured"
        | "title"
        | "description"
        | "price"
        | "city"
        | "condition"
        | "contactPhone"
        | "imageUrl"
        | "images"
        | "sellerName"
        | "categorySpecs"
        | "features"
        | "negotiable"
        | "emirate"
      >
    > & {
      rejectReason?: string;
    },
  ) {
    const session = getSessionUser();
    if (!session) return;
    setBusyId(id);
    try {
      const response = await adminFetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (response.ok && data.listing) {
        setListings((prev) =>
          prev.map((listing) => (listing.id === id ? data.listing : listing)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteListing(id: string) {
    const session = getSessionUser();
    if (!session) return;
    setBusyId(id);
    try {
      const response = await adminFetch(`/api/admin/listings/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setListings((prev) => prev.filter((listing) => listing.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }


  function startEdit(listing: AdminListingRecord) {
    const images =
      listing.images?.filter(Boolean) ??
      (listing.imageUrl ? [listing.imageUrl] : []);
    setEditingId(listing.id);
    setEditFieldErrors({});
    setGalleryUrlDraft("");
    setEditDraft({
      title: listing.title,
      description: listing.description ?? "",
      price: String(listing.price ?? ""),
      city: listing.city,
      condition: listing.condition ?? "used",
      contactPhone: listing.contactPhone ?? "",
      imageUrl: images[0] ?? listing.imageUrl ?? "",
      images,
      sellerName: listing.sellerName,
    });
  }

  function setEditImages(next: string[]) {
    const cleaned = next.filter(Boolean);
    setEditDraft((current) => ({
      ...current,
      images: cleaned,
      imageUrl: cleaned[0] ?? "",
    }));
  }

  function addEditImage(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    setEditDraft((current) => {
      if (current.images.includes(trimmed)) return current;
      const cleaned = [...current.images, trimmed];
      return {
        ...current,
        images: cleaned,
        imageUrl: cleaned[0] ?? "",
      };
    });
  }

  async function saveEdit(
    listing: AdminListingRecord,
    formElement?: HTMLFormElement | null,
  ) {
    const dynamic = isDynamicCategory(listing.categoryId);
    let title = editDraft.title.trim();
    let description = editDraft.description.trim();
    let price = Number(editDraft.price);
    let city = editDraft.city.trim();
    let condition = editDraft.condition as AdminListingRecord["condition"];
    let contactPhone = editDraft.contactPhone.trim() || undefined;
    let emirate: string | undefined;
    let categorySpecs = listing.categorySpecs;
    let features = listing.features;
    let negotiable = listing.negotiable;

    if (dynamic && formElement) {
      const formData = new FormData(formElement);
      if (!String(formData.get("description") ?? "").trim() && description) {
        formData.set("description", description);
      }
      if (!String(formData.get("price") ?? "").trim()) {
        formData.set("price", String(price || listing.price));
      }
      const parsed = parseCategoryForm(formData, listing.categoryId);
      const submittedPrice = Number(formData.get("price") ?? listing.price);
      if (!Number.isFinite(submittedPrice) || submittedPrice <= 0) {
        setEditFieldErrors({ price: "اكتب سعراً صحيحاً." });
        window.alert("السعر مطلوب لحفظ التعديل.");
        return;
      }
      // Admin edit is corrective: accept partial specs and merge onto the listing.
      // Surface field errors as hints only when the admin typed an invalid number.
      const hintErrors: CategoryFieldErrors = {};
      for (const [key, message] of Object.entries(parsed.errors)) {
        if (key === "price" || key === "title" || key === "description") continue;
        const submitted = String(formData.get(`spec_${key}`) ?? "").trim();
        if (submitted && message) hintErrors[key] = message;
      }
      if (Object.keys(hintErrors).length > 0) {
        setEditFieldErrors(hintErrors);
        window.alert("راجع القيم غير الصحيحة في حقول القسم.");
        return;
      }
      setEditFieldErrors({});
      title = parsed.title.trim() || listing.title;
      description =
        String(formData.get("description") ?? "").trim() || description;
      price = submittedPrice;
      city = parsed.city || city || listing.city;
      condition = parsed.condition || condition;
      emirate = parsed.emirate || listing.emirate;
      categorySpecs = {
        ...(listing.categorySpecs ?? {}),
        ...parsed.categorySpecs,
      };
      features = parsed.features.length ? parsed.features : listing.features;
      negotiable = parsed.negotiable ?? listing.negotiable;
      contactPhone =
        String(formData.get("contact") ?? contactPhone ?? "").trim() ||
        undefined;
    } else if (!title || !Number.isFinite(price) || price <= 0) {
      window.alert("العنوان والسعر مطلوبان.");
      return;
    }

    const images = editDraft.images.filter(Boolean);
    await patchListing(listing.id, {
      title,
      description,
      price,
      city,
      emirate,
      condition,
      contactPhone,
      imageUrl: images[0] || editDraft.imageUrl.trim() || undefined,
      images,
      sellerName: editDraft.sellerName.trim() || undefined,
      categorySpecs,
      features,
      negotiable,
    });
    setEditingId(null);
    setGalleryUrlDraft("");
  }

  async function uploadListingImage(file: File): Promise<string | null> {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "listings");
    const response = await fetch("/api/uploads", {
      method: "POST",
      credentials: "include",
      body,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.url === "string" ? data.url : null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSessionUser();
    if (!session) return;

    const formData = new FormData(event.currentTarget);
    formData.set("categoryId", form.categoryId);
    formData.set("status", form.status);
    formData.set("description", form.description);
    if (!isDynamic) {
      formData.set("title", form.title);
      formData.set("price", form.price);
      formData.set("city", form.city);
      formData.set("condition", form.condition);
    } else {
      // Ensure price/description always present for parser
      formData.set("price", String(formData.get("price") ?? form.price));
      formData.set(
        "description",
        String(formData.get("description") ?? form.description),
      );
    }

    const parsed = parseCategoryForm(formData, form.categoryId);
    const nextErrors: CategoryFieldErrors = { ...parsed.errors };

    if (!form.categoryId) {
      nextErrors.category = "اختر القسم المناسب للإعلان.";
    }

    if (!isDynamic) {
      const price = Number(form.price);
      if (!form.title.trim()) nextErrors.title = "العنوان مطلوب.";
      if (!form.city.trim()) nextErrors.city = "المدينة مطلوبة.";
      if (!Number.isFinite(price) || price <= 0) {
        nextErrors.price = "اكتب سعراً صحيحاً.";
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setCreateError("أكمل الحقول المطلوبة للقسم المختار.");
      return;
    }

    const price = Number(formData.get("price") ?? form.price);
    const title = isDynamic ? parsed.title : form.title.trim();
    const city = isDynamic ? parsed.city : form.city;
    const description = String(
      formData.get("description") ?? form.description,
    ).trim();
    const contactPhone = String(
      formData.get("contact") ?? form.contactPhone,
    ).trim();

    setCreating(true);
    setCreateError("");
    try {
      const response = await adminFetch("/api/admin/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          create: {
            title,
            description,
            categoryId: form.categoryId,
            city,
            emirate: parsed.emirate,
            area:
              typeof parsed.categorySpecs.community === "string"
                ? parsed.categorySpecs.community
                : undefined,
            price,
            condition: parsed.condition,
            status: form.status,
            isFeatured: form.isFeatured,
            sellerName: form.sellerName.trim() || undefined,
            contactPhone: contactPhone || undefined,
            imageUrl: form.imageUrl.trim() || undefined,
            images: form.imageUrl.trim() ? [form.imageUrl.trim()] : undefined,
            categorySpecs: isDynamic ? parsed.categorySpecs : undefined,
            features: parsed.features.length > 0 ? parsed.features : undefined,
            negotiable: parsed.negotiable,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCreateError("تعذر حفظ الإعلان. حاول مرة أخرى.");
        return;
      }
      if (data.listings) {
        setListings(data.listings);
      } else if (data.listing) {
        setListings((prev) => [data.listing, ...prev]);
      }
      setForm((current) => ({
        ...emptyForm,
        categoryId: current.categoryId,
        city: current.city,
        status: current.status,
      }));
      setFieldErrors({});
      setFormKey((key) => key + 1);
    } catch {
      setCreateError("تعذر الاتصال بالخادم.");
    } finally {
      setCreating(false);
    }
  }

  async function handleShowcaseAction(action: "publish" | "hide" | "remove") {
    const session = getSessionUser();
    if (!session) return;
    if (action === "remove") {
      const confirmed = window.confirm(
        "حذف كل إعلانات المعرض التجريبي؟ الإعلانات الحقيقية لن تُمس.",
      );
      if (!confirmed) return;
    }
    setShowcaseBusy(action);
    setShowcaseMessage("");
    try {
      const response = await adminFetch("/api/admin/listings/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setShowcaseMessage("تعذر تنفيذ العملية.");
        return;
      }
      if (Array.isArray(data.listings)) setListings(data.listings);
      setShowcaseMessage(
        action === "publish"
          ? "تم نشر المعرض التجريبي."
          : action === "hide"
            ? "تم إخفاء المعرض التجريبي."
            : "تم حذف المعرض التجريبي.",
      );
    } catch {
      setShowcaseMessage("تعذر الاتصال بالخادم.");
    } finally {
      setShowcaseBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">راجع الإعلانات واعتمد أو عدّل مباشرة.</p>
        <Button
          onClick={() => setShowTools((open) => !open)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {showTools ? "إخفاء الأدوات" : "إضافة إعلان / أدوات"}
        </Button>
      </div>

      {showTools ? (
        <>
      <Card className="p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">معرض سوقنا التجريبي</h2>
        <p className="mt-2 text-xs leading-6 text-muted">
          إعلانات تجريبية للاختبار. يمكن إخفاؤها أو حذفها دون تعديل الشيفرة.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            loading={showcaseBusy === "publish"}
            onClick={() => void handleShowcaseAction("publish")}
            size="sm"
            type="button"
            variant="primary"
          >
            نشر / تحديث المعرض
          </Button>
          <Button
            loading={showcaseBusy === "hide"}
            onClick={() => void handleShowcaseAction("hide")}
            size="sm"
            type="button"
            variant="secondary"
          >
            إخفاء المعرض
          </Button>
          <Button
            loading={showcaseBusy === "remove"}
            onClick={() => void handleShowcaseAction("remove")}
            size="sm"
            type="button"
            variant="ghost"
          >
            حذف المعرض
          </Button>
        </div>
        {showcaseMessage ? (
          <p className="mt-3 text-xs font-medium text-muted">{showcaseMessage}</p>
        ) : null}
      </Card>

      <Card className="p-5" variant="flat">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="plus" size={16} />
            إضافة إعلان
          </h2>
          <Button href="/listings/new" size="sm" variant="ghost">
            النموذج الكامل للموقع
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          اختر القسم لتظهر حقوله الخاصة بنفس منطق صفحة إضافة الإعلان.
        </p>

        <form className="mt-4 grid gap-4" key={formKey} onSubmit={handleCreate}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="القسم"
              name="categoryId"
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }));
                setFieldErrors({});
                setCreateError("");
              }}
              options={
                categoryOptions.length > 0
                  ? categoryOptions
                  : [{ label: "جاري التحميل...", value: "" }]
              }
              value={form.categoryId}
            />
            <Select
              label="حالة النشر"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              options={publishStatusOptions}
              value={form.status}
            />
          </div>

          {fieldErrors.category ? (
            <FormMessage variant="error">
              {String(fieldErrors.category)}
            </FormMessage>
          ) : null}

          {isDynamic ? (
            <CategoryFieldsForm
              categoryId={form.categoryId}
              errors={fieldErrors}
              heading="تفاصيل القسم"
              showContact
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="عنوان الإعلان"
                name="title"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="مثال: طقم كنب مودرن"
                value={form.title}
              />
              <Input
                label="السعر (د.إ)"
                inputMode="numeric"
                name="price"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                placeholder="85000"
                value={form.price}
              />
              <Select
                label="المدينة"
                name="city"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                options={cities.map((city) => ({
                  label: city.name,
                  value: city.name,
                }))}
                value={form.city}
              />
              <Select
                label="الحالة"
                name="condition"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
                options={conditionOptions}
                value={form.condition}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="الوصف"
                  name="description"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="تفاصيل تظهر في صفحة الإعلان"
                  rows={3}
                  value={form.description}
                />
              </div>
            </div>
          )}

          <Input
            label="اسم البائع (اختياري)"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sellerName: event.target.value,
              }))
            }
            placeholder="إدارة سوقنا"
            value={form.sellerName}
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="رابط صورة الغلاف (اختياري)"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://… أو ارفع ملفاً"
              value={form.imageUrl}
            />
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-xl)] border border-border bg-surface px-4 text-sm font-semibold text-ink">
              {uploadingImage ? "جاري الرفع…" : "رفع صورة"}
              <input
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setUploadingImage(true);
                  void uploadListingImage(file)
                    .then((url) => {
                      if (url) {
                        setForm((current) => ({ ...current, imageUrl: url }));
                      } else {
                        window.alert("تعذر رفع الصورة.");
                      }
                    })
                    .finally(() => setUploadingImage(false));
                }}
                type="file"
              />
            </label>
          </div>
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="mt-1 h-24 w-24 rounded-xl object-cover"
              src={form.imageUrl}
            />
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm text-ink">
            <label className="inline-flex items-center gap-2">
              <input
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              مميز
            </label>
          </div>

          {createError ? (
            <p className="text-sm font-medium text-error">{createError}</p>
          ) : null}

          <div>
            <Button loading={creating} type="submit" variant="primary">
              نشر الإعلان
            </Button>
          </div>
        </form>
      </Card>
        </>
      ) : null}

      <Card className="p-4" variant="flat">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              label="بحث في الإعلانات"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="العنوان، المعرّف، الرابط، البائع، الهاتف..."
              value={searchQuery}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              label="تصفية حسب الحالة"
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusFilterOptions}
              value={statusFilter}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              label="القسم"
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={categoryFilterOptions}
              value={categoryFilter}
            />
          </div>
          <div className="min-w-[140px]">
            <Select
              label="المدينة"
              onChange={(event) => setCityFilter(event.target.value)}
              options={cityFilterOptions}
              value={cityFilter}
            />
          </div>
          {pendingCount > 0 ? (
            <Button
              onClick={() => setStatusFilter("pending_review")}
              size="sm"
              type="button"
              variant={statusFilter === "pending_review" ? "primary" : "ghost"}
            >
              قيد المراجعة ({pendingCount})
            </Button>
          ) : null}
          {hasActiveFilters ? (
            <Button onClick={clearFilters} size="sm" type="button" variant="ghost">
              مسح الفلاتر
            </Button>
          ) : null}
          <p className="pb-2 text-xs text-muted">
            <Icon className="ms-1 inline" name="package" size={14} />
            {statusFilter === "marketplace"
              ? `${listingCountLabel(filtered.length, locale)} في السوق`
              : hasActiveFilters
                ? `${filtered.length} من ${listings.length}`
                : listingCountLabel(filtered.length, locale)}
            {marketplaceCount > 0 && statusFilter !== "marketplace" ? (
              <span className="ms-2">· سوق: {marketplaceCount}</span>
            ) : null}
          </p>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          {listings.length > 0 ? (
            <>
              <p className="text-sm text-muted">
                لا توجد إعلانات مطابقة لهذه التصفية
                {statusFilter === "pending_review"
                  ? " — لا يوجد شيء بانتظار المراجعة حالياً."
                  : "."}
              </p>
              <p className="mt-2 text-xs text-muted">
                إعلانات السوق الحقيقية: {marketplaceCount} · المخزون كامل:{" "}
                {listings.length}
              </p>
              <Button
                className="mt-4"
                onClick={clearFilters}
                size="sm"
                type="button"
                variant="secondary"
              >
                عرض إعلانات السوق
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">لا توجد إعلانات في المخزون بعد.</p>
          )}
        </Card>
      ) : (
        <div className="admin-boxes__grid">
        {filtered.map((listing) => (
          <Card
            key={listing.id}
            className={`p-5${editingId === listing.id ? " admin-boxes__card--wide" : ""}`}
            variant="flat"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingId === listing.id ? (
                  <form
                    className="grid gap-3"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveEdit(listing, event.currentTarget);
                    }}
                  >
                    {isDynamicCategory(listing.categoryId) ? (
                      <CategoryFieldsForm
                        key={`edit-${listing.id}`}
                        categoryId={listing.categoryId}
                        defaults={{
                          categorySpecs: listing.categorySpecs,
                          condition: listing.condition,
                          contactPhone: listing.contactPhone,
                          description: listing.description,
                          features: listing.features,
                          negotiable: listing.negotiable,
                          price: listing.price,
                        }}
                        errors={editFieldErrors}
                        heading="تفاصيل القسم"
                        showContact
                      />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="العنوان"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          value={editDraft.title}
                        />
                        <Input
                          label="السعر"
                          inputMode="numeric"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              price: event.target.value,
                            }))
                          }
                          value={editDraft.price}
                        />
                        <Select
                          label="المدينة"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              city: event.target.value,
                            }))
                          }
                          options={cities.map((city) => ({
                            label: city.name,
                            value: city.name,
                          }))}
                          value={editDraft.city}
                        />
                        <Select
                          label="الحالة"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              condition: event.target.value,
                            }))
                          }
                          options={conditionOptions}
                          value={editDraft.condition}
                        />
                        <Input
                          label="هاتف التواصل"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              contactPhone: event.target.value,
                            }))
                          }
                          value={editDraft.contactPhone}
                        />
                        <Input
                          label="اسم البائع"
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              sellerName: event.target.value,
                            }))
                          }
                          value={editDraft.sellerName}
                        />
                        <div className="sm:col-span-2">
                          <Textarea
                            label="الوصف"
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            rows={3}
                            value={editDraft.description}
                          />
                        </div>
                      </div>
                    )}

                    {isDynamicCategory(listing.categoryId) ? (
                      <Input
                        label="اسم البائع"
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            sellerName: event.target.value,
                          }))
                        }
                        value={editDraft.sellerName}
                      />
                    ) : null}

                    <div className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-surface/60 p-3">
                      <p className="text-sm font-semibold text-ink">
                        معرض الصور
                      </p>
                      {editDraft.images.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {editDraft.images.map((url, index) => (
                            <div
                              className="relative size-20 overflow-hidden rounded-xl border border-border bg-surface"
                              key={`${url}-${index}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                alt=""
                                className="size-full object-cover"
                                src={url}
                              />
                              {index === 0 ? (
                                <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-1 py-0.5 text-center text-[10px] font-bold text-white">
                                  غلاف
                                </span>
                              ) : null}
                              <div className="absolute inset-x-0 top-0 flex justify-between gap-0.5 p-0.5">
                                {index > 0 ? (
                                  <button
                                    className="rounded bg-surface/90 px-1 text-[10px] font-bold text-ink"
                                    onClick={() =>
                                      setEditImages([
                                        url,
                                        ...editDraft.images.filter(
                                          (item) => item !== url,
                                        ),
                                      ])
                                    }
                                    type="button"
                                  >
                                    غلاف
                                  </button>
                                ) : (
                                  <span />
                                )}
                                <button
                                  className="rounded bg-surface/90 px-1 text-[10px] font-bold text-red-700"
                                  onClick={() =>
                                    setEditImages(
                                      editDraft.images.filter(
                                        (item) => item !== url,
                                      ),
                                    )
                                  }
                                  type="button"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">لا توجد صور بعد.</p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                        <Input
                          label="إضافة رابط صورة"
                          onChange={(event) =>
                            setGalleryUrlDraft(event.target.value)
                          }
                          placeholder="https://…"
                          value={galleryUrlDraft}
                        />
                        <Button
                          onClick={() => {
                            addEditImage(galleryUrlDraft);
                            setGalleryUrlDraft("");
                          }}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          إضافة
                        </Button>
                        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-xl)] border border-border bg-surface px-4 text-sm font-semibold text-ink">
                          {uploadingImage ? "جاري الرفع…" : "رفع"}
                          <input
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingImage}
                            multiple
                            onChange={(event) => {
                              const files = Array.from(
                                event.target.files ?? [],
                              );
                              event.target.value = "";
                              if (!files.length) return;
                              setUploadingImage(true);
                              void Promise.all(
                                files.map((file) => uploadListingImage(file)),
                              )
                                .then((urls) => {
                                  const next = urls.filter(
                                    (url): url is string => Boolean(url),
                                  );
                                  if (!next.length) return;
                                  setEditDraft((current) => {
                                    const cleaned = [
                                      ...current.images,
                                      ...next.filter(
                                        (url) =>
                                          !current.images.includes(url),
                                      ),
                                    ];
                                    return {
                                      ...current,
                                      images: cleaned,
                                      imageUrl: cleaned[0] ?? "",
                                    };
                                  });
                                })
                                .finally(() => setUploadingImage(false));
                            }}
                            type="file"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        loading={busyId === listing.id}
                        size="sm"
                        type="submit"
                        variant="primary"
                      >
                        حفظ التعديل
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingId(null);
                          setEditFieldErrors({});
                          setGalleryUrlDraft("");
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      {listing.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="size-14 shrink-0 rounded-xl object-cover"
                          src={listing.imageUrl}
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold text-ink">{listing.title}</p>
                        <p className="mt-1 text-xs text-muted">{listing.slug}</p>
                        <p className="mt-2 text-sm">
                          {listing.sellerName} — {listing.city}
                        </p>
                      </div>
                    </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={listingBadgeVariant(listing.status)}>
                    {listingStatusLabels[listing.status]}
                  </Badge>
                  {listing.isFeatured ? (
                    <Badge variant="featured">مميّز</Badge>
                  ) : null}
                  {listing.isDemo || listing.source === "SOOQNA_SHOWCASE" ? (
                    <Badge variant="demo">إعلان تجريبي</Badge>
                  ) : null}
                </div>
                  </>
                )}
              </div>
              {editingId === listing.id ? null : (
              <div className="text-start">
                <CurrencyAmount amount={listing.price} size="lg" />
                <p className="mt-1 text-xs text-muted">
                    {new Date(listing.postedAt).toLocaleDateString(intlLocale(locale))}
                </p>
              </div>
              )}
            </div>
            {editingId === listing.id ? null : (
            <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => startEdit(listing)}
                    size="sm"
                    variant="secondary"
                  >
                    تعديل
                  </Button>
              {listing.status === "pending_review" ||
              listing.status === "rejected" ||
              listing.status === "draft" ? (
                <Button
                  loading={busyId === listing.id}
                  onClick={() => patchListing(listing.id, { status: "active" })}
                  size="sm"
                  variant="primary"
                >
                  اعتماد
                </Button>
              ) : null}
              <Button
                onClick={() =>
                  setOpenRowActions((current) =>
                    current === listing.id ? null : listing.id,
                  )
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                {openRowActions === listing.id ? "إخفاء" : "المزيد"}
              </Button>
              {openRowActions === listing.id ? (
                <>
              {listing.status !== "rejected" ? (
                <Button
                  loading={busyId === listing.id}
                  onClick={() => {
                    const reason = window.prompt("سبب الرفض (اختياري)")?.trim();
                    void patchListing(listing.id, {
                      status: "rejected",
                      rejectReason: reason || undefined,
                    });
                  }}
                  size="sm"
                  variant="ghost"
                >
                  رفض
                </Button>
              ) : null}
              <Button
                loading={busyId === listing.id}
                onClick={() =>
                  patchListing(listing.id, {
                    isFeatured: !listing.isFeatured,
                  })
                }
                size="sm"
                variant="secondary"
              >
                {listing.isFeatured ? "إلغاء التمييز" : "تمييز"}
              </Button>
              <Button
                href={`/listings/${listing.slug}`}
                size="sm"
                variant="ghost"
              >
                عرض
              </Button>
              <Button
                loading={busyId === listing.id}
                onClick={() => {
                  const ok = window.confirm(
                    `حذف الإعلان «${listing.title}» نهائياً من السوق؟`,
                  );
                  if (!ok) return;
                  void deleteListing(listing.id);
                }}
                size="sm"
                variant="ghost"
              >
                حذف
              </Button>
                </>
              ) : null}
            </div>
            )}
          </Card>
        ))}
        </div>
      )}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
