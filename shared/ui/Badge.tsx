import type { HTMLAttributes, ReactNode } from "react";
import { Copy } from "@/shared/i18n/LocalizedTree";

type BadgeVariant =
  | "verified"
  | "premium"
  | "escrow"
  | "featured"
  | "new"
  | "sold"
  | "pending"
  | "rejected"
  | "muted"
  | "demo";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  verified: "border-emerald-600/20 bg-emerald-50 text-emerald-700",
  premium: "border-secondary/35 bg-secondary-soft text-[#8a7040]",
  escrow: "border-success/20 bg-success-soft text-success",
  featured:
    "border-[#a88642]/55 bg-gradient-to-br from-[#f0d89a] via-[#c9a45c] to-[#a88642] text-[#1a1408] shadow-[inset_0_1px_0_rgb(255_255_255/40%)]",
  new: "border-sky-500/25 bg-sky-50 text-sky-700",
  sold: "border-border bg-surface-muted text-muted",
  pending: "border-amber-500/25 bg-amber-50 text-amber-800",
  rejected: "border-rose-500/20 bg-rose-50 text-rose-700",
  muted: "border-border bg-surface-muted text-muted",
  demo: "border-slate-400/40 bg-slate-100 text-slate-700",
};

export function Badge({
  children,
  className = "",
  variant = "featured",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-lg)] border px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {typeof children === "string" ? <Copy text={children} /> : children}
    </span>
  );
}
