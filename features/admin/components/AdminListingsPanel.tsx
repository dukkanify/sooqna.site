"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  AdminCategoryRecord,
  AdminListingRecord,
  ListingStatus,
} from "@/types";
import { isDynamicCategory } from "@/shared/constants/category-fields";
import { listingStatusLabels } from "@/shared/constants/listingStatuses";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import {
  CategoryFieldsForm,
  type CategoryFieldErrors,
} from "@/features/listings/components/add-listing/CategoryFieldsForm";
import { parseCategoryForm } from "@/features/listings/components/add-listing/category-form-utils";
import { AdminListingImageGallery } from "@/features/admin/components/AdminListingImageGallery";
import { sanitizeListingMediaFields } from "@/shared/listings/durable-media";
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
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";
import { areasForEmirate } from "@/shared/constants/emirate-areas";
import {
  UAE_EMIRATE_NAMES,
  canonicalizeEmirate,
  extractAreaLabel,
  listingArea,
  listingEmirate,
  listingMatchesAreaFilter,
  listingMatchesEmirateFilter,
} from "@/shared/listings/uae-emirate";
import { useLocale } from "@/shared/i18n/useLocale";

const statusFilterOptions: { label: string; value: string }[] = [
  { label: "إعلانات السوق", value: "marketplace" },
  { label: "الكل (سوق + live-mkt + تجريبي)", value: "all" },
  { label: "المميزة فقط", value: "featured" },
  { label: listingStatusLabels.pending_review, value: "pending_review" },
  { label: listingStatusLabels.active, value: "active" },
  { label: listingStatusLabels.reserved, value: "reserved" },
  { label: listingStatusLabels.sold, value: "sold" },
  { label: listingStatusLabels.rejected, value: "rejected" },
  { label: listingStatusLabels.draft, value: "draft" },
  { label: listingStatusLabels.expired, value: "expired" },
  { label: "تجريبي فقط", value: "demo" },
];

function isFeaturedWindowLive(
  listing: Pick<AdminListingRecord, "isFeatured" | "featuredUntil">,
  nowMs = Date.now(),
): boolean {
  if (!listing.isFeatured) return false;
  if (!listing.featuredUntil) return true;
  const until = Date.parse(listing.featuredUntil);
  if (Number.isNaN(until)) return true;
  return until > nowMs;
}

function featuredUntilLabel(
  featuredUntil: string | undefined,
  locale: Parameters<typeof intlLocale>[0],
): string {
  if (!featuredUntil) return "مفتوح المدة";
  const until = Date.parse(featuredUntil);
  if (Number.isNaN(until)) return "مفتوح المدة";
  return new Date(until).toLocaleString(intlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isDemoAdminListing(listing: AdminListingRecord): boolean {
  return listing.isDemo === true || listing.source === "SOOQNA_SHOWCASE";
}

/** Real marketplace rows — excludes showcase, fixtures, and live-catalog seed. */
function isMarketplaceAdminListing(listing: AdminListingRecord): boolean {
  if (isDemoAdminListing(listing)) return false;
  if (listing.isFixture === true) return false;
  if (isConfirmedFixtureListing(listing)) return false;
  if (
    listing.source === "SOOQNA_LIVE_MARKETPLACE" ||
    listing.id.startsWith("live-mkt-")
  ) {
    return false;
  }
  return true;
}

function AdminListingThumb({
  size = "md",
  src,
}: {
  size?: "sm" | "md";
  src?: string;
}) {
  const [failed, setFailed] = useState(!src?.trim());
  const box = size === "sm" ? "size-10" : "size-14";
  if (failed) {
    return (
      <div
        className={`grid ${box} shrink-0 place-items-center rounded-lg bg-surface-muted text-[9px] font-semibold text-muted`}
      >
        بلا صورة
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={`${box} shrink-0 rounded-lg bg-surface-muted object-cover`}
      onError={() => setFailed(true)}
      src={src}
    />
  );
}

/** Compact listing number for the desk table (prefer trailing digits). */
function listingNumberLabel(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-6);
  const cleaned = id.replace(/^(local-|admin-|showcase-)/, "");
  return cleaned.length > 12 ? cleaned.slice(-10) : cleaned;
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
  emirate: "دبي",
  area: "",
  price: "",
  condition: "used",
  status: "active",
  sellerName: "",
  contactPhone: "",
  imageUrl: "",
  images: [] as string[],
  isFeatured: false,
};

const emirateFormOptions = UAE_EMIRATE_NAMES.map((name) => ({
  label: name,
  value: name,
}));

function areaFormOptions(emirate: string, extra?: string) {
  const known = [...areasForEmirate(emirate)];
  if (extra?.trim() && !known.includes(extra.trim())) {
    known.push(extra.trim());
  }
  return [
    { label: "كل الإمارة / بدون منطقة محددة", value: "" },
    ...known
      .sort((a, b) => a.localeCompare(b, "ar"))
      .map((area) => ({ label: area, value: area })),
  ];
}

export function AdminListingsPanel() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<AdminListingRecord[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "marketplace",
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams.get("category") ?? "all",
  );
  const [emirateFilter, setEmirateFilter] = useState(
    () => searchParams.get("emirate") ?? searchParams.get("city") ?? "all",
  );
  const [areaFilter, setAreaFilter] = useState(
    () => searchParams.get("area") ?? "all",
  );
  const [deskMessage, setDeskMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [showcaseBusy, setShowcaseBusy] = useState<string | null>(null);
  const [showcaseMessage, setShowcaseMessage] = useState("");
  const [liveCatalogBusy, setLiveCatalogBusy] = useState(false);
  const [liveCatalogMessage, setLiveCatalogMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    price: "",
    emirate: "دبي",
    area: "",
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
  const [editImagesTouched, setEditImagesTouched] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [openRowActions, setOpenRowActions] = useState<string | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Cookie session is enough — GET-only desk load (no localStorage POST sync).
    const timeoutId = window.setTimeout(() => {
      adminFetch("/api/admin/listings")
        .then((res) => res.json())
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

  function openToolsPanel() {
    setShowTools(true);
    window.setTimeout(() => {
      toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return listings
      .filter((listing) => {
        const demo = isDemoAdminListing(listing);
        const marketplace = isMarketplaceAdminListing(listing);
        if (statusFilter === "demo") return demo;
        if (statusFilter === "marketplace") return marketplace;
        if (statusFilter === "all") return true;
        if (statusFilter === "featured") {
          return marketplace && isFeaturedWindowLive(listing);
        }
        // Status filters show real marketplace ads only (not showcase/fixtures).
        return listing.status === statusFilter && marketplace;
      })
      .filter((listing) =>
        categoryFilter === "all" ? true : listing.categoryId === categoryFilter,
      )
      .filter((listing) => listingMatchesEmirateFilter(listing, emirateFilter))
      .filter((listing) => listingMatchesAreaFilter(listing, areaFilter))
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
  }, [listings, statusFilter, categoryFilter, emirateFilter, areaFilter, searchQuery]);

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

  const emirateFilterOptions = useMemo(
    () => [
      { label: "كل الإمارات", value: "all" },
      ...UAE_EMIRATE_NAMES.map((name) => ({ label: name, value: name })),
    ],
    [],
  );

  const areaFilterOptions = useMemo(() => {
    if (emirateFilter === "all") {
      return [{ label: "كل المناطق", value: "all" }];
    }
    const known = areasForEmirate(emirateFilter);
    const fromListings = listings
      .filter((listing) => listingMatchesEmirateFilter(listing, emirateFilter))
      .map((listing) => listingArea(listing))
      .filter((area): area is string => Boolean(area));
    const merged = [...new Set([...known, ...fromListings])].sort((a, b) =>
      a.localeCompare(b, "ar"),
    );
    return [
      { label: "كل مناطق الإمارة", value: "all" },
      ...merged.map((area) => ({ label: area, value: area })),
    ];
  }, [emirateFilter, listings]);

  const pendingCount = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.status === "pending_review" &&
          isMarketplaceAdminListing(listing),
      ).length,
    [listings],
  );

  const marketplaceCount = useMemo(
    () => listings.filter((listing) => isMarketplaceAdminListing(listing)).length,
    [listings],
  );

  const featuredCount = useMemo(
    () =>
      listings.filter(
        (listing) =>
          isMarketplaceAdminListing(listing) && isFeaturedWindowLive(listing),
      ).length,
    [listings],
  );

  const defaultStatusFilter = "marketplace";

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (statusFilter !== defaultStatusFilter) params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (emirateFilter !== "all") params.set("emirate", emirateFilter);
    if (areaFilter !== "all") params.set("area", areaFilter);
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (next !== current) router.replace(next);
    // Sync URL from filter state only — searchParams identity omitted on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL mirror
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    emirateFilter,
    areaFilter,
    pathname,
    router,
  ]);

  const hasActiveFilters =
    statusFilter !== defaultStatusFilter ||
    categoryFilter !== "all" ||
    emirateFilter !== "all" ||
    areaFilter !== "all" ||
    searchQuery.trim().length > 0;

  function clearFilters() {
    setStatusFilter(defaultStatusFilter);
    setCategoryFilter("all");
    setEmirateFilter("all");
    setAreaFilter("all");
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
        | "area"
      >
    > & {
      rejectReason?: string;
    },
  ) {
    setBusyId(id);
    setDeskMessage("");
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
        const next = sanitizeListingMediaFields(
          data.listing as AdminListingRecord,
        );
        setListings((prev) =>
          prev.map((listing) => {
            if (listing.id !== id) return listing;
            // Status-only / field patches: never reintroduce ephemeral media into the card.
            return {
              ...listing,
              ...next,
              imageUrl: next.imageUrl ?? listing.imageUrl,
              images: next.images ?? listing.images,
              views:
                typeof next.views === "number" && next.views > 0
                  ? next.views
                  : (listing.views ?? next.views ?? 0),
            };
          }),
        );
      } else {
        setDeskMessage(
          typeof data?.message === "string" && data.message.trim()
            ? data.message
            : "تعذر حفظ حالة الإعلان. أعد المحاولة.",
        );
      }
    } catch {
      setDeskMessage("تعذر الاتصال بالخادم أثناء حفظ الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteListing(id: string) {
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
    const media = sanitizeListingMediaFields(listing);
    const images =
      media.images?.filter(Boolean) ??
      (media.imageUrl ? [media.imageUrl] : []);
    const emirate =
      listingEmirate(listing) ??
      canonicalizeEmirate(listing.city) ??
      "دبي";
    setEditingId(listing.id);
    setEditImagesTouched(false);
    setEditFieldErrors({});
    setEditDraft({
      title: listing.title,
      description: listing.description ?? "",
      price: String(listing.price ?? ""),
      emirate,
      area: listingArea(listing) ?? "",
      condition: listing.condition ?? "used",
      contactPhone: listing.contactPhone ?? "",
      imageUrl: images[0] ?? "",
      images,
      sellerName: listing.sellerName,
    });
  }

  function setEditImages(next: string[]) {
    const cleaned = next.filter(Boolean);
    setEditImagesTouched(true);
    setEditDraft((current) => ({
      ...current,
      images: cleaned,
      imageUrl: cleaned[0] ?? "",
    }));
  }

  function setCreateImages(next: string[]) {
    const cleaned = next.filter(Boolean);
    setForm((current) => ({
      ...current,
      images: cleaned,
      imageUrl: cleaned[0] ?? "",
    }));
  }

  async function saveEdit(
    listing: AdminListingRecord,
    formElement?: HTMLFormElement | null,
  ) {
    const dynamic = isDynamicCategory(listing.categoryId);
    let title = editDraft.title.trim();
    let description = editDraft.description.trim();
    let price = Number(editDraft.price);
    let emirate =
      canonicalizeEmirate(editDraft.emirate) || editDraft.emirate.trim() || "دبي";
    let area = editDraft.area.trim() || undefined;
    let city = area ? `${emirate} — ${area}` : emirate;
    let condition = editDraft.condition as AdminListingRecord["condition"];
    let contactPhone = editDraft.contactPhone.trim() || undefined;
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
      emirate =
        canonicalizeEmirate(parsed.emirate) ||
        canonicalizeEmirate(parsed.city) ||
        emirate ||
        listingEmirate(listing) ||
        "دبي";
      area =
        (typeof parsed.categorySpecs.community === "string"
          ? parsed.categorySpecs.community.trim()
          : "") ||
        extractAreaLabel(parsed.city, emirate) ||
        area;
      city = area ? `${emirate} — ${area}` : parsed.city || emirate;
      condition = parsed.condition || condition;
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
    } else if (!emirate.trim()) {
      window.alert("الإمارة مطلوبة.");
      return;
    }

    const images = editDraft.images.filter(Boolean);
    await patchListing(listing.id, {
      title,
      description,
      price,
      city,
      emirate,
      // Empty string clears a previously saved area.
      area: area ?? "",
      condition,
      contactPhone,
      // Only touch media when the admin changed the gallery — slim list rows
      // often omit images, and sending [] would wipe durable photos.
      ...(editImagesTouched
        ? {
            imageUrl: images[0] || "",
            images,
          }
        : {}),
      sellerName: editDraft.sellerName.trim() || undefined,
      categorySpecs,
      features,
      negotiable,
    });
    setEditingId(null);
    setEditImagesTouched(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("categoryId", form.categoryId);
    formData.set("status", form.status);
    formData.set("description", form.description);
    if (!isDynamic) {
      formData.set("title", form.title);
      formData.set("price", form.price);
      formData.set("city", form.emirate);
      formData.set("emirate", form.emirate);
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
      if (!form.emirate.trim()) nextErrors.city = "الإمارة مطلوبة.";
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
    const emirate = isDynamic
      ? canonicalizeEmirate(parsed.emirate) ||
        canonicalizeEmirate(parsed.city) ||
        form.emirate
      : canonicalizeEmirate(form.emirate) || form.emirate;
    const area = isDynamic
      ? (typeof parsed.categorySpecs.community === "string"
          ? parsed.categorySpecs.community.trim()
          : "") ||
        extractAreaLabel(parsed.city, emirate) ||
        form.area.trim() ||
        undefined
      : form.area.trim() || undefined;
    const city = area ? `${emirate} — ${area}` : emirate;
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
            emirate,
            area,
            price,
            condition: parsed.condition,
            status: form.status,
            isFeatured: form.isFeatured,
            sellerName: form.sellerName.trim() || undefined,
            contactPhone: contactPhone || undefined,
            imageUrl: form.images[0] || form.imageUrl.trim() || undefined,
            images:
              form.images.length > 0
                ? form.images
                : form.imageUrl.trim()
                  ? [form.imageUrl.trim()]
                  : undefined,
            categorySpecs: isDynamic ? parsed.categorySpecs : undefined,
            features: parsed.features.length > 0 ? parsed.features : undefined,
            negotiable: parsed.negotiable,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const code = String(data?.error ?? "");
        if (response.status === 401 || response.status === 403) {
          setCreateError("انتهت صلاحية الجلسة. حدّث الصفحة وسجّل الدخول مجدداً.");
        } else if (code === "INVALID_INPUT" || code === "INVALID_PRICE") {
          setCreateError("تحقق من العنوان والقسم والإمارة والسعر ثم أعد المحاولة.");
        } else {
          setCreateError("تعذر حفظ الإعلان. حاول مرة أخرى.");
        }
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
        emirate: current.emirate,
        area: "",
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

  async function handleRemoveLiveCatalog() {
    const confirmed = window.confirm(
      "حذف كل إعلانات كتالوج live-mkt التجريبية من قاعدة البيانات؟ إعلانات المستخدمين لن تُمس.",
    );
    if (!confirmed) return;
    setLiveCatalogBusy(true);
    setLiveCatalogMessage("");
    try {
      const response = await adminFetch("/api/admin/listings/live-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLiveCatalogMessage("تعذر حذف كتالوج البذور.");
        return;
      }
      if (Array.isArray(data.listings)) setListings(data.listings);
      const count = typeof data.affected === "number" ? data.affected : 0;
      setLiveCatalogMessage(`تم حذف ${count} إعلان بذور live-mkt.`);
    } catch {
      setLiveCatalogMessage("تعذر الاتصال بالخادم.");
    } finally {
      setLiveCatalogBusy(false);
    }
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-listings-toolbar">
        <p className="text-sm text-muted">
          راجع الإعلانات واعتمد أو عدّل أو ميّز مباشرة — النصوص واضحة على الجوال
          وسطح المكتب.
        </p>
        <div className="admin-listings-toolbar__actions">
          <Button href="/featured" size="sm" variant="secondary">
            صفحة المميزة على الموقع
          </Button>
          <Button
            onClick={() => {
              if (showTools) {
                setShowTools(false);
                return;
              }
              openToolsPanel();
            }}
            size="sm"
            type="button"
            variant="primary"
          >
            {showTools ? "إخفاء الأدوات" : "إضافة إعلان / أدوات"}
          </Button>
        </div>
      </div>

      <Card className="admin-listings-featured-help p-4" variant="flat">
        <h2 className="text-sm font-semibold text-ink">كيف نميّز الإعلان المميز؟</h2>
        <ul className="mt-2 grid gap-1.5 text-xs leading-6 text-muted sm:grid-cols-2">
          <li>
            شارة ذهبية <strong className="text-ink">مميّز</strong> على بطاقة
            الإعلان وصفحته.
          </li>
          <li>
            يظهر في{" "}
            <Link className="font-semibold text-secondary underline" href="/featured">
              /featured
            </Link>{" "}
            وفي شريط المميزة بالرئيسية.
          </li>
          <li>أولوية ظهور أعلى في نتائج البحث والتصفح أثناء مدة الباقة.</li>
          <li>
            من هنا: زر <strong className="text-ink">تمييز</strong> يفعّل الباقة
            لمدة إعدادات الأدمن، أو{" "}
            <Link
              className="font-semibold text-secondary underline"
              href="/admin/settings"
            >
              ضبط الرسوم والأيام
            </Link>
            .
          </li>
        </ul>
      </Card>

      {showTools ? (
        <div className="grid gap-4" id="admin-listings-tools" ref={toolsRef}>
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
        <h2 className="text-sm font-semibold text-ink">كتالوج البذور live-mkt</h2>
        <p className="mt-2 text-xs leading-6 text-muted">
          مخزون تجريبي قديم في قاعدة البيانات. الموقع العام يخفيه تلقائياً؛ استخدم
          الحذف لتنظيف Neon. إعادة النشر تتطلب{" "}
          <code className="text-[11px]">SOOQNA_LIVE_CATALOG=true</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            loading={liveCatalogBusy}
            onClick={() => void handleRemoveLiveCatalog()}
            size="sm"
            type="button"
            variant="ghost"
          >
            حذف كتالوج live-mkt
          </Button>
        </div>
        {liveCatalogMessage ? (
          <p className="mt-3 text-xs font-medium text-muted">
            {liveCatalogMessage}
          </p>
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
                label="الإمارة"
                name="emirate"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    emirate: event.target.value,
                    area: "",
                  }))
                }
                options={emirateFormOptions}
                value={form.emirate}
              />
              <Select
                label="المنطقة"
                name="area"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    area: event.target.value,
                  }))
                }
                options={areaFormOptions(form.emirate)}
                value={form.area}
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

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-ink">صور الإعلان</p>
            <AdminListingImageGallery
              images={form.images}
              onChange={setCreateImages}
              onUploadingChange={setUploadingImage}
              uploading={uploadingImage}
            />
          </div>

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
        </div>
      ) : null}

      <Card className="admin-listings-filters p-4" variant="flat">
        <div className="admin-listings-filters__grid">
          <div className="min-w-[220px] flex-1">
            <Input
              label="بحث"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="العنوان، رقم الإعلان، الرابط، المعلن، الهاتف..."
              value={searchQuery}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              label="الحالة"
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusFilterOptions}
              value={statusFilter}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              label="التصنيف"
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={categoryFilterOptions}
              value={categoryFilter}
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              label="الإمارة"
              onChange={(event) => {
                setEmirateFilter(event.target.value);
                setAreaFilter("all");
              }}
              options={emirateFilterOptions}
              value={emirateFilter}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              disabled={emirateFilter === "all"}
              label="المنطقة"
              onChange={(event) => setAreaFilter(event.target.value)}
              options={areaFilterOptions}
              value={areaFilter}
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
          <Button
            onClick={() => setStatusFilter("featured")}
            size="sm"
            type="button"
            variant={statusFilter === "featured" ? "primary" : "ghost"}
          >
            المميزة ({featuredCount})
          </Button>
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
            {featuredCount > 0 ? (
              <span className="ms-2">· مميزة: {featuredCount}</span>
            ) : null}
          </p>
        </div>
      </Card>

      {deskMessage ? (
        <FormMessage variant="error">{deskMessage}</FormMessage>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          {listings.length > 0 ? (
            <>
              <p className="text-sm text-muted">
                لا توجد إعلانات مطابقة لهذه التصفية
                {statusFilter === "pending_review"
                  ? " — لا يوجد شيء بانتظار المراجعة حالياً."
                  : statusFilter === "featured"
                    ? " — لا توجد إعلانات مميزة نشطة. استخدم زر تمييز من الجدول."
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
        <Card className="admin-listings-table-card overflow-hidden p-0" variant="flat">
          <div className="admin-listings-table-scroll">
            <table className="admin-ops__table admin-listings-table">
              <thead>
                <tr>
                  <th>رقم الإعلان</th>
                  <th>الإعلان</th>
                  <th>المعلن</th>
                  <th>التصنيف</th>
                  <th>المدينة</th>
                  <th>السعر</th>
                  <th>المشاهدات</th>
                  <th>الحالة</th>
                  <th>التمييز</th>
                  <th>تاريخ النشر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((listing) => {
                  const actionsOpen = openRowActions === listing.id;
                  const categoryLabel =
                    categoryNameById.get(listing.categoryId) ??
                    listing.categoryId;
                  const featuredLive = isFeaturedWindowLive(listing);
                  return (
                    <tr
                      className={
                        featuredLive ? "admin-listings-row--featured" : undefined
                      }
                      key={listing.id}
                    >
                      <td>
                        <span
                          className="font-mono text-xs font-semibold text-ink"
                          title={listing.id}
                        >
                          {listingNumberLabel(listing.id)}
                        </span>
                      </td>
                      <td className="admin-listings-cell-wrap admin-listings-cell-title">
                        <div className="flex items-start gap-2">
                          <AdminListingThumb size="sm" src={listing.imageUrl} />
                          <div className="min-w-0">
                            <p
                              className="font-semibold leading-snug text-ink"
                              title={listing.title}
                            >
                              {listing.title}
                            </p>
                            <p
                              className="mt-0.5 break-all text-[11px] leading-snug text-muted"
                              title={listing.slug}
                            >
                              {listing.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-listings-cell-wrap">
                        <p
                          className="font-medium leading-snug text-ink"
                          title={listing.sellerName || undefined}
                        >
                          {listing.sellerName || "—"}
                        </p>
                      </td>
                      <td className="admin-listings-cell-wrap">
                        <p
                          className="leading-snug text-ink"
                          title={categoryLabel}
                        >
                          {categoryLabel}
                        </p>
                      </td>
                      <td className="admin-listings-cell-wrap">
                        <p
                          className="leading-snug text-muted"
                          title={listing.city || undefined}
                        >
                          {listing.city || "—"}
                        </p>
                      </td>
                      <td>
                        <CurrencyAmount amount={listing.price} size="sm" />
                      </td>
                      <td>
                        <span className="tabular-nums font-semibold text-ink">
                          {(listing.views ?? 0).toLocaleString(
                            intlLocale(locale),
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={listingBadgeVariant(listing.status)}>
                            {listingStatusLabels[listing.status]}
                          </Badge>
                          {listing.isDemo ||
                          listing.source === "SOOQNA_SHOWCASE" ? (
                            <Badge variant="demo">تجريبي</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="admin-listings-cell-wrap">
                        {featuredLive ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="featured">مميّز</Badge>
                            <span className="text-[11px] leading-snug text-muted">
                              حتى {featuredUntilLabel(listing.featuredUntil, locale)}
                            </span>
                          </div>
                        ) : listing.isFeatured ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="muted">انتهت المميزة</Badge>
                            <span className="text-[11px] leading-snug text-muted">
                              {featuredUntilLabel(listing.featuredUntil, locale)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">عادي</span>
                        )}
                      </td>
                      <td>
                        <span className="whitespace-nowrap text-xs text-muted">
                          {listing.postedAt
                            ? new Date(listing.postedAt).toLocaleString(
                                intlLocale(locale),
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => startEdit(listing)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            تعديل
                          </Button>
                          {listing.status === "pending_review" ||
                          listing.status === "rejected" ||
                          listing.status === "draft" ? (
                            <Button
                              loading={busyId === listing.id}
                              onClick={() =>
                                patchListing(listing.id, { status: "active" })
                              }
                              size="sm"
                              type="button"
                              variant="primary"
                            >
                              اعتماد
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
                            type="button"
                            variant={featuredLive ? "ghost" : "secondary"}
                          >
                            {featuredLive ? "إلغاء التمييز" : "تمييز"}
                          </Button>
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
                            {actionsOpen ? "إخفاء" : "المزيد"}
                          </Button>
                        </div>
                        {actionsOpen ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {listing.status !== "rejected" ? (
                              <Button
                                loading={busyId === listing.id}
                                onClick={() => {
                                  const reason = window
                                    .prompt("سبب الرفض (اختياري)")
                                    ?.trim();
                                  void patchListing(listing.id, {
                                    status: "rejected",
                                    rejectReason: reason || undefined,
                                  });
                                }}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                رفض
                              </Button>
                            ) : null}
                            <Button
                              href={`/listings/${listing.slug}`}
                              size="sm"
                              variant="ghost"
                            >
                              عرض
                            </Button>
                            <Button
                              href="/featured"
                              size="sm"
                              variant="ghost"
                            >
                              صفحة المميزة
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
                              type="button"
                              variant="ghost"
                            >
                              حذف
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-listings-mobile-list">
            {filtered.map((listing) => {
              const actionsOpen = openRowActions === listing.id;
              const categoryLabel =
                categoryNameById.get(listing.categoryId) ?? listing.categoryId;
              const featuredLive = isFeaturedWindowLive(listing);
              return (
                <article
                  className={`admin-listings-mobile-card${
                    featuredLive ? " admin-listings-row--featured" : ""
                  }`}
                  key={`mobile-${listing.id}`}
                >
                  <div className="admin-listings-mobile-card__head">
                    <AdminListingThumb size="md" src={listing.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-semibold text-muted">
                        #{listingNumberLabel(listing.id)}
                      </p>
                      <p className="mt-0.5 font-semibold leading-snug text-ink">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted">
                        {listing.sellerName || "—"} · {categoryLabel}
                      </p>
                    </div>
                  </div>
                  <div className="admin-listings-mobile-card__meta">
                    <span>{listing.city || "—"}</span>
                    <CurrencyAmount amount={listing.price} size="sm" />
                    <span>
                      {(listing.views ?? 0).toLocaleString(intlLocale(locale))}{" "}
                      مشاهدة
                    </span>
                    {listing.postedAt ? (
                      <span>
                        {new Date(listing.postedAt).toLocaleDateString(
                          intlLocale(locale),
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={listingBadgeVariant(listing.status)}>
                      {listingStatusLabels[listing.status]}
                    </Badge>
                    {featuredLive ? (
                      <Badge variant="featured">مميّز</Badge>
                    ) : null}
                  </div>
                  <div className="admin-listings-mobile-card__actions">
                    <Button
                      onClick={() => startEdit(listing)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      تعديل
                    </Button>
                    {listing.status === "pending_review" ||
                    listing.status === "rejected" ||
                    listing.status === "draft" ? (
                      <Button
                        loading={busyId === listing.id}
                        onClick={() =>
                          patchListing(listing.id, { status: "active" })
                        }
                        size="sm"
                        type="button"
                        variant="primary"
                      >
                        اعتماد
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
                      type="button"
                      variant={featuredLive ? "ghost" : "secondary"}
                    >
                      {featuredLive ? "إلغاء التمييز" : "تمييز"}
                    </Button>
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
                      {actionsOpen ? "إخفاء" : "المزيد"}
                    </Button>
                  </div>
                  {actionsOpen ? (
                    <div className="admin-listings-mobile-card__actions">
                      <Button
                        href={`/listings/${listing.slug}`}
                        size="sm"
                        variant="ghost"
                      >
                        عرض
                      </Button>
                      <Button href="/featured" size="sm" variant="ghost">
                        صفحة المميزة
                      </Button>
                      {listing.status !== "rejected" ? (
                        <Button
                          loading={busyId === listing.id}
                          onClick={() => {
                            const reason = window
                              .prompt("سبب الرفض (اختياري)")
                              ?.trim();
                            void patchListing(listing.id, {
                              status: "rejected",
                              rejectReason: reason || undefined,
                            });
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          رفض
                        </Button>
                      ) : null}
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
                        type="button"
                        variant="ghost"
                      >
                        حذف
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Card>
      )}

      {editingId
        ? (() => {
            const listing = listings.find((row) => row.id === editingId);
            if (!listing) return null;
            return (
              <Card
                className="admin-boxes__card--wide p-5"
                variant="flat"
              >
                <form
                  className="grid gap-3"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveEdit(listing, event.currentTarget);
                  }}
                >
                  <h2 className="text-sm font-bold text-ink">
                    تعديل الإعلان · {listingNumberLabel(listing.id)}
                  </h2>
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
                        label="الإمارة"
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            emirate: event.target.value,
                            area: "",
                          }))
                        }
                        options={emirateFormOptions}
                        value={editDraft.emirate}
                      />
                      <Select
                        label="المنطقة"
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            area: event.target.value,
                          }))
                        }
                        options={areaFormOptions(
                          editDraft.emirate,
                          editDraft.area,
                        )}
                        value={editDraft.area}
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

                  <div className="grid gap-2 rounded-[var(--radius-xl)] border border-border bg-surface/60 p-3">
                    <p className="text-sm font-semibold text-ink">
                      معرض الصور
                    </p>
                    <AdminListingImageGallery
                      images={editDraft.images}
                      onChange={setEditImages}
                      onUploadingChange={setUploadingImage}
                      uploading={uploadingImage}
                    />
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
                        setEditImagesTouched(false);
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Card>
            );
          })()
        : null}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
