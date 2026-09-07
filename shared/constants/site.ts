const PRODUCTION_SITE_URL = "https://sooqna.site";
const DEVELOPMENT_SITE_URL = "http://localhost:3000";

function vercelPreviewUrl(): string | null {
  if (process.env.VERCEL_ENV !== "preview") return null;
  const host = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host) return null;
  return `https://${host}`;
}

/** Canonical public site URL — Preview uses the deployment host so auth emails stay off Production. */
export function getAppUrl(): string {
  const previewUrl = vercelPreviewUrl();
  if (previewUrl) return previewUrl;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }
  return DEVELOPMENT_SITE_URL;
}

/** Apex hostname without www, derived from app URL. */
export function getSiteDomain(): string {
  try {
    return new URL(getAppUrl()).hostname.replace(/^www\./, "");
  } catch {
    return "sooqna.site";
  }
}

export function getSiteOrigin(): string {
  return getAppUrl();
}

export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";
}
