import { z } from "zod";
import type { EmployeeRecord, PkRating } from "@/types";
import { HAV_MASTER } from "@/types/employee";
import { normalizeDateValue } from "@/lib/utils";
import { parseMasaKerja } from "@/lib/utils/tenure";

const employeeCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required").transform((val) => val.toUpperCase()),
  Nama: z.string().trim().min(1, "Nama is required"),
  Position: z.string().trim().default(""),
  POS: z.string().trim().default(""),
  "Branch Code": z.string().trim().default(""),
  "Region/Div": z.string().trim().default(""),
  "Area/Dept": z.string().trim().default(""),
  "Entry Date": z.string().trim().default(""),
  "Date of Birth": z.string().trim().default(""),
  "Masa Kerja Total": z.string().trim().default(""),
  "Masa Kerja Jabatan": z.string().trim().default(""),
  "Masa Kerja Cabang": z.string().trim().default(""),
  HAV: z.string().trim().default(""),
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

function normalizePk(value: string, warnings: string[], fieldName: string, richWarnings?: any[]): PkRating | null {
  const raw = value.trim();
  return raw || null;
}

function validateGolongan(value: string, warnings: string[], richWarnings?: any[]): string {
  return value.trim();
}

function validatePhotoUrl(value: string, warnings: string[], richWarnings?: any[]): string {
  const raw = value.trim();
  if (!raw) return "";
  if (!raw.startsWith("http://") && !raw.startsWith("https://") && !raw.includes("pravatar.cc")) {
    const msg = `Malformed photo URL: ${value}`;
    warnings.push(msg);
    if (richWarnings) {
      richWarnings.push({
        message: msg,
        code: "INVALID_PHOTO_URL",
        currentValue: value,
      });
    }
  }
  return raw;
}

export function parseHavValue(raw: string, warnings: string[], richWarnings?: any[]): {
  havId: number | null;
  havCategory: string | null;
  havRaw: string;
} {
  const trimmed = raw.trim();
  const uncategorizedValues = new Set([
    "#N/A", "N/A", "NA", "-", "",
    "NULL", "null", "None", "NONE"
  ]);
  if (uncategorizedValues.has(trimmed) || uncategorizedValues.has(trimmed.toUpperCase())) {
    return {
      havId: null,
      havCategory: "Uncategorized",
      havRaw: trimmed,
    };
  }

  // 1. Try to extract integer ID from parentheses, e.g. "Strong Performer (8)", "(8) Strong Performer", "(8)Strong Performer"
  const idMatch = trimmed.match(/\((\d+)\)/);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    if (id >= 1 && id <= 16) {
      return {
        havId: id,
        havCategory: HAV_MASTER[id as keyof typeof HAV_MASTER],
        havRaw: trimmed,
      };
    }
  }

  // 2. Clean category text (remove parentheses and any contents inside)
  const cleanText = trimmed.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  
  // Case-insensitive/whitespace-insensitive match
  const normalized = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Match canonical categories
  let canonicalName: string | null = null;
  switch (normalized) {
    case "star": canonicalName = "Star"; break;
    case "futurestar": canonicalName = "Future Star"; break;
    case "potentialcandidate": canonicalName = "Potential Candidate"; break;
    case "rawdiamond": canonicalName = "Raw Diamond"; break;
    case "candidate": canonicalName = "Candidate"; break;
    case "topperformer": canonicalName = "Top Performer"; break;
    case "strongperformer": canonicalName = "Strong Performer"; break;
    case "careerperson": canonicalName = "Career Person"; break;
    case "mostunfitemployee": canonicalName = "Most Unfit Employee"; break;
    case "unfitemployee": canonicalName = "Unfit Employee"; break;
    case "problememployee": canonicalName = "Problem Employee"; break;
    case "maximalcontributor": canonicalName = "Maximal Contributor"; break;
    case "contributor": canonicalName = "Contributor"; break;
    case "minimalcontributor": canonicalName = "Minimal Contributor"; break;
    case "deadwood": canonicalName = "Dead Wood"; break;
  }

  if (canonicalName) {
    return {
      havId: null,
      havCategory: canonicalName,
      havRaw: trimmed,
    };
  } else {
    return {
      havId: null,
      havCategory: null,
      havRaw: trimmed,
    };
  }
}

export function validateEmployeeCsvRow(
  row: Record<string, string>,
  validBranchCodes: Set<string>,
): { data: EmployeeRecord; warnings: string[]; richWarnings?: any[] } {
  const warnings: string[] = [];
  const richWarnings: any[] = [];
  const parsed = employeeCsvRowSchema.parse(row);

  const sampleNrps = new Set(["EX0001", "EX0002", "EX0003", "EX0004", "EX0005"]);
  if (sampleNrps.has(parsed.NRP)) {
    const msg = `Sample template data detected (NRP: ${parsed.NRP})`;
    warnings.push(msg);
    richWarnings.push({
      message: msg,
      code: "TEMPLATE_SAMPLE_DATA",
      currentValue: parsed.NRP,
    });
  }

  // Removed UNKNOWN_BRANCH check to align with Production Compatibility Mode
  const havResult = parseHavValue(parsed.HAV, warnings, richWarnings);

  // Derive score if missing but havId exists
  let derivedScore: number | null = null;
  const idMatch = parsed.HAV.match(/\(([\d.]+)\)/);
  if (idMatch) {
    derivedScore = parseFloat(idMatch[1]);
  } else if (havResult.havId !== null) {
    derivedScore = havResult.havId;
  }

  const employee: EmployeeRecord = {
    nrp: parsed.NRP,
    name: parsed.Nama,
    position: parsed.Position,
    pos: parsed.POS,
    branchCode: parsed["Branch Code"],
    regionDiv: parsed["Region/Div"],
    areaDept: parsed["Area/Dept"],
    entryDate: normalizeDateValue(parsed["Entry Date"], warnings, "Entry Date", richWarnings),
    dateOfBirth: normalizeDateValue(parsed["Date of Birth"], warnings, "Date of Birth", richWarnings),
    masaKerjaTotal: parseMasaKerja(parsed["Masa Kerja Total"]).normalized,
    masaKerjaJabatan: parseMasaKerja(parsed["Masa Kerja Jabatan"]).normalized,
    masaKerjaCabang: parseMasaKerja(parsed["Masa Kerja Cabang"]).normalized,
    masaKerjaTotalRaw: parseMasaKerja(parsed["Masa Kerja Total"]).raw,
    masaKerjaJabatanRaw: parseMasaKerja(parsed["Masa Kerja Jabatan"]).raw,
    masaKerjaCabangRaw: parseMasaKerja(parsed["Masa Kerja Cabang"]).raw,
    havCategory: havResult.havCategory,
    havScore: derivedScore,
    havRaw: havResult.havRaw,
    havId: havResult.havId,
    lastDevelopmentProgram: parsed["Last Dev'l Program"],
    developmentProgramStatus: parsed["Status Dev'l Program"],
    developmentProgramPeriod: parsed["Periode Dev'l Program"],
    golongan: validateGolongan(parsed.Gol, warnings, richWarnings),
    kpiMidYear: normalizeRatio(parsed["KPI Mid Year"]),
    kpiFullYear: normalizeRatio(parsed["KPI Full Year"]),
    pk2023: normalizePk(parsed["PK 2023"], warnings, "PK 2023", richWarnings),
    pk2024: normalizePk(parsed["PK 2024"], warnings, "PK 2024", richWarnings),
    pk2025: normalizePk(parsed["PK 2025"], warnings, "PK 2025", richWarnings),
    photoUrl: validatePhotoUrl(parsed["Link Photo"], warnings, richWarnings),
    strength1: parsed["Strength 1"],
    strength2: parsed["Strength 2"],
    developmentArea1: parsed["Areas of Development 1"],
    developmentArea2: parsed["Areas of Development 2"],
    educationLevel: parsed["Level Pendidikan Terakhir"],
    educationInstitution: parsed["Institusi Pendidikan Terakhir"],
  };

  return { data: employee, warnings, richWarnings };
}
