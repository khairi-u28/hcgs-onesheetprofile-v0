import { isValid, parse, parseISO } from "date-fns";
import { z } from "zod";
import type { WorkHistoryRecord } from "@/types";

const workHistoryCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required"),
  Position: z.string().trim().min(1, "Position is required"),
  "Branch Code": z.string().trim().optional(),
  "Branch Name": z.string().trim().optional(),
  "Start Date": z.string().trim().min(1, "Start Date is required"),
  "End Date": z.string().trim().min(1, "End Date is required"),
  POS: z.string().trim().optional(),
});

function normalizeDate(value: string) {
  const raw = value.trim();
  const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"];

  const isoDate = parseISO(raw);
  if (isValid(isoDate)) {
    return isoDate.toISOString();
  }

  for (const dateFormat of formats) {
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }

  throw new Error(`Invalid date: ${value}`);
}

export function validateWorkHistoryCsvRow(
  row: Record<string, string>,
  validEmployeeNrps: Set<string>,
): WorkHistoryRecord {
  const parsed = workHistoryCsvRowSchema.parse(row);

  if (!validEmployeeNrps.has(parsed.NRP)) {
    throw new Error(`Work history record references unknown employee NRP: ${parsed.NRP}`);
  }

  const workRecord: WorkHistoryRecord = {
    nrp: parsed.NRP,
    position: parsed.Position,
    pos: parsed.POS || undefined,
    branchCode: parsed["Branch Code"] || null,
    branchName: parsed["Branch Name"] || null,
    startDate: normalizeDate(parsed["Start Date"]),
    endDate: normalizeDate(parsed["End Date"]),
  };

  return workRecord;
}
