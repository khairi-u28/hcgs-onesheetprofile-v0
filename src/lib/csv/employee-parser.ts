import { parseCsvRows } from "@/lib/csv/parse-csv";
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
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return csvText;

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim());
  const expectedCount = headers.length;

  const havRawIndex = headers.findIndex((h) =>
    ["havRaw", "HAV Raw", "hav_raw", "HAV"].includes(h)
  );

  if (havRawIndex === -1) {
    return csvText;
  }

  const processedLines: string[] = [headerLine];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    const parts = line.split(",");
    if (parts.length > expectedCount) {
      const extraCount = parts.length - expectedCount;
      const startMerge = havRawIndex;
      const endMerge = havRawIndex + extraCount + 1;

      const mergedValue = parts.slice(startMerge, endMerge).join(",");
      const quotedMergedValue = `"${mergedValue.replace(/"/g, '""')}"`;

      const newParts = [
        ...parts.slice(0, startMerge),
        quotedMergedValue,
        ...parts.slice(endMerge),
      ];

      processedLines.push(newParts.join(","));
    } else {
      processedLines.push(line);
    }
  }

  return processedLines.join("\n");
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

  return normalized;
}

export function parseEmployeeDataset(
  csvText: string,
  validBranchCodes: Set<string>,
): ParsedDatasetResult<EmployeeRecord> {
  const preprocessed = preprocessEmployeeCsv(csvText);
  const rows = parseCsvRows(preprocessed);
  const seenNrps = new Set<string>();
  const data: EmployeeRecord[] = [];
  const issues: ParsedDatasetResult<EmployeeRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    try {
      const normalizedRow = normalizeEmployeeRow(row);
      const employee = validateEmployeeCsvRow(normalizedRow, validBranchCodes);

      if (seenNrps.has(employee.nrp)) {
        throw new Error(`Duplicate NRP: ${employee.nrp}`);
      }

      seenNrps.add(employee.nrp);
      data.push(employee);
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown employee row error",
      });
    }
  });

  return { data, issues };
}
