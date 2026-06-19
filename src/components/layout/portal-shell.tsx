import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { navigationItems } from "@/components/layout/navigation";
import { DatasetStatus } from "@/components/layout/dataset-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel flex flex-col justify-between rounded-[32px] border p-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge>Foundation Phase</Badge>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    HCGS
                  </p>
                  <h1 className="text-xl font-semibold tracking-[-0.03em]">
                    One Sheet Profile
                  </h1>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--muted)]">
                A frontend-only workforce visibility platform built around
                dataset replacement, drilldown navigation, and premium employee
                profiles.
              </p>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-[24px] border border-transparent px-4 py-4 transition hover:border-[var(--border)] hover:bg-white/75",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Build Order
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              Foundation first: types, import engine, state, shared layout, then
              directory, one sheet, drilldowns, and analytics.
            </p>
            <Button asChild className="mt-5 w-full justify-between">
              <Link href="/import">Review Import Foundation</Link>
            </Button>
          </div>
        </aside>

        <main className="glass-panel rounded-[32px] border p-5 sm:p-7 lg:p-8">
          <header className="grid gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--card-strong)] p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge>Executive Workspace</Badge>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Foundation scaffold for a workforce analytics portal, not an
                  admin system.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
                  The app shell is ready for dataset-driven drilldowns, an
                  employee intelligence directory, and a premium one-sheet
                  profile flow.
                </p>
              </div>
            </div>
            <DatasetStatus />
          </header>

          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
