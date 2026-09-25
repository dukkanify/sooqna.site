import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  deleteListingById,
  getListingById,
  patchListingRecord,
} from "@/services/listings/listing-store";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import { SELLER_MARKETPLACE_STATUSES } from "@/shared/constants/listingStatuses";
import type { AdminListingPatch } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

const listingConditions = [
  "new",
  "used",
  "excellent",
  "refurbished",
  "for_parts",
  "not_working",
] as const;

/** Treat blank strings as omitted so partial edits don't fail min-length checks. */
function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();
}

const sellerPatchSchema = z
  .object({
    status: z.enum(["active", "reserved", "sold", "expired"]).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(20_000).optional(),
    price: z.number().finite().nonnegative().max(100_000_000).optional(),
    city: optionalTrimmedString(80),
    emirate: optionalTrimmedString(80),
    condition: z.enum(listingConditions).optional(),
    contactPhone: optionalTrimmedString(40),
    imageUrl: z.string().max(2_000_000).optional(),
    images: z.array(z.string().max(2_000_000)).max(6).optional(),
    categorySpecs: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
    features: z.array(z.string().max(120)).max(40).optional(),
    negotiable: z.boolean().optional(),
    videoUrl: z.string().trim().max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "EMPTY_PATCH",
  });

/** Owner updates marketplace lifecycle and/or listing fields. */
export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }
  if (listing.seller.id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const parsed = sellerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const data = parsed.data;
  if (
    data.status &&
    !SELLER_MARKETPLACE_STATUSES.includes(data.status) &&
    user.role !== "admin"
  ) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const patch: AdminListingPatch = {
    ...(data.status ? { status: data.status } : {}),
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(typeof data.price === "number" ? { price: data.price } : {}),
    ...(data.city ? { city: data.city } : {}),
    ...(data.emirate ? { emirate: data.emirate } : {}),
    ...(data.condition !== undefined ? { condition: data.condition } : {}),
    ...(data.contactPhone !== undefined
      ? { contactPhone: data.contactPhone }
      : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
    ...(data.images !== undefined ? { images: data.images } : {}),
    ...(data.categorySpecs !== undefined
      ? { categorySpecs: data.categorySpecs }
      : {}),
    ...(data.features !== undefined ? { features: data.features } : {}),
    ...(typeof data.negotiable === "boolean"
      ? { negotiable: data.negotiable }
      : {}),
    ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
  };

  const updated = await patchListingRecord(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ listing: updated });
}

/** Owner delete — removes the listing from the public catalog immediately. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    // Already gone — refresh feeds so stale cards drop without tombstoning unknown ids.
    bumpListingsCache();
    return NextResponse.json({ ok: true, deleted: false });
  }
  if (listing.seller.id !== user.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
  }

  const deleted = await deleteListingById(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: true });
}
