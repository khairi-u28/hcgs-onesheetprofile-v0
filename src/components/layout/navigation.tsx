import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Building,
  LayoutDashboard,
  Map,
  MapPin,
  Upload,
  Users,
} from "lucide-react";

export type NavigationItem = {
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "National workforce overview",
    icon: LayoutDashboard,
  },
  {
    href: "/regions" as Route,
    label: "Regions",
    description: "Directory of all regions",
    icon: Map,
  },
  {
    href: "/areas" as Route,
    label: "Areas",
    description: "Directory of all areas",
    icon: MapPin,
  },
  {
    href: "/branches" as Route,
    label: "Branches",
    description: "Directory of all branches",
    icon: Building,
  },
  {
    href: "/employees",
    label: "Employees",
    description: "Directory and one-sheet destination",
    icon: Users,
  },
  {
    href: "/import",
    label: "Import Data",
    description: "Replace datasets safely",
    icon: Upload,
  },
];
