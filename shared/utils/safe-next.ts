import { z } from "zod";

/** Accept omitted, empty, or JSON-null `next` so login forms do not 400 as INVALID_INPUT. */
export const optionalRedirectPathSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export function getSafeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}
