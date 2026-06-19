import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
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

export function formatDateLabel(value: string) {
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
