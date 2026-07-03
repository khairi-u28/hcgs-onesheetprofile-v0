"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Building2, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { navigationItems } from "@/components/layout/navigation";
import { WelcomeScreen } from "@/components/layout/welcome-screen";
import { usePortalStore } from "@/store/portal-store";
import { cn } from "@/lib/utils";
import {
  UI_LAYOUT_PRESETS,
  getLayoutGridStyle,
  getMainContentClasses,
  getSidebarStickyClasses,
} from "@/lib/ui/layout-config";

const SIDEBAR_STORAGE_KEY = "hcgs-sidebar-collapsed";

/** Navigation items that require employee data to be available */
const DATA_DEPENDENT_LABELS = new Set([
  "Dashboard",
  "Regions",
  "Areas",
  "Branches",
  "Employees",
]);

export function PortalShell({ children }: { children: ReactNode }) {
  const employees = usePortalStore((state) => state.employees);
  const hasHydrated = usePortalStore((state) => state.hasHydrated);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const hasData = employees.length > 0;

  // Initialize theme classes and read persisted sidebar state on mount
  useEffect(() => {
    // Apply layout density class overrides to HTML element
    const root = document.documentElement;
    root.classList.remove("theme-comfortable", "theme-compact", "theme-extra-compact");
    if (UI_LAYOUT_PRESETS.layoutMode === "default") {
      root.classList.add("theme-comfortable");
    } else if (UI_LAYOUT_PRESETS.layoutMode === "compact") {
      root.classList.add("theme-compact");
    }

    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // localStorage not available
    }
    setMounted(true);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
  }

  // Prevent flash of unstyled content before hydration
  if (!hasHydrated || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  // First-time experience: show welcome screen if not on import page
  const isOnImportPage = pathname === "/import";
  if (!hasData && !isOnImportPage) {
    const welcomeGridStyle = getLayoutGridStyle(false);
    return (
      <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div
          style={welcomeGridStyle}
          className={cn(
            "mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 transition-[grid-template-columns] duration-300",
            !welcomeGridStyle && "lg:grid-cols-[280px_minmax(0,1fr)]",
          )}
        >
          <Sidebar
            collapsed={false}
            hasData={false}
            pathname={pathname}
            onToggle={toggleSidebar}
          />
          <main className={getMainContentClasses("rounded-[32px] border")}>
            <WelcomeScreen />
          </main>
        </div>
      </div>
    );
  }

  const mainGridStyle = getLayoutGridStyle(collapsed);
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div
        style={mainGridStyle}
        className={cn(
          "mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 transition-[grid-template-columns] duration-300",
          !mainGridStyle &&
            (collapsed
              ? "lg:grid-cols-[72px_minmax(0,1fr)]"
              : "lg:grid-cols-[280px_minmax(0,1fr)]"),
        )}
      >
        <Sidebar
          collapsed={collapsed}
          hasData={hasData}
          pathname={pathname}
          onToggle={toggleSidebar}
        />
        <main className={getMainContentClasses("rounded-[32px] border")}>
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}

/* ─── Sidebar ──────────────────────────────────────────────────────── */

function Sidebar({
  collapsed,
  hasData,
  pathname,
  onToggle,
}: {
  collapsed: boolean;
  hasData: boolean;
  pathname: string;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "glass-panel hidden flex-col justify-between rounded-[32px] border transition-all duration-300 lg:flex",
        collapsed ? "p-3" : "p-6",
        getSidebarStickyClasses(),
      )}
    >
      <div className={cn("space-y-6", collapsed && "space-y-4")}>
        {/* Branding */}
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                HCGS
              </p>
              <h1 className="text-lg font-semibold tracking-[-0.03em]">
                One Sheet Profile
              </h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("space-y-1", collapsed && "space-y-2")}>
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const isLocked =
              !hasData && DATA_DEPENDENT_LABELS.has(item.label);

            if (collapsed) {
              return (
                <CollapsedNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon className="h-[18px] w-[18px]" />}
                  isActive={isActive}
                  isLocked={isLocked}
                />
              );
            }

            return (
              <ExpandedNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                description={item.description}
                icon={<item.icon className="h-[18px] w-[18px]" />}
                isActive={isActive}
                isLocked={isLocked}
              />
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mt-4 flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-white/60 hover:text-[var(--foreground)]",
          collapsed && "justify-center",
        )}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

/* ─── Expanded nav item ────────────────────────────────────────────── */

function ExpandedNavItem({
  href,
  label,
  description,
  icon,
  isActive,
  isLocked,
}: {
  href: Route;
  label: string;
  description: string;
  icon: ReactNode;
  isActive: boolean;
  isLocked: boolean;
}) {
  const baseClass = cn(
    "block rounded-[20px] border px-4 py-3 transition duration-200",
    isActive
      ? "border-[var(--border)] bg-white/80 shadow-sm"
      : "border-transparent hover:border-[var(--border)] hover:bg-white/60",
    isLocked && "pointer-events-none opacity-50",
  );

  const content = (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isActive
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--surface)] text-[var(--muted)]",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
          {description}
        </p>
      </div>
      {isLocked && <Lock className="h-3.5 w-3.5 text-[var(--muted)]" />}
    </div>
  );

  if (isLocked) {
    return (
      <div className={baseClass} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={baseClass}>
      {content}
    </Link>
  );
}

/* ─── Collapsed nav item ───────────────────────────────────────────── */

function CollapsedNavItem({
  href,
  label,
  icon,
  isActive,
  isLocked,
}: {
  href: Route;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isLocked: boolean;
}) {
  const baseClass = cn(
    "group relative flex items-center justify-center rounded-xl border p-2.5 transition duration-200",
    isActive
      ? "border-[var(--border)] bg-white/80 shadow-sm"
      : "border-transparent hover:border-[var(--border)] hover:bg-white/60",
    isLocked && "pointer-events-none opacity-50",
  );

  const tooltip = (
    <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
      {label}
      {isLocked && " (Locked)"}
    </span>
  );

  const iconEl = (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        isActive
          ? "bg-[var(--accent)] text-white"
          : "bg-[var(--surface)] text-[var(--muted)]",
      )}
    >
      {icon}
    </div>
  );

  if (isLocked) {
    return (
      <div className={baseClass} aria-disabled="true">
        {iconEl}
        {tooltip}
      </div>
    );
  }

  return (
    <Link href={href} className={baseClass}>
      {iconEl}
      {tooltip}
    </Link>
  );
}
