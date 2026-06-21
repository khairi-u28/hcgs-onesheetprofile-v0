import { z } from "zod";
import type { TrainingHistoryRecord } from "@/types";
import { normalizeDateValue } from "@/lib/utils";

const trainingCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required").transform((val) => val.toUpperCase()),
  "Training Name": z.string().trim().min(1, "Training Name is required"),
  "Completion Date": z.string().trim().default(""),
  Status: z.string().trim().default(""),
  Score: z.string().trim().optional(),
  Category: z.string().trim().optional(),
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

  const statusRaw = parsed.Status.trim();
  const COMPLETED_ALIASES = new Set(["COMPLETED", "COMPLETED TRAINING", "FINISHED", "DONE", "COMPLETE"]);
  
  let finalStatus: string | null = null;
  let rawStatus: string | undefined = undefined;

  if (statusRaw) {
    const upperStatus = statusRaw.toUpperCase();
    if (COMPLETED_ALIASES.has(upperStatus)) {
      finalStatus = "Completed";
    } else if (upperStatus === "ON GOING" || upperStatus === "ONGOING") {
      finalStatus = "On Going";
    } else if (upperStatus === "PROMOTED") {
      finalStatus = "Promoted";
    } else if (upperStatus === "POOL OF CADRE" || upperStatus === "POOLOF_CADRE") {
      finalStatus = "Pool of Cadre";
    } else if (upperStatus === "FAILED") {
      finalStatus = "Failed";
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
    score: parsed.Score ? normalizeScore(parsed.Score, warnings, richWarnings) : null,
    category: parsed.Category || undefined,
  };

  return { data: trainingRecord, warnings, richWarnings };
}
