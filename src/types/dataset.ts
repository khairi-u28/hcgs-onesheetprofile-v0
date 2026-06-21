export type DatasetKind = "employees" | "training";

export type ImportIssue = {
  row: number;
  message: string;
  type?: "error" | "warning";
  dataset?: "employee" | "training" | "workHistory";
  code?: string;
  currentValue?: string;
};

export type DatasetImportMeta = {
  importedAt: string;
  fileName: string;
  recordCount: number;
  warnings?: ImportIssue[];
  errors?: ImportIssue[];
};

export type ParsedDatasetResult<T> = {
  data: T[];
  issues: ImportIssue[];
};

export type ActiveDatasetState = {
  employeeImport: DatasetImportMeta | null;
  trainingImport: DatasetImportMeta | null;
  workHistoryImport: DatasetImportMeta | null;
};
