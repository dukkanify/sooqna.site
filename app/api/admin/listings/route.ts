import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import {
  createListingFromAdmin,
  getAdminListingRecords,
} from "@/services/listings/listing-store";
import { quotePricingFromSpecs } from "@/shared/listings/quote-pricing";

export async function GET() {
  const admin = await requireAdminPermission("listings", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  return NextResponse.json({ listings: await getAdminListingRecords() });
}

/**
 * Create a listing from the admin form.
 * Bulk localStorage import (`listings[]`) is disabled — admin desks are real-data only.
 */
export async function POST(request: Request) {
  const admin = await requireAdminPermission("listings", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json()) as {
    create?: AdminListingCreateInput;
    listings?: Listing[];
    listing?: Listing;
  };

  if (body.create) {
    const create = body.create;
    if (!create.title?.trim() || !create.categoryId || !create.city) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    if (
      !quotePricingFromSpecs(create.categorySpecs) &&
      (!Number.isFinite(create.price) || create.price <= 0)
    ) {
      return NextResponse.json({ error: "INVALID_PRICE" }, { status: 400 });
    }

    const listing = await createListingFromAdmin(create);
    return NextResponse.json(
      {
        listing: (await getAdminListingRecords()).find(
          (item) => item.id === listing.id,
        ),
        listings: await getAdminListingRecords(),
      },
      { status: 201 },
    );
  }

  if (body.listings || body.listing) {
    return NextResponse.json(
      { error: "BULK_IMPORT_DISABLED" },
      { status: 410 },
    );
  }

  return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
}
