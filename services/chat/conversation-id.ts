/**
 * Conversation URL ids must stay opaque.
 * Embedding raw user ids (e.g. demo-admin-001) in `/chat/...` paths
 * can trip edge WAF heuristics ("admin" substring) and return 403 Forbidden.
 */

const LEGACY_PREFIX = "chat-";

/** Deterministic 64-bit hex digest (sync, ES-target safe). */
function stableDigestHex(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x811c9dc5);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0")
  );
}

/** Stable opaque id for a listing+buyer pair (safe for public URLs). */
export function buildConversationId(listingId: string, buyerId: string): string {
  return `c_${stableDigestHex(`${listingId}\0${buyerId}`)}`;
}

/** Previous id format kept for lookup/migration only — do not mint new ones. */
export function buildLegacyConversationId(
  listingId: string,
  buyerId: string,
): string {
  return `${LEGACY_PREFIX}${listingId}-${buyerId}`;
}

export function isLegacyConversationId(conversationId: string): boolean {
  return conversationId.startsWith(LEGACY_PREFIX);
}

export function candidateConversationIds(
  listingId: string,
  buyerId: string,
): string[] {
  const opaque = buildConversationId(listingId, buyerId);
  const legacy = buildLegacyConversationId(listingId, buyerId);
  return opaque === legacy ? [opaque] : [opaque, legacy];
}
