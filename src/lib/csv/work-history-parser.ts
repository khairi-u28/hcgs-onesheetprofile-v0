import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateWorkHistoryCsvRow } from "@/lib/validators/workHistory";
import type { ParsedDatasetResult, WorkHistoryRecord } from "@/types";

const ALIAS_MAP: Record<string, string[]> = {
  NRP: ["NRP", "nrp", "Personnel Number"],
  Position: ["Position", "position"],
  "Start Date": ["Start Date", "startDate"],
  "End Date": ["End Date", "endDate"],
  "Branch Code": ["Branch Code", "branchCode"],
  "Branch Name": ["Branch Name", "branchName"],
  POS: ["POS", "pos"],
};

function normalizeWorkHistoryRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  // Set defaults for optional keys
  normalized["POS"] = "";
  normalized["Branch Code"] = "";
  normalized["Branch Name"] = "";

  const keys = Object.keys(row);
  for (const [targetKey, aliases] of Object.entries(ALIAS_MAP)) {
    const matchingAlias = aliases.find(alias => keys.some(k => k.trim() === alias));
    if (matchingAlias !== undefined) {
      const actualKey = keys.find(k => k.trim() === matchingAlias)!;
      normalized[targetKey] = row[actualKey];
    }
  }

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
    try {
      const normalizedRow = normalizeWorkHistoryRow(row);
      data.push(validateWorkHistoryCsvRow(normalizedRow, validEmployeeNrps));
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown work history row error",
      });
    }
  });

  return { data, issues };
}
