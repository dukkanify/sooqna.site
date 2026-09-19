/**
 * Normalize a listing slug/id from a Next.js route param or request URL.
 * Non-ASCII slugs often arrive still percent-encoded (`%D8%B1...`) while the
 * catalog stores Unicode — exact DB match then fails and the page 404s.
 */
export function normalizeListingSlugParam(raw: string | undefined | null): string {
  if (!raw) return "";
  let value = raw.trim();
  if (!value) return "";

  for (let i = 0; i < 3; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  try {
    return value.normalize("NFC");
  } catch {
    return value;
  }
}

/** Candidate keys to try when resolving a listing by slug (encoded variants). */
export function listingSlugLookupKeys(raw: string | undefined | null): string[] {
  const primary = normalizeListingSlugParam(raw);
  if (!primary) return [];
  const keys = new Set<string>([primary]);

  // Raw param as received (may still be encoded).
  const trimmed = (raw ?? "").trim();
  if (trimmed) keys.add(trimmed);

  // Re-encoded forms some proxies store.
  try {
    keys.add(encodeURIComponent(primary));
  } catch {
    // ignore
  }

  return [...keys];
}
