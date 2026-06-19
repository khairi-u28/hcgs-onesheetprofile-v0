import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[28px] bg-[var(--surface)] px-6 py-7 sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <Badge>{eyebrow}</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
