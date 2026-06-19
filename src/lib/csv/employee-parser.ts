import Papa from "papaparse";
import { validateEmployeeCsvRow } from "@/lib/validators/employee";
import type { EmployeeRecord, ParsedDatasetResult } from "@/types";

const ALIAS_MAP: Record<string, string[]> = {
  NRP: ["NRP", "nrp"],
  Nama: ["Nama", "Name", "name"],
  Position: ["Position", "position"],
  POS: ["POS", "pos"],
  "Branch Code": ["Branch Code", "branchCode"],
  "Region/Div": ["Region/Div", "regionDiv"],
  "Area/Dept": ["Area/Dept", "areaDept"],
  "Entry Date": ["Entry Date", "entryDate"],
  "Date of Birth": ["Date of Birth", "dateOfBirth"],
  "Masa Kerja Total": ["Masa Kerja Total", "masaKerjaTotal"],
  "Masa Kerja Jabatan": ["Masa Kerja Jabatan", "masaKerjaJabatan"],
  "Masa Kerja Cabang": ["Masa Kerja Cabang", "masaKerjaCabang"],
  "Last Dev'l Program": ["Last Dev'l Program", "lastDevelopmentProgram"],
  "Status Dev'l Program": ["Status Dev'l Program", "developmentProgramStatus"],
  "Periode Dev'l Program": ["Periode Dev'l Program", "developmentProgramPeriod"],
  Gol: ["Gol", "golongan"],
  "KPI Mid Year": ["KPI Mid Year", "kpiMidYear"],
  "KPI Full Year": ["KPI Full Year", "kpiFullYear"],
  "PK 2023": ["PK 2023", "pk2023"],
  "PK 2024": ["PK 2024", "pk2024"],
  "PK 2025": ["PK 2025", "pk2025"],
  "Link Photo": ["Link Photo", "photoUrl"],
  "Strength 1": ["Strength 1", "strength1"],
  "Strength 2": ["Strength 2", "strength2"],
  "Areas of Development 1": ["Areas of Development 1", "developmentArea1"],
  "Areas of Development 2": ["Areas of Development 2", "developmentArea2"],
  "Level Pendidikan Terakhir": ["Level Pendidikan Terakhir", "educationLevel"],
  "Institusi Pendidikan Terakhir": ["Institusi Pendidikan Terakhir", "educationInstitution"],
};

export function preprocessEmployeeCsv(csvText: string): string {
  // Deprecated: String preprocessing is no longer used to avoid quoted-field corruption.
  // We return the original text untouched and handle repairs at the row array level instead.
  return csvText;
}

function normalizeEmployeeRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  // Default all schema keys to empty string to avoid missing required key validation failures
  Object.keys(ALIAS_MAP).forEach((key) => {
    normalized[key] = "";
  });
  normalized["HAV"] = "";

  const keys = Object.keys(row);

  for (const [targetKey, aliases] of Object.entries(ALIAS_MAP)) {
    const matchingAlias = aliases.find((alias) =>
      keys.some((k) => k.trim() === alias),
    );
    if (matchingAlias !== undefined) {
      const actualKey = keys.find((k) => k.trim() === matchingAlias)!;
      normalized[targetKey] = row[actualKey];
    }
  }

  // Synthesize HAV column if needed
  const hasHav = keys.some((k) => k.trim() === "HAV");
  if (hasHav) {
    const actualKey = keys.find((k) => k.trim() === "HAV")!;
    normalized["HAV"] = row[actualKey];
  } else {
    const categoryKey = keys.find((k) =>
      ["havCategory", "havRaw"].includes(k.trim()),
    );
    const scoreKey = keys.find((k) =>
      ["havScore", "HAV Score"].includes(k.trim()),
    );
    if (categoryKey) {
      const category = row[categoryKey];
      const score = scoreKey ? row[scoreKey] : "";
      normalized["HAV"] = score ? `${category} (${score})` : category;
    }
  }

  // Keep raw havRaw value if present (e.g. B,B,C in UAT data)
  const havRawKey = keys.find((k) =>
    ["havRaw", "HAV Raw", "hav_raw"].includes(k.trim()),
  );
  if (havRawKey) {
    normalized["havRaw"] = row[havRawKey];
  }

  return normalized;
}

export function parseEmployeeDataset(
  csvText: string,
  validBranchCodes: Set<string>,
): ParsedDatasetResult<EmployeeRecord> {
  // Parse with PapaParse header: false first to avoid throwing error on raw comma columns
  const parseResult = Papa.parse<string[]>(csvText, {
    skipEmptyLines: "greedy",
  });

  if (parseResult.errors.length > 0) {
    // Only throw critical syntax errors, ignore FieldMismatch errors if we handle them
    const criticalErrors = parseResult.errors.filter(
      (err) => err.code !== "TooManyFields" && err.code !== "TooFewFields",
    );
    if (criticalErrors.length > 0) {
      throw new Error(criticalErrors.map((error) => error.message).join("; "));
    }
  }

  const rows = parseResult.data;
  if (rows.length === 0) {
    return { data: [], issues: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const expectedCount = headers.length;

  const havRawIndex = headers.findIndex((h) =>
    ["havRaw", "HAV Raw", "hav_raw", "HAV", "hav"].includes(h),
  );

  const seenNrps = new Set<string>();
  const data: EmployeeRecord[] = [];
  const issues: ParsedDatasetResult<EmployeeRecord>["issues"] = [];

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    try {
      let cleanRow = [...rawRow];

      // If we have extra elements and a valid HAV index, merge them
      if (havRawIndex !== -1 && rawRow.length > expectedCount) {
        const extraCount = rawRow.length - expectedCount;
        const startMerge = havRawIndex;
        const endMerge = havRawIndex + extraCount + 1;

        const mergedValue = rawRow.slice(startMerge, endMerge).join(",");
        cleanRow = [
          ...rawRow.slice(0, startMerge),
          mergedValue,
          ...rawRow.slice(endMerge),
        ];
      }

      // Convert array of strings to Record<string, string>
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = cleanRow[index] || "";
      });

      const normalizedRow = normalizeEmployeeRow(rowObj);
      const employee = validateEmployeeCsvRow(normalizedRow, validBranchCodes);

      if (seenNrps.has(employee.nrp)) {
        throw new Error(`Duplicate NRP: ${employee.nrp}`);
      }

      seenNrps.add(employee.nrp);
      data.push(employee);
    } catch (error) {
      issues.push({
        row: i + 1, // 1-based row index in CSV file
        message: error instanceof Error ? error.message : "Unknown employee row error",
      });
    }
  }

  return { data, issues };
}
