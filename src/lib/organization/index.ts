import organizationSource from "@/data/organization.json";
import { organizationDatasetSchema } from "@/lib/validators/organization";
import type { OrganizationBranch, OrganizationFilters } from "@/types";

const organizationDataset = organizationDatasetSchema.parse(organizationSource);

function normalizeKey(value: string) {
  return value.trim().toUpperCase();
}

export function getOrganizationBranches() {
  return organizationDataset;
}

export function getOrganizationByBranchCode(branchCode: string) {
  return organizationDataset.find(
    (branch) => normalizeKey(branch.branchCode) === normalizeKey(branchCode),
  );
}

export function getRegions() {
  return [...new Set(organizationDataset.map((branch) => branch.region))].sort();
}

export function getAreasByRegion(region: string) {
  return [
    ...new Set(
      organizationDataset
        .filter((branch) => normalizeKey(branch.region) === normalizeKey(region))
        .map((branch) => branch.area),
    ),
  ].sort();
}

export function getBranches(filters: OrganizationFilters = {}) {
  return organizationDataset.filter((branch) => {
    if (
      filters.region &&
      normalizeKey(branch.region) !== normalizeKey(filters.region)
    ) {
      return false;
    }

    if (filters.area && normalizeKey(branch.area) !== normalizeKey(filters.area)) {
      return false;
    }

    return true;
  });
}

export function buildOrganizationLookup() {
  return organizationDataset.reduce<Record<string, OrganizationBranch>>(
    (accumulator, branch) => {
      accumulator[normalizeKey(branch.branchCode)] = branch;
      return accumulator;
    },
    {},
  );
}
