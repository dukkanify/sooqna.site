/**
 * Listing image pipeline: JPEG is allowed. Failures are decode/MIME issues,
 * not a blanket JPEG reject. Try JPEG/JPG/PNG/WebP before calling it general.
 * Run: node --test --experimental-strip-types scripts/image-upload-pipeline.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  IMAGE_HEIC_ERROR,
  IMAGE_READ_ERROR,
  LISTING_IMAGE_ACCEPT,
  LISTING_IMAGE_MIME_TYPES,
  isLikelyListingImageFile,
  mimeForRasterKind,
  normalizeDeclaredImageMime,
  resolveUploadContentType,
  sniffRasterImageKind,
} from "../shared/media/image-bytes.ts";
import { UPLOAD_ALLOWED_TYPES } from "../services/storage/types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

/** 1×1 PNG */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Minimal baseline JPEG (SOI + JFIF) */
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64",
);

/** 1×1 lossless WebP */
const WEBP = Buffer.from(
  "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
  "base64",
);

/** 1×1 GIF */
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const HEIC = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0x00,
  0x00, 0x00, 0x00, 0x6d, 0x69, 0x66, 0x31,
]);

describe("image magic-byte sniff", () => {
  it("recognizes JPEG, PNG, WebP, and GIF", () => {
    assert.equal(sniffRasterImageKind(JPEG), "jpeg");
    assert.equal(sniffRasterImageKind(PNG), "png");
    assert.equal(sniffRasterImageKind(WEBP), "webp");
    assert.equal(sniffRasterImageKind(GIF), "gif");
  });

  it("treats FFD8FF as JPEG even without a JFIF APP0 block", () => {
    const rawSoi = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78]);
    assert.equal(sniffRasterImageKind(rawSoi), "jpeg");
  });

  it("detects HEIC/HEIF ftyp brands", () => {
    assert.equal(sniffRasterImageKind(HEIC), "heic");
  });
});

describe("MIME aliases and extensions", () => {
  it("maps jpg / pjpeg / jfif / empty+extension to image/jpeg", () => {
    assert.equal(normalizeDeclaredImageMime("image/jpg", "x"), "image/jpeg");
    assert.equal(normalizeDeclaredImageMime("image/pjpeg", "x"), "image/jpeg");
    assert.equal(normalizeDeclaredImageMime("image/jfif", "x"), "image/jpeg");
    assert.equal(normalizeDeclaredImageMime("", "photo.JPG"), "image/jpeg");
    assert.equal(normalizeDeclaredImageMime("", "photo.jpeg"), "image/jpeg");
    assert.equal(
      normalizeDeclaredImageMime("application/octet-stream", "scan.jfif"),
      "image/jpeg",
    );
  });

  it("does not treat JPEG as unsupported", () => {
    assert.equal(LISTING_IMAGE_MIME_TYPES.has("image/jpeg"), true);
    assert.equal(UPLOAD_ALLOWED_TYPES.has("image/jpeg"), true);
    assert.equal(UPLOAD_ALLOWED_TYPES.has("image/png"), true);
    assert.equal(UPLOAD_ALLOWED_TYPES.has("image/webp"), true);
    assert.equal(isLikelyListingImageFile({ name: "a.jpg", type: "" }), true);
    assert.equal(
      isLikelyListingImageFile({ name: "a.jpeg", type: "image/jpeg" }),
      true,
    );
    assert.equal(
      isLikelyListingImageFile({ name: "a.png", type: "image/png" }),
      true,
    );
    assert.equal(
      isLikelyListingImageFile({ name: "a.webp", type: "image/webp" }),
      true,
    );
  });
});

describe("resolveUploadContentType", () => {
  it("trusts magic bytes over a wrong declared type", () => {
    assert.equal(
      resolveUploadContentType({
        declaredType: "image/png",
        filename: "shot.png",
        bytes: JPEG,
      }),
      "image/jpeg",
    );
    assert.equal(
      resolveUploadContentType({
        declaredType: "image/jpg",
        filename: "shot.jpg",
        bytes: JPEG,
      }),
      "image/jpeg",
    );
    assert.equal(
      resolveUploadContentType({
        declaredType: "",
        filename: "photo.JPG",
        bytes: JPEG,
      }),
      "image/jpeg",
    );
    assert.equal(
      resolveUploadContentType({
        declaredType: "image/png",
        filename: "a.png",
        bytes: PNG,
      }),
      "image/png",
    );
    assert.equal(
      resolveUploadContentType({
        declaredType: "image/webp",
        filename: "a.webp",
        bytes: WEBP,
      }),
      "image/webp",
    );
  });

  it("does not store HEIC as JPEG", () => {
    assert.equal(
      resolveUploadContentType({
        declaredType: "image/jpeg",
        filename: "IMG_0001.jpg",
        bytes: HEIC,
      }),
      "image/heic",
    );
    assert.equal(UPLOAD_ALLOWED_TYPES.has("image/heic"), false);
  });
});

describe("listing upload pipeline wiring", () => {
  it("client decode prefers createImageBitmap and keeps raster fallback", () => {
    const persist = read("shared/utils/persist-images.ts");
    assert.match(persist, /createImageBitmap/);
    assert.match(persist, /imageOrientation:\s*"from-image"/);
    assert.match(persist, /keepOriginalIfSafe/);
    assert.match(persist, /IMAGE_HEIC_ERROR/);
    assert.match(persist, /IMAGE_READ_ERROR/);
    assert.match(persist, /coverCropRect/);
    assert.match(persist, /LISTING_COVER_WIDTH/);
    assert.match(persist, /0\.78/);
    assert.doesNotMatch(persist, /reject.*JPEG/);
  });

  it("server upload sniffs bytes instead of trusting image/jpg only", () => {
    const route = read("app/api/uploads/route.ts");
    assert.match(route, /resolveUploadContentType/);
    assert.match(route, /file\.arrayBuffer/);
    assert.doesNotMatch(route, /if \(raw === "image\/jpg"\) return "image\/jpeg"/);

    const storage = read("services/storage/object-storage.ts");
    assert.match(storage, /sniffRasterImageKind/);
    assert.match(storage, /sniffed === "heic"/);
  });

  it("file pickers accept JPEG/JPG/PNG/WebP explicitly", () => {
    assert.match(LISTING_IMAGE_ACCEPT, /image\/jpeg/);
    assert.match(LISTING_IMAGE_ACCEPT, /image\/jpg/);
    assert.match(LISTING_IMAGE_ACCEPT, /\.jfif/);
    assert.match(LISTING_IMAGE_ACCEPT, /image\/png/);
    assert.match(LISTING_IMAGE_ACCEPT, /image\/webp/);

    const media = read("features/listings/components/add-listing/MediaContactStep.tsx");
    const edit = read("features/listings/components/ListingMediaSection.tsx");
    const admin = read("features/admin/components/AdminListingImageGallery.tsx");
    const previews = read(
      "features/listings/components/add-listing/useImagePreviews.ts",
    );

    assert.match(media, /LISTING_IMAGE_ACCEPT/);
    assert.match(edit, /LISTING_IMAGE_ACCEPT/);
    assert.match(admin, /LISTING_IMAGE_ACCEPT/);
    assert.match(admin, /collectListingImageFiles/);
    assert.doesNotMatch(admin, /file\.type\.startsWith\("image\/"\)/);
    assert.match(previews, /withNormalizedImageFile/);
  });

  it("exports stable Arabic errors", () => {
    assert.equal(IMAGE_READ_ERROR, "تعذر قراءة الصورة");
    assert.match(IMAGE_HEIC_ERROR, /HEIC/);
    assert.equal(mimeForRasterKind("jpeg"), "image/jpeg");
  });
});
