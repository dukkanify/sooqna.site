import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import {
  createCategoryRecord,
  getAdminCategoryRecords,
} from "@/services/categories/category-store";
import { isCategoryFeatureProfile } from "@/shared/constants/category-feature-profiles";
import type { AdminCategoryCreateInput } from "@/types";

export async function GET() {
  const admin = await requireAdminPermission("categories", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  return NextResponse.json({ categories: await getAdminCategoryRecords() });
}

export async function POST(request: Request) {
  const admin = await requireAdminPermission("categories", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json()) as AdminCategoryCreateInput;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  if (body.featureProfile && !isCategoryFeatureProfile(body.featureProfile)) {
    return NextResponse.json({ error: "INVALID_PROFILE" }, { status: 400 });
  }

  try {
    const category = await createCategoryRecord({
      name: body.name,
      slug: body.slug ?? "",
      icon: body.icon,
      featureProfile: body.featureProfile,
      seedForm: body.seedForm,
      sortOrder: body.sortOrder,
      subcategories: body.subcategories,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_FAILED";
    if (message === "SLUG_TAKEN") {
      return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });
    }
    if (message === "INVALID_SLUG") {
      return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
