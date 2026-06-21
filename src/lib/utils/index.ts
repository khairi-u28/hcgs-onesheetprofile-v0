import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isValid, parseISO, parse } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return "--";
  }
  const date = parseISO(value);

  if (!isValid(date)) {
    return value || "--";
  }

  return format(date, "dd MMM yyyy");
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "No imports yet";
  }

  const date = parseISO(value);

  if (!isValid(date)) {
    return value;
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function resolvePhotoUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  const googleDriveMatch = trimmed.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${googleDriveMatch[1]}`;
  }

  if (trimmed.includes("drive.google.com")) {
    return trimmed.replace(/\/view(\?.*)?$/, "").replace(/\/file\/d\/([^/]+).*$/, "https://drive.google.com/uc?export=view&id=$1");
  }

  return trimmed;
}

export function parsePrimaryDate(raw: string): Date | null {
  const clean = raw.trim();
  if (!clean) return null;

  const formats = [
    // 1. MM/DD/YYYY (primary priority)
    "MM/dd/yyyy",
    "M/d/yyyy",
    "MM-dd-yyyy",
    "M-d-yyyy",
    
    // 2. YYYY-MM-DD
    "yyyy-MM-dd",
    "yyyy-M-d",
    
    // 3. YYYY/MM/DD
    "yyyy/MM/dd",
    "yyyy/M/d",
    
    // 4. DD-MMM-YYYY
    "dd-MMM-yyyy",
    "d-MMM-yyyy",
    "dd-MMMM-yyyy",
    "d-MMMM-yyyy",
    
    // 5. DD/MM/YYYY
    "dd/MM/yyyy",
    "d/M/yyyy",
    "dd-MM-yyyy",
    "d-M-yyyy",
    
    // 6. Year only fallback
    "yyyy"
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(clean, fmt, new Date());
      if (isValid(parsed)) {
        const y = parsed.getFullYear();
        if (y > 1900 && y < 2100) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  // Fallback to parseISO
  try {
    const parsedIso = parseISO(clean);
    if (isValid(parsedIso)) {
      const y = parsedIso.getFullYear();
      if (y > 1900 && y < 2100) {
        return parsedIso;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

export function normalizeDateValue(
  value: string,
  warnings: string[],
  fieldName: string,
  issuesWithMetadata?: any[] // Optional support for rich issues
): string | null {
  const raw = value.trim();
  if (!raw) return null;

  // Preserve now/current/active
  const upperRaw = raw.toUpperCase();
  if (["NOW", "CURRENT", "ACTIVE"].includes(upperRaw)) {
    return raw;
  }

  const parsed = parsePrimaryDate(raw);
  if (parsed) {
    return parsed.toISOString().split("T")[0];
  }

  const msg = `Invalid date format for ${fieldName}: ${value}`;
  warnings.push(msg);
  if (issuesWithMetadata) {
    issuesWithMetadata.push({
      message: msg,
      code: "INVALID_DATE",
      currentValue: value,
    });
  }
  return null;
}
