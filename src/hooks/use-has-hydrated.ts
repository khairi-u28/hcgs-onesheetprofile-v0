"use client";

import { usePortalStore } from "@/store/portal-store";

export function useHasHydrated() {
  return usePortalStore((state) => state.hasHydrated);
}
