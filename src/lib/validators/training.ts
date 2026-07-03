import { z } from "zod";
import type { TrainingHistoryRecord } from "@/types";
import { normalizeDateValue } from "@/lib/utils";

const trainingCsvRowSchema = z.object({
  NRP: z.string().trim().min(1, "NRP is required").transform((val) => val.toUpperCase()),
  "Training Name": z.string().trim().min(1, "Training Name is required"),
  "Start Date": z.string().trim().default(""),
  "End Date": z.string().trim().default(""),
  "Completion Date": z.string().trim().default(""),
  Batch: z.string().trim().default(""),
  Period: z.string().trim().default(""),
  Status: z.string().trim().default(""),
});

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

  const rawEndDate = parsed["End Date"].trim();
  const rawCompletionDate = parsed["Completion Date"].trim();

  let finalEndDate: string | null = null;
  let finalCompletionDate: string | null = null;

  if (rawEndDate) {
    finalEndDate = normalizeDateValue(rawEndDate, warnings, "End Date", richWarnings);
  }
  if (rawCompletionDate) {
    finalCompletionDate = normalizeDateValue(rawCompletionDate, warnings, "Completion Date", richWarnings);
  }

  // Fallbacks for priority mapping
  if (!finalEndDate && finalCompletionDate) {
    finalEndDate = finalCompletionDate;
  }
  if (!finalCompletionDate && finalEndDate) {
    finalCompletionDate = finalEndDate;
  }

  const statusRaw = parsed.Status.trim();
  let finalStatus: string | null = null;
  let rawStatus: string | undefined = undefined;

  if (statusRaw) {
    const upper = statusRaw.toUpperCase();
    const COMPLETED_ALIASES = ["COMPLETED", "COMPLETED TRAINING", "FINISHED", "DONE", "COMPLETE", "LULUS", "LULUS - CERTIFICATE"];
    const ONGOING_ALIASES = ["ONGOING", "ON GOING", "DALAM PROSES"];

    if (COMPLETED_ALIASES.includes(upper)) {
      finalStatus = "Completed";
    } else if (ONGOING_ALIASES.includes(upper)) {
      finalStatus = "On Going";
    } else if (upper === "PROMOTED") {
      finalStatus = "Promoted";
    } else if (upper === "POOL OF CADRE" || upper === "POOLOF_CADRE") {
      finalStatus = "Pool of Cadre";
    } else if (upper === "FAILED") {
      finalStatus = "Failed";
    } else {
      finalStatus = statusRaw;
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
    startDate: parsed["Start Date"].trim() ? normalizeDateValue(parsed["Start Date"], warnings, "Start Date", richWarnings) : null,
    endDate: finalEndDate,
    completionDate: finalCompletionDate,
    batch: parsed.Batch || undefined,
    period: parsed.Period || undefined,
    status: finalStatus,
    rawStatus,
  };

  return { data: trainingRecord, warnings, richWarnings };
}
