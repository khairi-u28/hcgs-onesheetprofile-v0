/**
 * Converts an organization name to a URL-safe slug.
 * - trim, lowercase
 * - replace non-alphanumeric sequences with "-"
 * - remove leading/trailing "-"
 *
 * Examples:
 *   "HEAD OFFICE"            → "head-office"
 *   "DKI,JABAR,PRIME FLEET"  → "dki-jabar-prime-fleet"
 *   "JATIM"                  → "jatim"
 */
function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Slugify a region name for use in /regions/[regionId] routes. */
export function slugifyRegionName(name: string): string {
  return toSlug(name);
}

/**
 * Slugify any organization entity name (area, region, branch name) for URL routing.
 * Use this for /areas/[areaId] and any future org-level routes.
 */
export function slugifyOrganizationName(name: string): string {
  return toSlug(name);
}
