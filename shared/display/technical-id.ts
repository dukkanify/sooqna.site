/**
 * Record keys (user-…, live-mkt-…) must stay internal.
 * UI labels never fall back to these strings.
 */

const TECHNICAL_PREFIX =
  /^(live-mkt-|user-listing-|user-|local-|admin-|showcase-|fav-|ord-|order-|n-|notif-|email-|txn-|wal-|addr-|rpt-)/i;

const USER_GENERATED_ID = /^user-\d{10,}-[a-f0-9]+$/i;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PREFIXED_TIMESTAMP = /^[a-z][a-z0-9]*-\d{10,}(?:-[a-z0-9]+)?$/i;

export function isTechnicalRecordId(
  value: string | null | undefined,
): boolean {
  const v = String(value ?? "").trim();
  if (!v) return false;
  if (USER_GENERATED_ID.test(v)) return true;
  if (TECHNICAL_PREFIX.test(v)) return true;
  if (UUID.test(v)) return true;
  if (PREFIXED_TIMESTAMP.test(v)) return true;
  return false;
}

/** Prefer a human string; never return a store key as the visible label. */
export function humanDisplayLabel(
  value: string | null | undefined,
  fallback = "—",
): string {
  const v = String(value ?? "").trim();
  if (!v || isTechnicalRecordId(v)) return fallback;
  return v;
}

/**
 * Compact listing number for admin desks.
 * `live-mkt-001` → `001`. Never returns the raw technical id.
 */
export function compactListingNumber(id: string | null | undefined): string {
  const trimmed = String(id ?? "").trim();
  if (!trimmed) return "—";
  const prefixed = trimmed.match(/^(?:live-mkt|user-listing)-(\d+)$/i);
  if (prefixed?.[1]) return prefixed[1];
  if (isTechnicalRecordId(trimmed)) return "—";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 3) return digits.slice(-6);
  return "—";
}

export function adminUserSearchHref(query: string | null | undefined): string {
  const q = String(query ?? "").trim();
  if (!q) return "/admin/users";
  return `/admin/users?q=${encodeURIComponent(q)}`;
}
