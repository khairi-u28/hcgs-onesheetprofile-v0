import { z } from "zod";
import type { WorkHistoryRecord } from "@/types";
import { normalizeDateValue } from "@/lib/utils";

const workHistoryCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required").transform((val) => val.toUpperCase()),
  Position: z.string().trim().min(1, "Position is required"),
  "Branch Code": z.string().trim().default(""),
  "Branch Name": z.string().trim().default(""),
  "Start Date": z.string().trim().min(1, "Start Date is required"),
  "End Date": z.string().trim().min(1, "End Date is required"),
  POS: z.string().trim().default(""),
});

export function validateWorkHistoryCsvRow(
  row: Record<string, string>,
  validEmployeeNrps: Set<string>,
): { data: WorkHistoryRecord; warnings: string[]; richWarnings?: any[] } {
  const warnings: string[] = [];
  const richWarnings: any[] = [];
  const parsed = workHistoryCsvRowSchema.parse(row);

  const sampleNrps = new Set(["EX0001", "EX0002", "EX0003", "EX0004", "EX0005"]);
  if (sampleNrps.has(parsed.NRP)) {
    const msg = `Sample template data detected (NRP: ${parsed.NRP})`;
    warnings.push(msg);
    richWarnings.push({
      message: msg,
      code: "TEMPLATE_SAMPLE_DATA",
      currentValue: parsed.NRP,
    });
  }

  if (!validEmployeeNrps.has(parsed.NRP)) {
    const msg = `Work history record references unknown employee NRP: ${parsed.NRP}`;
    warnings.push(msg);
    richWarnings.push({
      message: msg,
      code: "UNKNOWN_EMPLOYEE_NRP",
      currentValue: parsed.NRP,
    });
  }

  const rawEndDateInput = parsed["End Date"].trim();
  const upperRawEndDate = rawEndDateInput.toUpperCase();
  const isCurrent = ["NOW", "CURRENT", "ACTIVE"].includes(upperRawEndDate);

  const rawEndDate = isCurrent ? rawEndDateInput : null;
  let endDate: string | null = null;
  if (isCurrent) {
    endDate = new Date().toISOString().split("T")[0]; // Today's date (ISO)
  } else {
    endDate = normalizeDateValue(rawEndDateInput, warnings, "End Date", richWarnings);
  }

  const workRecord: WorkHistoryRecord = {
    nrp: parsed.NRP,
    position: parsed.Position,
    pos: parsed.POS || undefined,
    branchCode: parsed["Branch Code"] || null,
    branchName: parsed["Branch Name"] || null,
    startDate: normalizeDateValue(parsed["Start Date"], warnings, "Start Date", richWarnings),
    endDate,
    isCurrent,
    rawEndDate,
  };

  return { data: workRecord, warnings, richWarnings };
}
