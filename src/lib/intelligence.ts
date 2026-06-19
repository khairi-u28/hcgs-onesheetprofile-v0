import type { EmployeeRecord, TrainingHistoryRecord } from "@/types";

export function getKpiScore(employee: EmployeeRecord): number {
  return employee.kpiFullYear ?? employee.kpiMidYear ?? 0;
}

export function isPromotionCandidate(employee: EmployeeRecord): boolean {
  const pkTopTier = ["BS", "B+"].includes(employee.pk2025 ?? "");
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
    (t) => t.employeeNrp === employee.nrp && t.status === "Failed"
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
  trainingRecords: TrainingHistoryRecord[]
): boolean {
  if (employee.havCategory !== "Strong Performer") return false;
  if (getMasaKerjaYears(employee.masaKerjaJabatan) < 4) return false;
  const hasPromoted = trainingRecords.some(
    (t) => t.employeeNrp === employee.nrp && t.status === "Promoted"
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
    // If not critical or attention but in these middle tiers, let's look at KPI
    if (getKpiScore(employee) < 0.8) return "Medium";
  }
  return "Low";
}

export function getEmployeeRecommendation(
  employee: EmployeeRecord,
  trainingRecords: TrainingHistoryRecord[]
): string {
  if (isPromotionCandidate(employee)) {
    return "Prioritize for immediate succession planning and leadership placement.";
  }
  if (isCareerStagnant(employee, trainingRecords)) {
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
