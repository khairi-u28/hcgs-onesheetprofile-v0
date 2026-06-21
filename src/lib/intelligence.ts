import { differenceInMonths, parseISO } from "date-fns";
import type { EmployeeRecord, TrainingHistoryRecord, WorkHistoryRecord } from "@/types";

export function getKpiScore(employee: EmployeeRecord): number {
  return employee.kpiFullYear ?? employee.kpiMidYear ?? 0;
}

export function isPromotionCandidate(employee: EmployeeRecord): boolean {
  const pkTopTier = ["BS", "B+", "B"].includes(employee.pk2025 ?? "");
  return employee.havCategory === "Strong Performer" && getKpiScore(employee) >= 0.90 && pkTopTier;
}

export function isCriticalIntervention(employee: EmployeeRecord): boolean {
  return employee.havCategory === "Unfit Employee" || getKpiScore(employee) <= 0.50;
}

export function isAttentionRequired(
  employee: EmployeeRecord,
  trainingRecords: TrainingHistoryRecord[]
): boolean {
  const kpi = getKpiScore(employee);
  const kpiWarning = kpi > 0.50 && kpi <= 0.60;
  const hasFailedTraining = trainingRecords.some(
    (t) => t.employeeNrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase() && t.status === "Failed"
  );
  return kpiWarning || hasFailedTraining;
}

export function isDevelopmentBacklog(employee: EmployeeRecord): boolean {
  return employee.developmentProgramStatus === "Not Started";
}

export function getMasaKerjaYears(masaKerja: string | undefined | null): number {
  if (!masaKerja) return 0;
  const parts = masaKerja.split("-");
  return parseInt(parts[0], 10) || 0;
}

export function isCareerStagnant(
  employee: EmployeeRecord,
  trainingRecords: TrainingHistoryRecord[],
  workHistory?: WorkHistoryRecord[]
): boolean {
  if (employee.havCategory !== "Strong Performer") return false;
  
  let tenureYears = 0;

  // 1. masaKerjaJabatan (format "yy-mm")
  if (employee.masaKerjaJabatan) {
    tenureYears = getMasaKerjaYears(employee.masaKerjaJabatan);
  }

  // 2. latest continuous work-history position tenure
  if (tenureYears === 0 && workHistory && workHistory.length > 0) {
    const matchingRecords = workHistory.filter(
      (w) => w.nrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase() && w.position === employee.position
    );
    if (matchingRecords.length > 0) {
      const latest = matchingRecords.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
      if (latest.startDate) {
        const date = parseISO(latest.startDate);
        const diff = differenceInMonths(new Date(), date);
        tenureYears = Math.floor(Math.max(0, diff) / 12);
      }
    }
  }

  // 3. entryDate tenure
  if (tenureYears === 0 && employee.entryDate) {
    const date = parseISO(employee.entryDate);
    const diff = differenceInMonths(new Date(), date);
    tenureYears = Math.floor(Math.max(0, diff) / 12);
  }

  if (tenureYears < 4) return false;

  const hasPromoted = trainingRecords.some(
    (t) => t.employeeNrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase() && t.status === "Promoted"
  );
  return !hasPromoted;
}

export function getEmployeeRiskLevel(
  employee: EmployeeRecord,
  trainingRecords: TrainingHistoryRecord[]
): "High" | "Medium" | "Low" {
  if (isCriticalIntervention(employee)) return "High";
  if (isAttentionRequired(employee, trainingRecords)) return "Medium";
  if (employee.havCategory === "Potential Candidate" || employee.havCategory === "Career Person") {
    if (getKpiScore(employee) < 0.8) return "Medium";
  }
  return "Low";
}

export function getEmployeeRecommendation(
  employee: EmployeeRecord,
  trainingRecords: TrainingHistoryRecord[],
  workHistory?: WorkHistoryRecord[]
): string {
  if (isPromotionCandidate(employee)) {
    return "Prioritize for immediate succession planning and leadership placement.";
  }
  if (isCareerStagnant(employee, trainingRecords, workHistory)) {
    return "Enroll in advanced development program to break stagnation. Assign stretch projects.";
  }
  if (isCriticalIntervention(employee)) {
    return "Initiate formal performance improvement plan (PIP) immediately.";
  }
  if (isAttentionRequired(employee, trainingRecords)) {
    return "Schedule counseling and review training gaps. Monitor KPI closely.";
  }
  if (isDevelopmentBacklog(employee)) {
    return "Assign mandatory foundational development program.";
  }
  if (employee.havCategory === "Candidate") {
    return "Continue current trajectory. Prepare for future promotion pipeline.";
  }
  return "Maintain steady performance. Monitor next cycle.";
}
