import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { getAllJobApplications } from "@/services/job-applications/job-application-store";

export async function GET() {
  const admin = await requireAdminPermission("listings", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  const applications = await getAllJobApplications();
  return NextResponse.json({ applications });
}
