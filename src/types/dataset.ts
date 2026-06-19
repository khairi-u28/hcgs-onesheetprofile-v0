export type DatasetKind = "employees" | "training";

export type ImportIssue = {
  row: number;
  message: string;
};

export type DatasetImportMeta = {
  importedAt: string;
  fileName: string;
  recordCount: number;
};

export type ParsedDatasetResult<T> = {
  data: T[];
  issues: ImportIssue[];
};

export type ActiveDatasetState = {
  employeeImport: DatasetImportMeta | null;
  trainingImport: DatasetImportMeta | null;
};
