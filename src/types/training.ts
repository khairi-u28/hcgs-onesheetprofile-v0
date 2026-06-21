export type TrainingHistoryRecord = {
  employeeNrp: string;
  trainingName: string;
  completionDate: string | null;
  score?: number | null;
  status?: string | null;
  category?: string;
  rawStatus?: string;
};

