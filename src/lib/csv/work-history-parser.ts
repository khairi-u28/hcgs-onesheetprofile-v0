import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateWorkHistoryCsvRow } from "@/lib/validators/workHistory";
import type { ParsedDatasetResult, WorkHistoryRecord } from "@/types";
import { getCanonicalHeader } from "@/lib/csv/header-aliases";

function normalizeWorkHistoryRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  const workHistoryKeys = ["NRP", "Position", "Start Date", "End Date", "Branch Code", "Branch Name", "POS"];

  // Set defaults
  workHistoryKeys.forEach((key) => {
    normalized[key] = "";
  });

  const rowKeys = Object.keys(row);
  rowKeys.forEach((rawKey) => {
    const canonicalKey = getCanonicalHeader(rawKey, workHistoryKeys);
    if (canonicalKey) {
      normalized[canonicalKey] = row[rawKey] || "";
    }
  });

  return normalized;
}

export function parseWorkHistoryDataset(
  csvText: string,
  validEmployeeNrps: Set<string>,
): ParsedDatasetResult<WorkHistoryRecord> {
  const rows = parseCsvRows(csvText);
  const data: WorkHistoryRecord[] = [];
  const issues: ParsedDatasetResult<WorkHistoryRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    // Check if it's the template reminder row
    if (Object.values(row).join(",").includes("DELETE THESE SAMPLE ROWS BEFORE IMPORT")) {
      issues.push({
        row: index + 2,
        message: "Template reminder row detected and skipped.",
        type: "warning",
        dataset: "workHistory",
        code: "TEMPLATE_REMINDER_ROW",
        currentValue: "DELETE THESE SAMPLE ROWS BEFORE IMPORT",
      });
      return;
    }

    try {
      const normalizedRow = normalizeWorkHistoryRow(row);
      const { data: workHistory, warnings, richWarnings } = validateWorkHistoryCsvRow(normalizedRow, validEmployeeNrps);
      
      if (richWarnings && richWarnings.length > 0) {
        richWarnings.forEach((issue) => {
          issues.push({
            row: index + 2,
            ...issue,
            type: "warning",
            dataset: "workHistory",
          });
        });
      } else {
        warnings.forEach((msg) => {
          issues.push({
            row: index + 2,
            message: msg,
            type: "warning",
            dataset: "workHistory",
          });
        });
      }

      data.push(workHistory);
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown work history row error",
        type: "error",
        dataset: "workHistory",
        code: (error as any).code || (error instanceof Error && error.message.includes("is required") ? "MISSING_REQUIRED" : "OTHER"),
        currentValue: (error as any).currentValue || "",
      });
    }
  });

  return { data, issues };
}
