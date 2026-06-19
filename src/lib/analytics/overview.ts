import type { EmployeeRecord, TrainingHistoryRecord } from "@/types";

export function summarizeDataset(
  employees: EmployeeRecord[],
  trainingHistory: TrainingHistoryRecord[],
) {
  const developmentParticipants = employees.filter(
    (employee) => employee.developmentProgramStatus.trim().length > 0,
  ).length;

  return {
    employeeCount: employees.length,
    trainingCount: trainingHistory.length,
    developmentParticipants,
  };
}
