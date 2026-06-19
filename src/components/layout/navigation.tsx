import type { Route } from "next";

export type NavigationItem = {
  href: Route;
  label: string;
  description: string;
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "National workforce overview",
  },
  {
    href: "/regions/skeleton" as Route,
    label: "Regions",
    description: "Region, area, and branch drilldown",
  },
  {
    href: "/employees",
    label: "Employees",
    description: "Directory and one-sheet destination",
  },
  {
    href: "/import",
    label: "Import Data",
    description: "Replace datasets safely",
  },
];
