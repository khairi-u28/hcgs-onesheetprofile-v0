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
    href: "/regions" as Route,
    label: "Regions",
    description: "Directory of all regions",
  },
  {
    href: "/areas" as Route,
    label: "Areas",
    description: "Directory of all areas",
  },
  {
    href: "/branches" as Route,
    label: "Branches",
    description: "Directory of all branches",
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
