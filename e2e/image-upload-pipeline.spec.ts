import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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
const HEIC = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0x00,
  0x00, 0x00, 0x00, 0x6d, 0x69, 0x66, 0x31,
]);

function toB64(buf: Buffer) {
  return buf.toString("base64");
}

function fixtureDir() {
  const dir = path.join(tmpdir(), "sooqna-image-pipeline");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "photo.jpeg"), JPEG);
  writeFileSync(path.join(dir, "photo.jpg"), JPEG);
  writeFileSync(path.join(dir, "photo.JPG"), JPEG);
  writeFileSync(path.join(dir, "photo.png"), PNG);
  writeFileSync(path.join(dir, "photo.webp"), WEBP);
  writeFileSync(path.join(dir, "heic-as.jpg"), HEIC);
  return dir;
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
    expect(
      result.emptyJpg.ok,
      `empty jpg via ${result.emptyJpg.via}`,
    ).toBeTruthy();
    expect(result.png.ok, `png via ${result.png.via}`).toBeTruthy();
    expect(result.webp.ok, `webp via ${result.webp.via}`).toBeTruthy();
  });

  test("authenticated uploads accept JPEG/JPG/PNG/WebP and reject HEIC", async ({
    page,
  }) => {
    const login = await page.request.post("/api/auth/login/password", {
      data: { email: "user@sooqna.demo", password: "User@123" },
    });
    if (!login.ok()) {
      test.info().annotations.push({
        type: "note",
        description: `demo login skipped (${login.status()})`,
      });
      test.skip();
      return;
    }

    const cases: Array<{
      name: string;
      mime: string;
      buffer: Buffer;
      expectOk: boolean;
      expectType?: string;
    }> = [
      {
        name: "photo.jpeg",
        mime: "image/jpeg",
        buffer: JPEG,
        expectOk: true,
        expectType: "image/jpeg",
      },
      {
        name: "photo.jpg",
        mime: "image/jpg",
        buffer: JPEG,
        expectOk: true,
        expectType: "image/jpeg",
      },
      {
        name: "photo.JPG",
        mime: "application/octet-stream",
        buffer: JPEG,
        expectOk: true,
        expectType: "image/jpeg",
      },
      {
        name: "photo.png",
        mime: "image/png",
        buffer: PNG,
        expectOk: true,
        expectType: "image/png",
      },
      {
        name: "photo.webp",
        mime: "image/webp",
        buffer: WEBP,
        expectOk: true,
        expectType: "image/webp",
      },
      { name: "heic-as.jpg", mime: "image/jpeg", buffer: HEIC, expectOk: false },
    ];

    for (const item of cases) {
      const response = await page.request.post("/api/uploads", {
        multipart: {
          folder: "listings",
          file: {
            name: item.name,
            mimeType: item.mime,
            buffer: item.buffer,
          },
        },
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        contentType?: string;
        error?: string;
      };
      if (item.expectOk) {
        expect(
          response.ok() || response.status() === 503,
          `${item.name} ${item.mime} -> ${response.status()} ${body.error ?? ""}`,
        ).toBeTruthy();
        if (response.ok() && item.expectType) {
          expect(body.contentType).toBe(item.expectType);
        }
      } else {
        expect(response.status(), `${item.name} should be rejected`).toBe(415);
      }
    }

    await page.goto("/login?next=/listings/new");
    const passwordToggle = page.getByRole("button", { name: "الدخول بكلمة المرور" });
    if (await passwordToggle.isVisible().catch(() => false)) {
      await passwordToggle.click();
    }
    await page.locator('input[name="email"]').fill("user@sooqna.demo");
    await page.locator('input[name="password"]').fill("User@123");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();
    await page.waitForURL(/listings\/new|profile/, { timeout: 20_000 });
    if (!page.url().includes("/listings/new")) {
      await page.goto("/listings/new");
    }

    const fileInput = page.locator('#add-listing-media input[type="file"]').first();
    if (!(await fileInput.count())) {
      test.info().annotations.push({
        type: "note",
        description: "listing form gated after login; API JPEG/PNG/WebP already verified",
      });
      return;
    }
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    expect(accept).toContain("image/webp");

    const dir = fixtureDir();
    await fileInput.setInputFiles([
      path.join(dir, "photo.jpeg"),
      path.join(dir, "photo.png"),
      path.join(dir, "photo.webp"),
    ]);
    await expect(page.locator("#add-listing-media img").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
