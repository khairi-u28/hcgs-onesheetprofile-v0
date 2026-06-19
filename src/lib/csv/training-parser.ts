import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateTrainingCsvRow } from "@/lib/validators/training";
import type { ParsedDatasetResult, TrainingHistoryRecord } from "@/types";

export function parseTrainingDataset(
  csvText: string,
  validEmployeeNrps: Set<string>,
): ParsedDatasetResult<TrainingHistoryRecord> {
  const rows = parseCsvRows(csvText);
  const data: TrainingHistoryRecord[] = [];
  const issues: ParsedDatasetResult<TrainingHistoryRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    try {
      data.push(validateTrainingCsvRow(row, validEmployeeNrps));
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown training row error",
      });
    }
  });

  return { data, issues };
}
