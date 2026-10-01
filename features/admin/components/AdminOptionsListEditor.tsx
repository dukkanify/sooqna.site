"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

export type AdminListOption = {
  label: string;
  value: string;
};

type AdminOptionsListEditorProps = {
  options: AdminListOption[];
  onChange: (options: AdminListOption[]) => void;
  /** `pair` = اسم + قيمة. `label-only` = اسم فقط (القيمة تُطابق الاسم). */
  mode?: "pair" | "label-only";
  title?: string;
  description?: string;
  addButtonLabel?: string;
  labelFieldLabel?: string;
  valueFieldLabel?: string;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  emptyText?: string;
  className?: string;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

/**
 * Professional list editor for admin desks — no comma / label:value typing.
 */
export function AdminOptionsListEditor({
  options,
  onChange,
  mode = "pair",
  title = "خيارات القائمة",
  description = "أضف الخيارات التي تظهر للمستخدم في القائمة. رتّبها بالسحب أو بأزرار الترتيب.",
  addButtonLabel = "إضافة خيار جديد",
  labelFieldLabel = "اسم الخيار",
  valueFieldLabel = "القيمة",
  labelPlaceholder = "مثال: شقة",
  valuePlaceholder = "مثال: apartment",
  emptyText = "لا توجد خيارات بعد — أضف الخيار الأول.",
  className = "",
}: AdminOptionsListEditorProps) {
  const baseId = useId();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function updateRow(index: number, patch: Partial<AdminListOption>) {
    onChange(
      options.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, ...patch };
        if (mode === "label-only" && patch.label !== undefined) {
          next.value = patch.label;
        } else if (
          patch.label !== undefined &&
          (row.value === row.label || !row.value.trim())
        ) {
          next.value = patch.label;
        }
        return next;
      }),
    );
  }

  function addRow() {
    onChange([...options, { label: "", value: "" }]);
  }

  function removeRow(index: number) {
    onChange(options.filter((_, rowIndex) => rowIndex !== index));
  }

  function reorder(from: number, to: number) {
    onChange(moveItem(options, from, to));
  }

  return (
    <div
      className={`admin-options-editor grid gap-2.5 rounded-[var(--radius-xl)] border border-border bg-surface/50 p-3 sm:col-span-2 ${className}`.trim()}
    >
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>

      {options.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="grid gap-2">
          {options.map((option, index) => {
            const isDragging = dragIndex === index;
            const isDropTarget = dropIndex === index && dragIndex !== index;
            return (
              <li
                key={`${baseId}-${index}`}
                className={`admin-options-editor__row grid gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-2.5 transition-shadow ${
                  mode === "pair"
                    ? "sm:grid-cols-[auto_1fr_1fr_auto]"
                    : "sm:grid-cols-[auto_1fr_auto]"
                } sm:items-end ${isDragging ? "opacity-60" : ""} ${
                  isDropTarget ? "ring-2 ring-secondary/50" : ""
                }`}
                draggable
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDragLeave={() => {
                  setDropIndex((current) => (current === index ? null : current));
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropIndex(index);
                }}
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
                  reorder(from, index);
                  setDragIndex(null);
                  setDropIndex(null);
                }}
              >
                <div className="flex items-center gap-1 sm:pb-2">
                  <span
                    aria-hidden
                    className="admin-options-editor__grip inline-flex h-9 w-8 cursor-grab items-center justify-center rounded-[var(--radius-md)] text-muted active:cursor-grabbing"
                    title="اسحب لإعادة الترتيب"
                  >
                    <Icon name="menu" size={16} />
                  </span>
                  <span className="min-w-6 text-center text-xs font-bold text-muted tabular-nums">
                    {index + 1}
                  </span>
                </div>

                <Input
                  label={labelFieldLabel}
                  onChange={(event) => updateRow(index, { label: event.target.value })}
                  placeholder={labelPlaceholder}
                  value={option.label}
                />

                {mode === "pair" ? (
                  <Input
                    label={valueFieldLabel}
                    onChange={(event) => updateRow(index, { value: event.target.value })}
                    placeholder={valuePlaceholder}
                    value={option.value}
                  />
                ) : null}

                <div className="flex flex-wrap items-center gap-1 sm:justify-end sm:pb-0.5">
                  <Button
                    aria-label="نقل لأعلى"
                    disabled={index === 0}
                    onClick={() => reorder(index, index - 1)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    أعلى
                  </Button>
                  <Button
                    aria-label="نقل لأسفل"
                    disabled={index === options.length - 1}
                    onClick={() => reorder(index, index + 1)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    أسفل
                  </Button>
                  <Button
                    aria-label="حذف الخيار"
                    onClick={() => removeRow(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Icon name="close" size={14} />
                      حذف
                    </span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Button onClick={addRow} size="sm" type="button" variant="secondary">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="plus" size={14} />
            {addButtonLabel}
          </span>
        </Button>
      </div>
    </div>
  );
}
