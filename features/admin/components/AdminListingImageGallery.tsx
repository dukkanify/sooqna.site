"use client";

import { useState, type DragEvent } from "react";
import { uploadListingImages } from "@/services/upload";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const MAX_IMAGES = 12;

type AdminListingImageGalleryProps = {
  images: string[];
  onChange: (images: string[]) => void;
  uploading?: boolean;
  onUploadingChange?: (busy: boolean) => void;
};

export function AdminListingImageGallery({
  images,
  onChange,
  uploading = false,
  onUploadingChange,
}: AdminListingImageGalleryProps) {
  const [urlDraft, setUrlDraft] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setImages(next: string[]) {
    onChange(next.filter(Boolean).slice(0, MAX_IMAGES));
  }

  async function uploadFiles(fileList: FileList | File[] | null) {
    const files = Array.from(fileList ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`الحد الأقصى ${MAX_IMAGES} صور.`);
      return;
    }
    setError(null);
    onUploadingChange?.(true);
    try {
      // Same durable path as sellers: S3 when configured, otherwise data URLs
      // (never ephemeral /api/media on serverless).
      const next = await uploadListingImages(files.slice(0, room));
      if (!next.length) {
        setError("تعذر رفع الصور. حاول مرة أخرى.");
        return;
      }
      const merged = [...images];
      for (const url of next) {
        if (!merged.includes(url)) merged.push(url);
      }
      setImages(merged);
      if (next.length < files.slice(0, room).length) {
        setError("رُفعت بعض الصور فقط — أعد محاولة الباقي.");
      }
    } catch {
      setError("تعذر رفع الصور. حاول مرة أخرى.");
    } finally {
      onUploadingChange?.(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    void uploadFiles(event.dataTransfer.files);
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setImages(next);
  }

  function setCover(index: number) {
    if (index <= 0) return;
    const url = images[index];
    setImages([url, ...images.filter((_, i) => i !== index)]);
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function addUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("/api/media/")) {
      setError("رابط /api/media غير دائم — ارفع الصورة من الجهاز أو استخدم رابطاً عاماً.");
      return;
    }
    if (images.includes(trimmed)) {
      setUrlDraft("");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setError(`الحد الأقصى ${MAX_IMAGES} صور.`);
      return;
    }
    setImages([...images, trimmed]);
    setUrlDraft("");
    setError(null);
  }

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="grid gap-3">
      <div
        className={`rounded-[var(--radius-xl)] border border-dashed p-3 transition ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-surface-muted/30"
        }`}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={onDrop}
      >
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {images.map((url, index) => (
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
                key={`${url.slice(0, 48)}-${index}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="size-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  src={url}
                />
                {index === 0 ? (
                  <span className="absolute start-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    الغلاف
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-0.5 bg-ink/65 p-1">
                  {index > 0 ? (
                    <button
                      className="rounded bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold text-ink"
                      onClick={() => setCover(index)}
                      type="button"
                    >
                      غلاف
                    </button>
                  ) : null}
                  <button
                    className="rounded bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold text-ink"
                    disabled={index === 0}
                    onClick={() => moveImage(index, index - 1)}
                    type="button"
                  >
                    ›
                  </button>
                  <button
                    className="rounded bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold text-ink"
                    disabled={index === images.length - 1}
                    onClick={() => moveImage(index, index + 1)}
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    className="ms-auto rounded bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold text-red-700"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {canAdd ? (
              <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-2 text-center text-xs font-semibold text-primary transition hover:bg-surface-muted/50">
                <input
                  accept="image/*"
                  aria-label="إضافة صور"
                  className="sr-only"
                  disabled={uploading}
                  multiple
                  onChange={(event) => {
                    void uploadFiles(event.target.files);
                    event.target.value = "";
                  }}
                  type="file"
                />
                <span>{uploading ? "جاري الرفع…" : "+ إضافة صور"}</span>
              </label>
            ) : null}
          </div>
        ) : (
          <label className="grid min-h-36 cursor-pointer place-items-center gap-2 p-4 text-center">
            <input
              accept="image/*"
              aria-label="رفع صور الإعلان"
              className="sr-only"
              disabled={uploading}
              multiple
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
            <span className="text-sm font-semibold text-ink">
              {uploading ? "جاري رفع الصور…" : "اسحب الصور هنا أو اضغط للاختيار"}
            </span>
            <span className="text-xs text-muted">
              عدة صور دفعة واحدة — الأولى تصبح الغلاف
            </span>
          </label>
        )}
      </div>

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setShowUrl((prev) => !prev)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {showUrl ? "إخفاء الرابط" : "إضافة برابط (اختياري)"}
        </Button>
        <p className="text-[11px] text-muted">
          {images.length}/{MAX_IMAGES} صور
        </p>
      </div>

      {showUrl ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="رابط صورة"
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://…"
            value={urlDraft}
          />
          <Button
            onClick={addUrl}
            size="sm"
            type="button"
            variant="secondary"
          >
            إضافة
          </Button>
        </div>
      ) : null}
    </div>
  );
}
