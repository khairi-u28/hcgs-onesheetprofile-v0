import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateTrainingCsvRow } from "@/lib/validators/training";
import type { ParsedDatasetResult, TrainingHistoryRecord } from "@/types";

const ALIAS_MAP: Record<string, string[]> = {
  NRP: ["NRP", "nrp", "employeeNrp"],
  "Training Name": ["Training Name", "trainingName"],
  "Completion Date": ["Completion Date", "completionDate"],
  Status: ["Status", "status"],
  Score: ["Score", "score"],
  Category: ["Category", "category"],
};

function normalizeTrainingRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  // Set defaults for optional keys
  normalized["Status"] = "";
  normalized["Score"] = "";
  normalized["Category"] = "";

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
    try {
      const normalizedRow = normalizeTrainingRow(row);
      data.push(validateTrainingCsvRow(normalizedRow, validEmployeeNrps));
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown training row error",
      });
    }
  });

  return { data, issues };
}
