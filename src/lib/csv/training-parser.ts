import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateTrainingCsvRow } from "@/lib/validators/training";
import type { ParsedDatasetResult, TrainingHistoryRecord } from "@/types";
import { getCanonicalHeader } from "@/lib/csv/header-aliases";

function normalizeTrainingRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  const trainingKeys = ["NRP", "Training Name", "Start Date", "End Date", "Batch", "Period", "Status", "Completion Date"];

  // Set defaults
  trainingKeys.forEach((key) => {
    normalized[key] = "";
  });

  const rowKeys = Object.keys(row);
  rowKeys.forEach((rawKey) => {
    const canonicalKey = getCanonicalHeader(rawKey, trainingKeys);
    if (canonicalKey) {
      normalized[canonicalKey] = row[rawKey] || "";
    }
  });

  return normalized;
}

export function parseTrainingDataset(
  csvText: string,
  validEmployeeNrps: Set<string>,
): ParsedDatasetResult<TrainingHistoryRecord> {
  const rows = parseCsvRows(csvText);
  const data: TrainingHistoryRecord[] = [];
  const issues: ParsedDatasetResult<TrainingHistoryRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    // Check if it's the template reminder row
    if (Object.values(row).join(",").includes("DELETE THESE SAMPLE ROWS BEFORE IMPORT")) {
      issues.push({
        row: index + 2,
        message: "Template reminder row detected and skipped.",
        type: "warning",
        dataset: "training",
        code: "TEMPLATE_REMINDER_ROW",
        currentValue: "DELETE THESE SAMPLE ROWS BEFORE IMPORT",
      });
      return;
    }

    try {
      const normalizedRow = normalizeTrainingRow(row);
      const { data: training, warnings, richWarnings } = validateTrainingCsvRow(normalizedRow, validEmployeeNrps);
      
      if (richWarnings && richWarnings.length > 0) {
        richWarnings.forEach((issue) => {
          issues.push({
            row: index + 2,
            ...issue,
            type: "warning",
            dataset: "training",
          });
        });
      } else {
        warnings.forEach((msg) => {
          issues.push({
            row: index + 2,
            message: msg,
            type: "warning",
            dataset: "training",
          });
        });
      }

      data.push(training);
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown training row error",
        type: "error",
        dataset: "training",
        code: (error as any).code || (error instanceof Error && error.message.includes("is required") ? "MISSING_REQUIRED" : "OTHER"),
        currentValue: (error as any).currentValue || "",
      });
    }
  });

  return { data, issues };
}
