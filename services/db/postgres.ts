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
/** Brief pause after a dropped idle socket — Neon poolers do this routinely. */
const POSTGRES_TRANSIENT_DEGRADED_TTL_MS = 15 * 1000;
/** Quota outages last hours/days — do not reconnect every few seconds (that burns transfer). */
const POSTGRES_QUOTA_DEGRADED_TTL_MS = 12 * 60 * 60 * 1000;

function isQuotaExceededMessage(message: string): boolean {
  return (
    message.includes("exceeded the data transfer quota") ||
    message.includes("exceeded the compute time quota") ||
    message.includes("data transfer quota") ||
    message.includes("compute time quota") ||
    message.includes("exceeded the storage size")
  );
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return String((error as { message?: string }).message ?? "").toLowerCase();
}

export function isPostgresTransientDisconnectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  const message = errorMessage(error);
  if (
    err.code === "ECONNRESET" ||
    err.code === "EPIPE" ||
    err.code === "PROTOCOL_CONNECTION_LOST"
  ) {
    return true;
  }
  return (
    message.includes("connection terminated unexpectedly") ||
    message.includes("connection terminated") ||
    message.includes("client has encountered a connection error") ||
    message.includes("server closed the connection") ||
    message.includes("cannot use a pool after calling end") ||
    message.includes("connection ended") ||
    message.includes("broken pipe")
  );
}

export function isPostgresQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: string;
    message?: string;
    severity?: string;
  };
  const message = errorMessage(error);
  if (err.code === "53000") return true; // Neon: data transfer / compute quota
  if (err.code === "57P01" || err.code === "57P03") return true;
  if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
    return true;
  }
  if (isQuotaExceededMessage(message)) return true;
  if (message.includes("remaining connection slots")) return true;
  if (message.includes("too many connections")) return true;
  if (isPostgresTransientDisconnectError(error)) return true;
  if (message.includes("cannot connect to")) return true;
  return false;
}

export function isPostgresQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  const message = errorMessage(error);
  if (err.code === "53000" && isQuotaExceededMessage(message)) return true;
  return isQuotaExceededMessage(message);
}

function degradeTtlMs(error?: unknown): number {
  if (isPostgresQuotaExceededError(error)) return POSTGRES_QUOTA_DEGRADED_TTL_MS;
  return POSTGRES_TRANSIENT_DEGRADED_TTL_MS;
}

function discardPool(): void {
  pool = null;
  const closing = rawPool;
  rawPool = null;
  if (closing) {
    void closing.end().catch(() => undefined);
  }
}

export function markPostgresUnavailable(error?: unknown): void {
  const ttl = degradeTtlMs(error);
  postgresDegradedUntil = Date.now() + ttl;
  discardPool();
  if (error && process.env.NODE_ENV !== "test") {
    const message =
      error instanceof Error ? error.message : String(error ?? "unknown");
    console.error(`[postgres] degraded for ${ttl / 1000}s: ${message}`);
  }
}

export function isPostgresTemporarilyUnavailable(): boolean {
  return Date.now() < postgresDegradedUntil;
}

/** Clear the degrade window so the next call can reconnect (e.g. password writes). */
export function clearPostgresDegraded(): void {
  postgresDegradedUntil = 0;
}

/**
 * Rewrite legacy sslmode values that `pg` currently aliases to verify-full.
 * Keeps connection behavior identical while silencing the deprecation warning.
 */
export function normalizePostgresSslMode(connectionString: string): string {
  return connectionString.replace(
    /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
    "$1verify-full",
  );
}

export function getPostgresConnectionString(): string {
  const direct =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    "";
  if (direct.startsWith("postgres")) {
    return normalizePostgresSslMode(direct);
  }

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
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?sslmode=verify-full`;
  }
  return "";
}

/** Whether a Pool should enable TLS for this connection string. */
export function shouldUsePostgresSsl(connectionString: string): boolean {
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) return false;
  if (/sslmode=disable/i.test(connectionString)) return false;
  return (
    process.env.NODE_ENV === "production" ||
    /sslmode=(require|verify-full)/i.test(connectionString) ||
    /neon\.tech|supabase\.co|amazonaws\.com/i.test(connectionString)
  );
}

export function postgresPoolSslOption(
  connectionString: string,
): { rejectUnauthorized: false } | undefined {
  return shouldUsePostgresSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;
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

async function openPool(connectionString: string): Promise<PostgresPool> {
  const pg = await import("pg");
  const serverless = isServerlessRuntime();
  const next = new pg.Pool({
    connectionString,
    // Serverless: keep the footprint tiny; Neon pooler already multiplexes.
    max: serverless ? 2 : 5,
    idleTimeoutMillis: serverless ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: serverless,
    ssl: postgresPoolSslOption(connectionString),
  });
  next.on("error", (error) => {
    // Idle clients die often on Neon — drop the pool so the next query reconnects.
    if (process.env.NODE_ENV !== "test") {
      console.error(
        `[postgres] pool error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (rawPool === next) {
      discardPool();
    }
  });
  rawPool = next;

  const runQuery = async (sql: string, params?: unknown[]) => {
    try {
      return await next.query(sql, params);
    } catch (error) {
      if (isPostgresTransientDisconnectError(error)) {
        // Drop the broken pool so the next request opens a fresh one.
        // Do not enter the multi-minute degrade window for a single socket drop.
        if (rawPool === next) discardPool();
      } else if (isPostgresQuotaOrUnavailableError(error)) {
        markPostgresUnavailable(error);
      }
      throw error;
    }
  };

  pool = {
    query: (sql, params) => runQuery(sql, params),
  };
  return pool;
}

/** Prefer Postgres; null when unavailable (local JSON / memory catalog fallback). */
export async function getOptionalPostgresPool(): Promise<PostgresPool | null> {
  if (isPostgresTemporarilyUnavailable()) return null;
  const connectionString = getPostgresConnectionString();
  if (!connectionString) return null;
  if (pool) return pool;
  try {
    return await openPool(connectionString);
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return null;
    }
    throw error;
  }
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

/** Test helpers — not used by app runtime. */
export const __postgresTest = {
  transientTtlMs: POSTGRES_TRANSIENT_DEGRADED_TTL_MS,
  quotaTtlMs: POSTGRES_QUOTA_DEGRADED_TTL_MS,
};
