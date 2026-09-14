import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadCollection, saveCollection } from "@/services/payments/data-store";
import {
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import {
  getAuthStoreDriver,
  queryAuthPostgres,
} from "@/services/auth/user-persistence";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const CONSUMED_FILE = "password-reset-consumed.json";
const TOKEN_PREFIX = "pwr1";

export type PasswordResetTokenStatus = "valid" | "expired" | "invalid";

type SignedResetPayload = {
  /** user id */
  uid: string;
  /** normalized email */
  em: string;
  /** password fingerprint — changes when password changes (single-use) */
  pv: string;
  /** expiry unix ms */
  exp: number;
  /** unique id for optional consume ledger */
  jti: string;
};

type ConsumedEntry = {
  jti: string;
  consumedAt: string;
};

function resetSecret(): string {
  return (
    process.env.PASSWORD_PEPPER?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "sooqna-password-pepper"
  );
}

export function passwordFingerprint(passwordHash: string | null | undefined): string {
  const raw = (passwordHash ?? "").trim() || "nopw";
  return createHash("sha256").update(`pv:${raw}`).digest("hex").slice(0, 24);
}

function signBody(body: string): string {
  return createHmac("sha256", resetSecret()).update(`${TOKEN_PREFIX}.${body}`).digest("base64url");
}

function encodePayload(payload: SignedResetPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${TOKEN_PREFIX}.${body}.${signBody(body)}`;
}

function decodePayload(rawToken: string): SignedResetPayload | null {
  if (!rawToken.startsWith(`${TOKEN_PREFIX}.`)) return null;
  const parts = rawToken.split(".");
  if (parts.length !== 3) return null;
  const [, body, signature] = parts;
  const expected = signBody(body);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as SignedResetPayload;
    if (
      !parsed ||
      typeof parsed.uid !== "string" ||
      typeof parsed.em !== "string" ||
      typeof parsed.pv !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.jti !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function wasConsumed(jti: string): Promise<boolean> {
  try {
    const rows = await loadCollection<ConsumedEntry>(CONSUMED_FILE);
    return rows.some((row) => row.jti === jti);
  } catch {
    return false;
  }
}

async function markConsumed(jti: string): Promise<void> {
  try {
    const rows = await loadCollection<ConsumedEntry>(CONSUMED_FILE);
    if (rows.some((row) => row.jti === jti)) return;
    rows.unshift({ jti, consumedAt: new Date().toISOString() });
    await saveCollection(CONSUMED_FILE, rows.slice(0, 500));
  } catch (error) {
    console.error("[Sooqna Auth] failed to persist reset consume ledger", error);
  }
}

/** Best-effort audit row in Postgres — never required for issue/consume. */
async function auditIssue(payload: SignedResetPayload): Promise<void> {
  try {
    const driver = await getAuthStoreDriver();
    if (driver !== "postgres") return;
    await queryAuthPostgres(
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        normalized_email TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );
    await queryAuthPostgres(
      `INSERT INTO password_reset_tokens
        (id, user_id, normalized_email, token_hash, expires_at, consumed_at, created_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5/1000.0), NULL, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        payload.jti,
        payload.uid,
        payload.em,
        createHash("sha256").update(payload.jti).digest("hex"),
        payload.exp,
      ],
    );
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
    }
    // Signed tokens do not depend on this write.
  }
}

/**
 * Issue a signed reset token. Does not require Postgres — email delivery only needs Resend.
 * Returns the raw token for the email body only (never expose in API JSON).
 */
export async function issuePasswordResetToken(input: {
  email: string;
  userId: string;
  passwordHash?: string | null;
}): Promise<string> {
  const payload: SignedResetPayload = {
    uid: input.userId,
    em: input.email.trim().toLowerCase(),
    pv: passwordFingerprint(input.passwordHash),
    exp: Date.now() + PASSWORD_RESET_TTL_MS,
    jti: `pwr-${Date.now()}-${randomBytes(8).toString("hex")}`,
  };
  const token = encodePayload(payload);
  void auditIssue(payload);
  return token;
}

function classifyPayload(
  payload: SignedResetPayload | null,
): PasswordResetTokenStatus {
  if (!payload) return "invalid";
  if (payload.exp <= Date.now()) return "expired";
  return "valid";
}

export async function inspectPasswordResetToken(
  rawToken: string,
): Promise<PasswordResetTokenStatus> {
  if (!rawToken || rawToken.length < 16) return "invalid";
  const payload = decodePayload(rawToken);
  const status = classifyPayload(payload);
  if (status !== "valid" || !payload) return status;
  if (await wasConsumed(payload.jti)) return "invalid";
  return "valid";
}

/** Validate token and return claims without burning it. Call mark after password write succeeds. */
export async function resolvePasswordResetToken(rawToken: string): Promise<
  | {
      ok: true;
      email: string;
      userId: string;
      passwordFingerprint: string;
      jti: string;
    }
  | { ok: false; status: Exclude<PasswordResetTokenStatus, "valid"> }
> {
  if (!rawToken || rawToken.length < 16) {
    return { ok: false, status: "invalid" };
  }

  const payload = decodePayload(rawToken);
  const status = classifyPayload(payload);
  if (!payload || status !== "valid") {
    return {
      ok: false,
      status: status === "expired" ? "expired" : "invalid",
    };
  }

  if (await wasConsumed(payload.jti)) {
    return { ok: false, status: "invalid" };
  }

  return {
    ok: true,
    userId: payload.uid,
    email: payload.em,
    passwordFingerprint: payload.pv,
    jti: payload.jti,
  };
}

export async function markPasswordResetTokenConsumed(jti: string): Promise<void> {
  await markConsumed(jti);
}

export async function consumePasswordResetToken(rawToken: string): Promise<
  | { ok: true; email: string; userId: string; passwordFingerprint: string }
  | { ok: false; status: Exclude<PasswordResetTokenStatus, "valid"> }
> {
  const resolved = await resolvePasswordResetToken(rawToken);
  if (!resolved.ok) return resolved;
  await markConsumed(resolved.jti);
  return {
    ok: true,
    userId: resolved.userId,
    email: resolved.email,
    passwordFingerprint: resolved.passwordFingerprint,
  };
}
