import { isValid, parse, parseISO } from "date-fns";
import { z } from "zod";
import type { EmployeeRecord, PkRating } from "@/types";

const employeeCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required"),
  Nama: z.string().trim().min(1, "Nama is required"),
  Position: z.string().trim().min(1, "Position is required"),
  POS: z.string().trim().min(1, "POS is required"),
  "Branch Code": z.string().trim().min(1, "Branch Code is required"),
  "Region/Div": z.string().trim().default(""),
  "Area/Dept": z.string().trim().default(""),
  "Entry Date": z.string().trim().min(1, "Entry Date is required"),
  "Date of Birth": z.string().trim().min(1, "Date of Birth is required"),
  "Masa Kerja Total": z.string().trim().default(""),
  "Masa Kerja Jabatan": z.string().trim().default(""),
  "Masa Kerja Cabang": z.string().trim().default(""),
  HAV: z.string().trim().min(1, "HAV is required"),
  "Last Dev'l Program": z.string().trim().default(""),
  "Status Dev'l Program": z.string().trim().default(""),
  "Periode Dev'l Program": z.string().trim().default(""),
  Gol: z.string().trim().default(""),
  "KPI Mid Year": z.string().trim().default(""),
  "KPI Full Year": z.string().trim().default(""),
  "PK 2023": z.string().trim().default(""),
  "PK 2024": z.string().trim().default(""),
  "PK 2025": z.string().trim().default(""),
  "Link Photo": z.string().trim().default(""),
  "Strength 1": z.string().trim().default(""),
  "Strength 2": z.string().trim().default(""),
  "Areas of Development 1": z.string().trim().default(""),
  "Areas of Development 2": z.string().trim().default(""),
  "Level Pendidikan Terakhir": z.string().trim().default(""),
  "Institusi Pendidikan Terakhir": z.string().trim().default(""),
});

const pkRatingSchema = z.enum(["BS", "B+", "B", "C+", "C", "K"]);

function normalizeDate(value: string) {
  const raw = value.trim();

  const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"];

  const isoDate = parseISO(raw);
  if (isValid(isoDate)) {
    return isoDate.toISOString();
  }

  for (const dateFormat of formats) {
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }

  throw new Error(`Invalid date: ${value}`);
}

function normalizeRatio(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace("%", "");
  const numericValue = Number(normalized);

  if (Number.isNaN(numericValue)) {
    throw new Error(`Invalid KPI value: ${value}`);
  }

  return raw.includes("%") || numericValue > 1 ? numericValue / 100 : numericValue;
}

function normalizePk(value: string): PkRating | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  return pkRatingSchema.parse(raw);
}

function parseHav(value: string) {
  const raw = value.trim();
  const match = raw.match(/^(.*?)(?:\(([\d.]+)\))?$/);

  if (!match) {
    throw new Error(`Invalid HAV value: ${value}`);
  }

  return {
    havCategory: match[1].trim(),
    havScore: match[2] ? Number(match[2]) : null,
    havRaw: raw,
  };
}

export function validateEmployeeCsvRow(
  row: Record<string, string>,
  validBranchCodes: Set<string>,
) {
  const parsed = employeeCsvRowSchema.parse(row);

  if (!validBranchCodes.has(parsed["Branch Code"].toUpperCase())) {
    throw new Error(`Unknown Branch Code: ${parsed["Branch Code"]}`);
  }

  let hav = {
    havCategory: parsed.HAV || "",
    havScore: null as number | null,
    havRaw: parsed.HAV || "",
  };

  try {
    if (parsed.HAV) {
      hav = parseHav(parsed.HAV);
    }
  } catch (error) {
    // Tolerate malformed HAV values and proceed with defaults
  }

  // If original row contains a custom havRaw value, preserve it
  if (row["havRaw"]) {
    hav.havRaw = row["havRaw"];
  }

  const employee: EmployeeRecord = {
    nrp: parsed.NRP,
    name: parsed.Nama,
    position: parsed.Position,
    pos: parsed.POS,
    branchCode: parsed["Branch Code"],
    regionDiv: parsed["Region/Div"],
    areaDept: parsed["Area/Dept"],
    entryDate: normalizeDate(parsed["Entry Date"]),
    dateOfBirth: normalizeDate(parsed["Date of Birth"]),
    masaKerjaTotal: parsed["Masa Kerja Total"],
    masaKerjaJabatan: parsed["Masa Kerja Jabatan"],
    masaKerjaCabang: parsed["Masa Kerja Cabang"],
    havCategory: hav.havCategory,
    havScore: hav.havScore,
    havRaw: hav.havRaw,
    lastDevelopmentProgram: parsed["Last Dev'l Program"],
    developmentProgramStatus: parsed["Status Dev'l Program"],
    developmentProgramPeriod: parsed["Periode Dev'l Program"],
    golongan: parsed.Gol,
    kpiMidYear: normalizeRatio(parsed["KPI Mid Year"]),
    kpiFullYear: normalizeRatio(parsed["KPI Full Year"]),
    pk2023: normalizePk(parsed["PK 2023"]),
    pk2024: normalizePk(parsed["PK 2024"]),
    pk2025: normalizePk(parsed["PK 2025"]),
    photoUrl: parsed["Link Photo"],
    strength1: parsed["Strength 1"],
    strength2: parsed["Strength 2"],
    developmentArea1: parsed["Areas of Development 1"],
    developmentArea2: parsed["Areas of Development 2"],
    educationLevel: parsed["Level Pendidikan Terakhir"],
    educationInstitution: parsed["Institusi Pendidikan Terakhir"],
  };

  return employee;
}
