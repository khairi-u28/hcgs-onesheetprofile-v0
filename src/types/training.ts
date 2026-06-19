export type TrainingHistoryRecord = {
  employeeNrp: string;
  trainingName: string;
  completionDate: string;
  score?: number | null;
  status?: string;
  category?: string;
};
