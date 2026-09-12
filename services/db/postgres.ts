import type { Pool } from "pg";

type PostgresPool = {
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

let pool: PostgresPool | null = null;
let rawPool: Pool | null = null;
/** When Neon/Vercel Postgres hits quota or connectivity failure, skip DB for this process. */
let postgresDegradedUntil = 0;
const POSTGRES_DEGRADED_TTL_MS = 5 * 60 * 1000;

export function isPostgresQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: string;
    message?: string;
    severity?: string;
  };
  const message = String(err.message ?? "").toLowerCase();
  if (err.code === "53000") return true; // Neon: data transfer / compute quota
  if (err.code === "57P01" || err.code === "57P03") return true;
  if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
    return true;
  }
  if (message.includes("exceeded the data transfer quota")) return true;
  if (message.includes("exceeded the compute time quota")) return true;
  if (message.includes("remaining connection slots")) return true;
  if (message.includes("too many connections")) return true;
  if (message.includes("connection terminated unexpectedly")) return true;
  if (message.includes("cannot connect to")) return true;
  return false;
}

export function markPostgresUnavailable(error?: unknown): void {
  postgresDegradedUntil = Date.now() + POSTGRES_DEGRADED_TTL_MS;
  pool = null;
  const closing = rawPool;
  rawPool = null;
  if (closing) {
    void closing.end().catch(() => undefined);
  }
  if (error && process.env.NODE_ENV !== "test") {
    const message =
      error instanceof Error ? error.message : String(error ?? "unknown");
    console.error(`[postgres] degraded for ${POSTGRES_DEGRADED_TTL_MS / 1000}s: ${message}`);
  }
}

export function isPostgresTemporarilyUnavailable(): boolean {
  return Date.now() < postgresDegradedUntil;
}

export function getPostgresConnectionString(): string {
  const direct =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    "";
  if (direct.startsWith("postgres")) return direct;

  const host =
    process.env.DATABASE_PGHOST?.trim() ||
    process.env.DATABASE_PGHOST_UNPOOLED?.trim() ||
    process.env.PGHOST?.trim() ||
    "";
  const user =
    process.env.DATABASE_PGUSER?.trim() ||
    process.env.PGUSER?.trim() ||
    "neondb_owner";
  const password =
    process.env.DATABASE_PGPASSWORD?.trim() ||
    process.env.PGPASSWORD?.trim() ||
    "";
  const database =
    process.env.DATABASE_PGDATABASE?.trim() ||
    process.env.PGDATABASE?.trim() ||
    "neondb";
  const port =
    process.env.DATABASE_PGPORT?.trim() || process.env.PGPORT?.trim() || "5432";

  if (host && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?sslmode=require`;
  }
  return "";
}

function shouldUseSsl(connectionString: string): boolean {
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) return false;
  if (/sslmode=disable/i.test(connectionString)) return false;
  return (
    process.env.NODE_ENV === "production" ||
    /sslmode=require/i.test(connectionString) ||
    /neon\.tech|supabase\.co|amazonaws\.com/i.test(connectionString)
  );
}

export function isPostgresConfigured(): boolean {
  return Boolean(getPostgresConnectionString());
}

export function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

/** Prefer Postgres; null when unavailable (local JSON / memory catalog fallback). */
export async function getOptionalPostgresPool(): Promise<PostgresPool | null> {
  if (isPostgresTemporarilyUnavailable()) return null;
  const connectionString = getPostgresConnectionString();
  if (!connectionString) return null;
  if (pool) return pool;

  const pg = await import("pg");
  rawPool = new pg.Pool({
    connectionString,
    max: 5,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });
  pool = {
    query: async (sql, params) => {
      try {
        return await rawPool!.query(sql, params);
      } catch (error) {
        if (isPostgresQuotaOrUnavailableError(error)) {
          markPostgresUnavailable(error);
        }
        throw error;
      }
    },
  };
  return pool;
}

/**
 * Production serverless must use Postgres for critical data.
 * Local/dev may fall back to durable JSON under `.data/`.
 */
export async function requirePostgresPool(
  label = "STORE",
): Promise<PostgresPool> {
  const pg = await getOptionalPostgresPool();
  if (pg) return pg;
  if (isServerlessRuntime() || process.env.NODE_ENV === "production") {
    throw new Error(`${label}_REQUIRES_POSTGRES`);
  }
  throw new Error(`${label}_POSTGRES_UNAVAILABLE`);
}
