import Papa from "papaparse";
import { validateEmployeeCsvRow } from "@/lib/validators/employee";
import type { EmployeeRecord, ParsedDatasetResult } from "@/types";
import { getCanonicalHeader } from "@/lib/csv/header-aliases";

function normalizeEmployeeRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  const employeeKeys = [
    "NRP", "Nama", "Position", "POS", "Branch Code", "Region/Div", "Area/Dept",
    "Entry Date", "Date of Birth", "Masa Kerja Total", "Masa Kerja Jabatan", "Masa Kerja Cabang",
    "HAV", "Last Dev'l Program", "Status Dev'l Program", "Periode Dev'l Program",
    "Gol", "KPI Mid Year", "KPI Full Year", "PK 2023", "PK 2024", "PK 2025",
    "Link Photo", "Strength 1", "Strength 2", "Areas of Development 1", "Areas of Development 2",
    "Level Pendidikan Terakhir", "Institusi Pendidikan Terakhir"
  ];

  employeeKeys.forEach((key) => {
    normalized[key] = "";
  });

  const rowKeys = Object.keys(row);

  rowKeys.forEach((rawKey) => {
    const canonicalKey = getCanonicalHeader(rawKey, employeeKeys);
    if (canonicalKey) {
      normalized[canonicalKey] = row[rawKey] || "";
    }
  });

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

  // Find index for HAV or equivalent alias
  const employeeKeys = ["HAV"];
  const havRawIndex = headers.findIndex((h) => {
    const canonical = getCanonicalHeader(h, employeeKeys);
    return canonical === "HAV";
  });

  const seenNrps = new Set<string>();
  const data: EmployeeRecord[] = [];
  const issues: ParsedDatasetResult<EmployeeRecord>["issues"] = [];

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    
    // Check if it's the template reminder row: "DELETE THESE SAMPLE ROWS BEFORE IMPORT"
    if (rawRow.join(",").includes("DELETE THESE SAMPLE ROWS BEFORE IMPORT")) {
      issues.push({
        row: i + 1,
        message: "Template reminder row detected and skipped.",
        type: "warning",
        dataset: "employee",
        code: "TEMPLATE_REMINDER_ROW",
        currentValue: "DELETE THESE SAMPLE ROWS BEFORE IMPORT",
      });
      continue;
    }

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
      const { data: employee, warnings, richWarnings } = validateEmployeeCsvRow(normalizedRow, validBranchCodes);

      if (seenNrps.has(employee.nrp)) {
        const err = new Error(`Duplicate employee NRP detected. Only the first occurrence was imported.`);
        (err as any).code = "DUPLICATE_EMPLOYEE_NRP";
        (err as any).currentValue = employee.nrp;
        throw err;
      }

      seenNrps.add(employee.nrp);

      // Append warnings
      if (richWarnings && richWarnings.length > 0) {
        richWarnings.forEach((issue) => {
          issues.push({
            row: i + 1,
            ...issue,
            type: "warning",
            dataset: "employee",
          });
        });
      } else {
        warnings.forEach((msg) => {
          issues.push({
            row: i + 1,
            message: msg,
            type: "warning",
            dataset: "employee",
          });
        });
      }

      data.push(employee);
    } catch (error) {
      issues.push({
        row: i + 1,
        message: error instanceof Error ? error.message : "Unknown employee row error",
        type: "error",
        dataset: "employee",
        code: (error as any).code || (error instanceof Error && error.message.includes("is required") ? "MISSING_REQUIRED" : "OTHER"),
        currentValue: (error as any).currentValue || "",
      });
    }
  }

  return { data, issues };
}
