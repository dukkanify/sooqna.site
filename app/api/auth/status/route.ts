import { NextResponse } from "next/server";
import { getProductionConfigSnapshotAsync } from "@/services/auth/production-config";
import {
  AuthStoreError,
  getAuthPersistenceInfo,
} from "@/services/auth/user-persistence";
import { isPostgresTemporarilyUnavailable } from "@/services/db/postgres";

export async function GET() {
  const config = await getProductionConfigSnapshotAsync();
  const postgresDegraded = isPostgresTemporarilyUnavailable();

  try {
    const persistence = await getAuthPersistenceInfo();
    const emergency = Boolean(persistence.emergency) || postgresDegraded;
    return NextResponse.json({
      // ok stays true when emergency mirror is serving, but degraded flags the outage.
      ok: true,
      degraded: emergency,
      postgresDegraded,
      config,
      persistence,
      warning: emergency
        ? "AUTH_EMERGENCY_MIRROR: Postgres quota/connectivity is degraded. Upgrade Neon data-transfer plan so login and password-reset emails can reach real accounts."
        : undefined,
    });
  } catch (error) {
    const message =
      error instanceof AuthStoreError
        ? error.message
        : error instanceof Error
          ? error.message
          : "AUTH_STORE_UNAVAILABLE";

    return NextResponse.json(
      {
        ok: false,
        degraded: true,
        postgresDegraded,
        config,
        persistence: null,
        error: message,
      },
      { status: 503 },
    );
  }
}
