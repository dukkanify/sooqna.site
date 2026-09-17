const PRODUCTION_SITE_URL = "https://sooqnauae.com";
const DEVELOPMENT_SITE_URL = "http://localhost:3000";
const LEGACY_SITE_HOST = /^(www\.)?sooqna\.site$/i;

function vercelPreviewUrl(): string | null {
  if (process.env.VERCEL_ENV !== "preview") return null;
  const host = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host) return null;
  return `https://${host}`;
}

/** Map retired sooqna.site env values to the canonical Production domain. */
export function canonicalizeAppUrl(url: string): string {
  const cleaned = url.trim().replace(/\/$/, "");
  try {
    const host = new URL(cleaned).hostname;
    if (LEGACY_SITE_HOST.test(host)) {
      return PRODUCTION_SITE_URL;
    }
  } catch {
    // fall through
  }
  return cleaned;
}

/** Canonical public site URL — Preview uses the deployment host so auth emails stay off Production. */
export function getAppUrl(): string {
  const previewUrl = vercelPreviewUrl();
  if (previewUrl) return previewUrl;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return canonicalizeAppUrl(configured);
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }
  return DEVELOPMENT_SITE_URL;
}

/**
 * Password-reset emails must ALWAYS land on the primary Production domain.
 * Never embed ephemeral Vercel Preview hosts — those expire and break inbox links.
 * Local/dev still uses localhost for manual testing.
 */
export function getPasswordResetAppUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_SITE_URL;
  }
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const canonical = canonicalizeAppUrl(configured);
    try {
      const host = new URL(canonical).hostname.replace(/^www\./, "");
      if (/sooqnauae\.com$/i.test(host)) return canonical;
    } catch {
      // fall through
    }
  }
  return PRODUCTION_SITE_URL;
}

/** Apex hostname without www, derived from app URL. */
export function getSiteDomain(): string {
  try {
    return new URL(getAppUrl()).hostname.replace(/^www\./, "");
  } catch {
    return "sooqnauae.com";
  }
}

export function getSiteOrigin(): string {
  return getAppUrl();
}

export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Production From address — never send as @sooqna.site after domain cutover. */
export function resolveEmailFromAddress(): string {
  const configured = process.env.EMAIL_FROM_ADDRESS?.trim();
  if (!configured) return "no-reply@sooqnauae.com";
  if (/@sooqna\.site$/i.test(configured)) {
    return "no-reply@sooqnauae.com";
  }
  return configured;
}
