/** Optional social / web presence links on a user profile. */

export const SOCIAL_LINK_PLATFORMS = [
  "instagram",
  "facebook",
  "x",
  "tiktok",
  "linkedin",
  "youtube",
  "website",
] as const;

export type SocialLinkPlatform = (typeof SOCIAL_LINK_PLATFORMS)[number];

export type SocialLinksMap = Partial<Record<SocialLinkPlatform, string>>;

export const SOCIAL_LINK_LABELS_AR: Record<SocialLinkPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X (تويتر)",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  website: "موقع إلكتروني",
};

export const SOCIAL_LINK_PLACEHOLDERS: Record<SocialLinkPlatform, string> = {
  instagram: "https://instagram.com/username",
  facebook: "https://facebook.com/page",
  x: "https://x.com/username",
  tiktok: "https://tiktok.com/@username",
  linkedin: "https://linkedin.com/in/username",
  youtube: "https://youtube.com/@channel",
  website: "https://example.com",
};

/** Host suffixes allowed per platform (website = any https host). */
export const SOCIAL_LINK_HOSTS: Record<SocialLinkPlatform, string[] | null> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com", "m.facebook.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"],
  tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  website: null,
};

const MAX_URL_LENGTH = 200;

export const SOCIAL_LINK_INVALID_AR =
  "رابط غير صالح. استخدم رابط https صحيح للمنصة.";

function hostMatches(hostname: string, allowed: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowed.some((entry) => {
    const base = entry.replace(/^www\./, "").toLowerCase();
    return host === entry.toLowerCase() || host === base || host.endsWith(`.${base}`);
  });
}

/** Normalize a raw social URL; empty → undefined; invalid → null. */
export function normalizeSocialUrl(
  platform: SocialLinkPlatform,
  raw: string | undefined | null,
): string | undefined | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_URL_LENGTH) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.protocol = "https:";

  const allowed = SOCIAL_LINK_HOSTS[platform];
  if (allowed && !hostMatches(parsed.hostname, allowed)) {
    return null;
  }

  if (parsed.username || parsed.password) return null;

  return parsed.toString();
}

export type SocialLinksSanitizeResult =
  | { ok: true; links: SocialLinksMap }
  | { ok: false; platform: SocialLinkPlatform; message: string };

/** Sanitize a partial socialLinks object; empty strings clear keys. */
export function sanitizeSocialLinks(
  input: Partial<Record<SocialLinkPlatform, string | undefined>> | null | undefined,
): SocialLinksSanitizeResult {
  const links: SocialLinksMap = {};
  if (!input) return { ok: true, links };

  for (const platform of SOCIAL_LINK_PLATFORMS) {
    if (!Object.prototype.hasOwnProperty.call(input, platform)) continue;
    const normalized = normalizeSocialUrl(platform, input[platform]);
    if (normalized === null) {
      return { ok: false, platform, message: SOCIAL_LINK_INVALID_AR };
    }
    if (normalized) {
      links[platform] = normalized;
    }
  }

  return { ok: true, links };
}

/** Public-facing list of filled links (caller must already check socialLinksPublic). */
export function listFilledSocialLinks(
  links: SocialLinksMap | undefined | null,
): Array<{ platform: SocialLinkPlatform; url: string }> {
  if (!links) return [];
  return SOCIAL_LINK_PLATFORMS.flatMap((platform) => {
    const url = links[platform]?.trim();
    return url ? [{ platform, url }] : [];
  });
}
