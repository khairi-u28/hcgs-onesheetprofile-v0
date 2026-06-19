import { isValid, parse, parseISO } from "date-fns";
import { z } from "zod";
import type { TrainingHistoryRecord } from "@/types";

const trainingCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required"),
  "Training Name": z.string().trim().min(1, "Training Name is required"),
  "Completion Date": z.string().trim().min(1, "Completion Date is required"),
  Status: z.string().trim().optional().default(""),
  Score: z.string().trim().optional().default(""),
  Category: z.string().trim().optional().default(""),
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

function normalizeScore(value: string) {
  if (!value.trim()) {
    return null;
  }

  const score = Number(value);
  if (Number.isNaN(score)) {
    throw new Error(`Invalid training score: ${value}`);
  }

  return score;
}

export function validateTrainingCsvRow(
  row: Record<string, string>,
  validEmployeeNrps: Set<string>,
) {
  const parsed = trainingCsvRowSchema.parse(row);

  if (!validEmployeeNrps.has(parsed.NRP)) {
    throw new Error(`Training record references unknown employee NRP: ${parsed.NRP}`);
  }

  const trainingRecord: TrainingHistoryRecord = {
    employeeNrp: parsed.NRP,
    trainingName: parsed["Training Name"],
    completionDate: normalizeDate(parsed["Completion Date"]),
    status: parsed.Status,
    score: normalizeScore(parsed.Score),
    category: parsed.Category,
  };

  return trainingRecord;
}
