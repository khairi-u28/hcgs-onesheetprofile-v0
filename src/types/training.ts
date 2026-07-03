export type TrainingHistoryRecord = {
  employeeNrp: string;
  trainingName: string;
  /** Legacy field — kept for backward compatibility with datasets using Completion Date / Tanggal Sertifikat. */
  completionDate?: string | null;
  /** New field — preferred over completionDate. Maps to "End Date" column in new production template. */
  endDate?: string | null;
  /** New field — maps to "Start Date" column. */
  startDate?: string | null;
  /** New field — training batch identifier. */
  batch?: string;
  /** New field — training period (e.g. "2024", "Q1 2025"). */
  period?: string;
  status: string | null;
  rawStatus?: string;
};

