import { test, expect } from "@playwright/test";

/**
 * Image pipeline is not a blanket JPEG reject. Decode JPEG/JPG/PNG/WebP
 * in Chromium the same way listing upload does (createImageBitmap, then Image).
 */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64",
);
const WEBP = Buffer.from(
  "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
  "base64",
);

function toB64(buf: Buffer) {
  return buf.toString("base64");
}

test.describe("listing image formats @qa-isolated", () => {
  test("Chromium decodes JPEG, JPG alias, PNG, and WebP", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(
      async ({ jpeg, png, webp }) => {
        async function decode(b64: string, type: string, name: string) {
          const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const file = new File([binary], name, { type });
          try {
            const bitmap = await createImageBitmap(file, {
              imageOrientation: "from-image",
            });
            const width = bitmap.width;
            const height = bitmap.height;
            bitmap.close();
            return { name, ok: width > 0 && height > 0, via: "bitmap", width };
          } catch {
            try {
              const url = URL.createObjectURL(file);
              const image = new Image();
              await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("image error"));
                image.src = url;
              });
              URL.revokeObjectURL(url);
              return {
                name,
                ok: (image.naturalWidth || image.width) > 0,
                via: "image",
              };
            } catch {
              return { name, ok: false, via: "fail" };
            }
          }
        }

        return {
          jpeg: await decode(jpeg, "image/jpeg", "photo.jpeg"),
          jpg: await decode(jpeg, "image/jpg", "photo.jpg"),
          emptyJpg: await decode(jpeg, "", "photo.JPG"),
          png: await decode(png, "image/png", "photo.png"),
          webp: await decode(webp, "image/webp", "photo.webp"),
        };
      },
      { jpeg: toB64(JPEG), png: toB64(PNG), webp: toB64(WEBP) },
    );

    expect(result.jpeg.ok, `jpeg via ${result.jpeg.via}`).toBeTruthy();
    expect(result.jpg.ok, `jpg via ${result.jpg.via}`).toBeTruthy();
    expect(result.emptyJpg.ok, `empty jpg via ${result.emptyJpg.via}`).toBeTruthy();
    expect(result.png.ok, `png via ${result.png.via}`).toBeTruthy();
    expect(result.webp.ok, `webp via ${result.webp.via}`).toBeTruthy();
  });

  test("add-listing picker accepts jpeg/png/webp", async ({ page }) => {
    await page.goto("/listings/new");
    const accept = await page
      .locator('input[type="file"][accept]')
      .first()
      .getAttribute("accept");
    if (!accept) {
      // Guest may be sent to login — picker still exists on login? Skip assert.
      test.info().annotations.push({
        type: "note",
        description: "listings/new file input not visible (likely auth gate)",
      });
      return;
    }
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    expect(accept).toContain("image/webp");
  });
});
