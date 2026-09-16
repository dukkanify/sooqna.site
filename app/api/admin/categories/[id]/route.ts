import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  deleteCategoryRecord,
  patchCategoryRecord,
} from "@/services/categories/category-store";
import { isCategoryFeatureProfile } from "@/shared/constants/category-feature-profiles";
import type { AdminCategoryPatch } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const admin = await requireAdminPermission("categories", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const { id } = await context.params;
  const body = (await request.json()) as AdminCategoryPatch;
  if (body.featureProfile && !isCategoryFeatureProfile(body.featureProfile)) {
    return NextResponse.json({ error: "INVALID_PROFILE" }, { status: 400 });
  }

  const category = await patchCategoryRecord(id, body);

  if (!category) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "category_update",
    targetType: "category",
    targetId: id,
    detail: [
      body.name ? `اسم ${body.name}` : null,
      body.featureProfile ? `سلوك ${body.featureProfile}` : null,
      body.icon ? `أيقونة ${body.icon}` : null,
      body.subcategories ? `تصنيفات فرعية ${body.subcategories.length}` : null,
      typeof body.enabled === "boolean"
        ? body.enabled
          ? "مفعّل"
          : "معطّل"
        : null,
      body.reseedForm ? "إعادة تهيئة النموذج" : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, context: RouteParams) {
  const admin = await requireAdminPermission("categories", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const { id } = await context.params;
  const deleted = await deleteCategoryRecord(id);
  if (!deleted) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "category_delete",
    targetType: "category",
    targetId: id,
    detail: "حذف فئة",
  });

  return NextResponse.json({ ok: true, deleted: true });
}
