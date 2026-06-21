import { z } from "zod";
import type { TrainingHistoryRecord } from "@/types";
import { normalizeDateValue } from "@/lib/utils";

const trainingCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required").transform((val) => val.toUpperCase()),
  "Training Name": z.string().trim().min(1, "Training Name is required"),
  "Completion Date": z.string().trim().default(""),
  Status: z.string().trim().default(""),
  Score: z.string().trim().default(""),
  Category: z.string().trim().default(""),
});

function normalizeScore(value: string, warnings: string[], richWarnings?: any[]) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const score = Number(raw);
  if (Number.isNaN(score)) {
    const msg = `Invalid training score: ${value}`;
    warnings.push(msg);
    if (richWarnings) {
      richWarnings.push({
        message: msg,
        code: "INVALID_SCORE",
        currentValue: value,
      });
    }
    return null;
  }

  return score;
}

export function validateTrainingCsvRow(
  row: Record<string, string>,
  validEmployeeNrps: Set<string>,
): { data: TrainingHistoryRecord; warnings: string[]; richWarnings?: any[] } {
  const warnings: string[] = [];
  const richWarnings: any[] = [];
  const parsed = trainingCsvRowSchema.parse(row);

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
    const msg = `Training record references unknown employee NRP: ${parsed.NRP}`;
    warnings.push(msg);
    richWarnings.push({
      message: msg,
      code: "UNKNOWN_EMPLOYEE_NRP",
      currentValue: parsed.NRP,
    });
  }

  const statusRaw = parsed.Status;
  const VALID_STATUSES = new Set(["On Going", "Promoted", "Pool of Cadre", "Failed"]);
  
  let finalStatus: string | null = null;
  let rawStatus: string | undefined = undefined;

  if (statusRaw) {
    if (VALID_STATUSES.has(statusRaw)) {
      finalStatus = statusRaw;
    } else {
      finalStatus = null;
      rawStatus = statusRaw;
      const msg = `Unknown training status: ${statusRaw}`;
      warnings.push(msg);
      richWarnings.push({
        message: msg,
        code: "INVALID_TRAINING_STATUS",
        currentValue: statusRaw,
      });
    }
  }

  const trainingRecord: TrainingHistoryRecord = {
    employeeNrp: parsed.NRP,
    trainingName: parsed["Training Name"],
    completionDate: normalizeDateValue(parsed["Completion Date"], warnings, "Completion Date", richWarnings),
    status: finalStatus,
    rawStatus,
    score: normalizeScore(parsed.Score, warnings, richWarnings),
    category: parsed.Category,
  };

  return { data: trainingRecord, warnings, richWarnings };
}
