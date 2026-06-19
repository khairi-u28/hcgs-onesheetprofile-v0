import { parseCsvRows } from "@/lib/csv/parse-csv";
import { validateEmployeeCsvRow } from "@/lib/validators/employee";
import type { EmployeeRecord, ParsedDatasetResult } from "@/types";

export function parseEmployeeDataset(
  csvText: string,
  validBranchCodes: Set<string>,
): ParsedDatasetResult<EmployeeRecord> {
  const rows = parseCsvRows(csvText);
  const seenNrps = new Set<string>();
  const data: EmployeeRecord[] = [];
  const issues: ParsedDatasetResult<EmployeeRecord>["issues"] = [];

  rows.forEach((row: Record<string, string>, index: number) => {
    try {
      const employee = validateEmployeeCsvRow(row, validBranchCodes);

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
