import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClass =
    variant === "outline"
      ? "border border-[var(--border)] bg-transparent text-[var(--muted)]"
      : "bg-white/80 text-[var(--muted)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}
