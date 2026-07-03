import { cn } from "@/lib/utils";

export type LayoutMode = "default" | "compact" | "presentation";
export type SpacingDensity = "comfortable" | "compact" | "auto";
export type SidebarMode = "default" | "compact";

export const UI_LAYOUT_PRESETS = {
  layoutMode: "compact" as LayoutMode,          // default | compact | presentation
  spacingDensity: "auto" as SpacingDensity,     // comfortable | compact | auto
  sidebarMode: "compact" as SidebarMode,        // default | compact
};

// Derived helper functions
export function getSidebarWidths(collapsed: boolean) {
  const isCompact = UI_LAYOUT_PRESETS.sidebarMode === "compact";
  return {
    expanded: isCompact ? "240px" : "280px",
    collapsed: isCompact ? "60px" : "72px",
    current: collapsed
      ? (isCompact ? "60px" : "72px")
      : (isCompact ? "240px" : "280px")
  };
}

export function getLayoutGridStyle(collapsed: boolean) {
  const widths = getSidebarWidths(collapsed);
  return {
    gridTemplateColumns: `${widths.current} minmax(0, 1fr)`
  };
}

export function getSidebarStickyClasses() {
  return "sticky top-4 h-[calc(100vh-2rem)] z-30";
}

export function getMainContentClasses(additional = "") {
  return cn(
    "responsive-container transition-all duration-300",
    additional
  );
}

export function getCardHeaderClasses(additional = "") {
  const hasPaddingOverride = /\bp-\d|\bpx-\d|\bpy-\d/.test(additional);
  return cn(
    "border-b border-[var(--border)] bg-slate-50/50",
    !hasPaddingOverride && "responsive-card-header",
    additional
  );
}

export function getCardContentClasses(additional = "") {
  const hasPaddingOverride = /\bp-\d|\bpx-\d|\bpy-\d/.test(additional);
  return cn(
    !hasPaddingOverride && "responsive-card-content",
    additional
  );
}

export function getTableTdClasses(additional = "") {
  const hasPaddingOverride = /\bp-\d|\bpx-\d|\bpy-\d/.test(additional);
  return cn(
    !hasPaddingOverride && "responsive-table-cell",
    additional
  );
}

export function getTableThClasses(additional = "") {
  const hasPaddingOverride = /\bp-\d|\bpx-\d|\bpy-\d/.test(additional);
  return cn(
    "font-semibold text-[var(--muted)]",
    !hasPaddingOverride && "responsive-table-cell",
    additional
  );
}
