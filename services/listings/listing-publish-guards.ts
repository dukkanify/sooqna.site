import type { Listing } from "@/types";
import {
  isInlineListingMediaUrl,
  listingHasRemoteDurableCover,
  listingMediaUrls,
} from "@/shared/listings/durable-media";
import { isKeyboardMashTitle } from "@/services/listings/mock-catalog-policy";
import {
  getObjectStorage,
  storeUploadedObject,
} from "@/services/storage/object-storage";
import { isServerlessRuntime } from "@/services/db/postgres";

export const LISTING_TITLE_INVALID = "LISTING_TITLE_INVALID";
export const LISTING_IMAGES_REQUIRED = "LISTING_IMAGES_REQUIRED";

const TITLE_INVALID_MESSAGE_AR =
  "العنوان غير مقبول — اكتب عنواناً واضحاً يصف المنتج (تجنب الأحرف العشوائية).";
const IMAGES_REQUIRED_MESSAGE_AR =
  "لا يمكن نشر الإعلان بدون صورة دائمة. ارفع صورة حقيقية عبر التخزين السحابي ثم أعد الاعتماد.";

export function publishGuardMessage(code: string): string {
  if (code === LISTING_TITLE_INVALID) return TITLE_INVALID_MESSAGE_AR;
  if (code === LISTING_IMAGES_REQUIRED) return IMAGES_REQUIRED_MESSAGE_AR;
  return "تعذر حفظ الإعلان.";
}

export function assertAcceptableListingTitle(
  title: string | undefined,
  titleEnglish?: string | undefined,
): void {
  if (isKeyboardMashTitle(title) || isKeyboardMashTitle(titleEnglish)) {
    throw new Error(LISTING_TITLE_INVALID);
  }
}

/** True when Blob or S3 is configured (not ephemeral local disk on serverless). */
export function hasCloudObjectStorage(): boolean {
  const provider = getObjectStorage().name;
  if (provider === "blob" || provider === "s3") return true;
  // Local disk is durable only outside serverless (dev / long-lived host).
  return provider === "local" && !isServerlessRuntime();
}

/**
 * Promote inline `data:` listing photos to Blob/S3 when cloud storage is available.
 * Leaves URLs unchanged when storage cannot accept them.
 */
export async function materializeInlineListingImages<
  T extends { imageUrl?: string; images?: string[]; seller?: { id?: string } },
>(listing: T): Promise<T> {
  if (!hasCloudObjectStorage()) return listing;
  const urls = listingMediaUrls(listing);
  if (!urls.some(isInlineListingMediaUrl)) return listing;

  const next: string[] = [];
  const ownerScope = listing.seller?.id;
  for (const url of urls) {
    if (!url.toLowerCase().startsWith("data:")) {
      // Drop ephemeral blob: object URLs — they only work in the creating tab.
      if (url.toLowerCase().startsWith("blob:")) continue;
      next.push(url);
      continue;
    }
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) {
      next.push(url);
      continue;
    }
    try {
      const stored = await storeUploadedObject({
        buffer: Buffer.from(match[2], "base64"),
        contentType: match[1].toLowerCase(),
        folder: "listings",
        ownerScope,
      });
      next.push(stored.url);
    } catch {
      // Keep the inline URL so detail can still show it; activate guard will block.
      next.push(url);
    }
  }

  return {
    ...listing,
    images: next,
    imageUrl: next[0],
  };
}

/**
 * Refuse public activation unless at least one remote durable cover exists.
 * Call after {@link materializeInlineListingImages}.
 * Only enforced when transitioning into `active` (not every edit of a live ad).
 */
export function assertListingReadyForPublicActivation(
  listing: {
    imageUrl?: string;
    images?: string[];
    status?: string;
  },
  options?: { previousStatus?: string },
): void {
  if (listing.status !== "active") return;
  const previous = options?.previousStatus;
  const activating = !previous || previous !== "active";
  if (!activating) return;
  if (listingHasRemoteDurableCover(listing)) return;
  throw new Error(LISTING_IMAGES_REQUIRED);
}

/** Full guard used by upsert/patch before persisting. */
export async function prepareListingForPersistence(
  listing: Listing,
  options?: { previousStatus?: string },
): Promise<Listing> {
  assertAcceptableListingTitle(listing.title, listing.titleEnglish);
  const withMedia = await materializeInlineListingImages(listing);
  assertListingReadyForPublicActivation(withMedia, {
    previousStatus: options?.previousStatus,
  });
  return withMedia;
}
