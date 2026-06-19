import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateWorkHistoryCsvRow } from "@/lib/validators/workHistory";
import type { ParsedDatasetResult, WorkHistoryRecord } from "@/types";

export function parseWorkHistoryDataset(
  csvText: string,
  validEmployeeNrps: Set<string>,
): ParsedDatasetResult<WorkHistoryRecord> {
  const rows = parseCsvRows(csvText);
  const data: WorkHistoryRecord[] = [];
  const issues: ParsedDatasetResult<WorkHistoryRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    try {
      data.push(validateWorkHistoryCsvRow(row, validEmployeeNrps));
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown work history row error",
      });
    }
  });

  return { data, issues };
}
