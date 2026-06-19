"use client";

import { startTransition, useId, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateLabel, formatRelativeTime } from "@/lib/utils";
import { parseWorkHistoryDataset } from "@/lib/csv/work-history-parser";
import { parseEmployeeDataset } from "@/lib/csv/employee-parser";
import { parseTrainingDataset } from "@/lib/csv/training-parser";
import type { WorkHistoryRecord } from "@/types";
import { parseCsvRows } from "@/lib/csv/parse-csv";
import { usePortalStore } from "@/store/portal-store";
import type {
  DatasetImportMeta,
  EmployeeRecord,
  ImportIssue,
  TrainingHistoryRecord,
} from "@/types";

type ImportKind = "employees" | "training" | "work_history";

type ValidationSummary = {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingRequiredFields: number;
  invalidBranchCodes: number;
  duplicateNrp: number;
  unknownEmployeeNrp: number;
  otherIssues: number;
};

type ImportCandidate<T> = {
  fileName: string;
  parsedData: T[];
  rawRows: Record<string, string>[];
  issues: ImportIssue[];
  summary: ValidationSummary;
};

type ImportSuccessState = {
  kind: ImportKind;
  meta: DatasetImportMeta;
  validRecords: number;
  invalidRecords: number;
};

export function ImportCenterFoundationView() {
  const organization = usePortalStore((state) => state.organization);
  const employees = usePortalStore((state) => state.employees);
  const dataset = usePortalStore((state) => state.dataset);
  const replaceEmployees = usePortalStore((state) => state.replaceEmployees);
  const replaceTrainingHistory = usePortalStore(
    (state) => state.replaceTrainingHistory,
  );
  const replaceWorkHistory = usePortalStore(
    (state) => state.replaceWorkHistory,
  );

  const [employeeCandidate, setEmployeeCandidate] =
    useState<ImportCandidate<EmployeeRecord> | null>(null);
  const [workHistoryCandidate, setWorkHistoryCandidate] =
    useState<ImportCandidate<WorkHistoryRecord> | null>(null);
  const [trainingCandidate, setTrainingCandidate] =
    useState<ImportCandidate<TrainingHistoryRecord> | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [workHistoryError, setWorkHistoryError] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [employeeReplacementConfirmed, setEmployeeReplacementConfirmed] =
    useState(false);
  const [lastSuccess, setLastSuccess] = useState<ImportSuccessState | null>(null);
  const [isParsingEmployee, setIsParsingEmployee] = useState(false);
  const [isParsingWorkHistory, setIsParsingWorkHistory] = useState(false);
  const [isParsingTraining, setIsParsingTraining] = useState(false);

  const employeeInputId = useId();
  const trainingInputId = useId();
  const workHistoryInputId = useId();

  const employeeImportMeta = dataset.employeeImport;
  const trainingImportMeta = dataset.trainingImport;
  const branchCodeSet = new Set(
    organization.map((branch) => branch.branchCode.toUpperCase()),
  );
  const employeeNrpSet = new Set(employees.map((employee) => employee.nrp));
  const employeeCanImport = employeeCandidate
    ? employeeCandidate.summary.invalidRecords === 0 &&
      (employees.length === 0 || employeeReplacementConfirmed)
    : false;
  const trainingCanImport = trainingCandidate
    ? employees.length > 0 && trainingCandidate.summary.invalidRecords === 0
    : false;

  async function handleEmployeeFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setEmployeeError(null);
    setEmployeeCandidate(null);
    setEmployeeReplacementConfirmed(false);
    setLastSuccess(null);
    setIsParsingEmployee(true);

    try {
      const csvText = await file.text();
      startTransition(() => {
        try {
          const rawRows = parseCsvRows(csvText);
          const parsed = parseEmployeeDataset(csvText, branchCodeSet);
          setEmployeeCandidate({
            fileName: file.name,
            parsedData: parsed.data,
            rawRows,
            issues: parsed.issues,
            summary: buildValidationSummary(rawRows.length, parsed.issues),
          });
        } catch (error) {
          setEmployeeError(
            error instanceof Error
              ? error.message
              : "Employee CSV could not be parsed.",
          );
        } finally {
          setIsParsingEmployee(false);
        }
      });
    } catch (error) {
      setEmployeeError(
        error instanceof Error ? error.message : "Employee CSV could not be read.",
      );
      setIsParsingEmployee(false);
    } finally {
      event.target.value = "";
    }
  }

  async function handleWorkHistoryFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setWorkHistoryError(null);
    setWorkHistoryCandidate(null);
    setLastSuccess(null);
    setIsParsingWorkHistory(true);

    try {
      const csvText = await file.text();
      startTransition(() => {
        try {
          const rawRows = parseCsvRows(csvText);
          const parsed = parseWorkHistoryDataset(csvText, employeeNrpSet);
          setWorkHistoryCandidate({
            fileName: file.name,
            parsedData: parsed.data,
            rawRows,
            issues: parsed.issues,
            summary: buildValidationSummary(rawRows.length, parsed.issues),
          });
        } catch (error) {
          setWorkHistoryError(
            error instanceof Error ? error.message : "Work History CSV could not be parsed.",
          );
        } finally {
          setIsParsingWorkHistory(false);
        }
      });
    } catch (error) {
      setWorkHistoryError(
        error instanceof Error ? error.message : "Work History CSV could not be read.",
      );
      setIsParsingWorkHistory(false);
    } finally {
      event.target.value = "";
    }
  }
  async function handleTrainingFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setTrainingError(null);
    setTrainingCandidate(null);
    setLastSuccess(null);
    setIsParsingTraining(true);

    try {
      const csvText = await file.text();
      startTransition(() => {
        try {
          const rawRows = parseCsvRows(csvText);
          const parsed = parseTrainingDataset(csvText, employeeNrpSet);
          setTrainingCandidate({
            fileName: file.name,
            parsedData: parsed.data,
            rawRows,
            issues: parsed.issues,
            summary: buildValidationSummary(rawRows.length, parsed.issues),
          });
        } catch (error) {
          setTrainingError(
            error instanceof Error
              ? error.message
              : "Training CSV could not be parsed.",
          );
        } finally {
          setIsParsingTraining(false);
        }
      });
    } catch (error) {
      setTrainingError(
        error instanceof Error ? error.message : "Training CSV could not be read.",
      );
      setIsParsingTraining(false);
    } finally {
      event.target.value = "";
    }
  }

  function importEmployees() {
    if (!employeeCandidate) {
      return;
    }

    if (employeeCandidate.summary.invalidRecords > 0) {
      return;
    }

    if (employees.length > 0 && !employeeReplacementConfirmed) {
      return;
    }

    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: employeeCandidate.fileName,
      recordCount: employeeCandidate.parsedData.length,
    };

    replaceEmployees(employeeCandidate.parsedData, meta);
    setLastSuccess({
      kind: "employees",
      meta,
      validRecords: employeeCandidate.summary.validRecords,
      invalidRecords: employeeCandidate.summary.invalidRecords,
    });
    setEmployeeCandidate(null);
    setEmployeeReplacementConfirmed(false);
  }

  function importWorkHistory() {
    if (!workHistoryCandidate) {
      return;
    }
    if (workHistoryCandidate.summary.invalidRecords > 0) {
      return;
    }
    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: workHistoryCandidate.fileName,
      recordCount: workHistoryCandidate.parsedData.length,
    };
    replaceWorkHistory(workHistoryCandidate.parsedData, meta);
    setLastSuccess({
      kind: "training",
      meta,
      validRecords: workHistoryCandidate.summary.validRecords,
      invalidRecords: workHistoryCandidate.summary.invalidRecords,
    });
    setWorkHistoryCandidate(null);
  }
  function importTrainingHistory() {
    if (!trainingCandidate || trainingCandidate.summary.invalidRecords > 0) {
      return;
    }

    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: trainingCandidate.fileName,
      recordCount: trainingCandidate.parsedData.length,
    };

    replaceTrainingHistory(trainingCandidate.parsedData, meta);
    setLastSuccess({
      kind: "training",
      meta,
      validRecords: trainingCandidate.summary.validRecords,
      invalidRecords: trainingCandidate.summary.invalidRecords,
    });
    setTrainingCandidate(null);
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Import Center"
        title="Upload, validate, preview, and replace datasets"
        description="This flow keeps imports intentionally simple: full dataset replacement, validation-first review, preview, confirmation, and persistence into the active local dataset."
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <CurrentDatasetCard
          employeeCount={employees.length}
          trainingCount={usePortalStore.getState().trainingHistory.length}
          employeeImportMeta={employeeImportMeta}
          trainingImportMeta={trainingImportMeta}
        />
        <ImportSuccessCard success={lastSuccess} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ImportSection
          kind="employees"
          title="Employee CSV Upload"
          description="Upload `employees.csv`, validate every row, review the first 20 records, then replace the active employee dataset."
          badgeLabel="employees.csv"
          inputId={employeeInputId}
          isParsing={isParsingEmployee}
          onFileSelection={handleEmployeeFileSelection}
          candidate={employeeCandidate}
          errorMessage={employeeError}
          onImport={importEmployees}
          canImport={employeeCanImport}
          replacementWarning={
            employees.length > 0 && employeeCandidate ? (
              <ReplacementWarningCard
                currentEmployeeCount={employees.length}
                newEmployeeCount={employeeCandidate.summary.validRecords}
                lastImportDate={employeeImportMeta?.importedAt ?? null}
                confirmed={employeeReplacementConfirmed}
                onConfirmedChange={setEmployeeReplacementConfirmed}
              />
            ) : null
          }
        />

        <ImportSection
          kind="work_history"
          title="Work History CSV Upload"
          description="Upload `work_history.csv`, validate it against the active employee master, review the first 20 rows, then replace the work history dataset."
          badgeLabel="work_history.csv"
          inputId={workHistoryInputId}
          isParsing={isParsingWorkHistory}
          onFileSelection={handleWorkHistoryFileSelection}
          candidate={workHistoryCandidate}
          errorMessage={workHistoryError}
          onImport={importWorkHistory}
          canImport={employees.length > 0 && workHistoryCandidate?.summary.invalidRecords === 0}
        />
        <ImportSection
          kind="training"
          title="Training History CSV Upload"
          description="Upload `training_history.csv`, validate it against the active employee master, review the first 20 rows, then replace the training dataset."
          badgeLabel="training_history.csv"
          inputId={trainingInputId}
          isParsing={isParsingTraining}
          onFileSelection={handleTrainingFileSelection}
          candidate={trainingCandidate}
          errorMessage={trainingError}
          onImport={importTrainingHistory}
          canImport={trainingCanImport}
          topNotice={
            employees.length === 0 ? (
              <NoticeCard
                tone="warning"
                title="Employee dataset required first"
                body="Training validation depends on the active employee master. Import `employees.csv` before validating training history."
              />
            ) : null
          }
        />
      </div>
    </div>
  );
}

function ImportSection<T>({
  kind,
  title,
  description,
  badgeLabel,
  inputId,
  isParsing,
  onFileSelection,
  candidate,
  errorMessage,
  onImport,
  canImport,
  replacementWarning,
  topNotice,
}: {
  kind: ImportKind;
  title: string;
  description: string;
  badgeLabel: string;
  inputId: string;
  isParsing: boolean;
  onFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  candidate: ImportCandidate<T> | null;
  errorMessage: string | null;
  onImport: () => void;
  canImport: boolean;
  replacementWarning?: React.ReactNode;
  topNotice?: React.ReactNode;
}) {
  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge>{badgeLabel}</Badge>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                {description}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </label>
            <input
              id={inputId}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileSelection}
              className="sr-only"
            />
            {isParsing ? (
              <p className="text-xs font-medium text-[var(--muted)]">
                Validating file...
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {topNotice}
        {errorMessage ? (
          <NoticeCard
            tone="warning"
            title="Validation could not start"
            body={errorMessage}
          />
        ) : null}

        {candidate ? (
          <>
            <ValidationSummaryCard
              kind={kind}
              fileName={candidate.fileName}
              summary={candidate.summary}
            />
            {replacementWarning}
            <PreviewTableCard rows={candidate.rawRows} />
            <IssueListCard issues={candidate.issues} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--surface)] p-5">
              <div>
                <p className="text-sm font-semibold">Ready to import</p>
                <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                  {candidate.summary.invalidRecords === 0
                    ? "All rows are valid. Import will replace the active dataset for this file type."
                    : "Resolve invalid rows before importing this dataset."}
                </p>
              </div>
              <Button onClick={onImport} disabled={!canImport}>
                Import Dataset
              </Button>
            </div>
          </>
        ) : (
          <EmptyValidationState />
        )}
      </CardContent>
    </Card>
  );
}

function CurrentDatasetCard({
  employeeCount,
  trainingCount,
  employeeImportMeta,
  trainingImportMeta,
}: {
  employeeCount: number;
  trainingCount: number;
  employeeImportMeta: DatasetImportMeta | null;
  trainingImportMeta: DatasetImportMeta | null;
}) {
  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <CardTitle>Current Active Dataset</CardTitle>
        <CardDescription>
          Imported CSV files become the active client-side dataset and persist in
          local storage across refreshes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DatasetMetaPanel
          title="Employees"
          countLabel="Current employee count"
          countValue={employeeCount}
          meta={employeeImportMeta}
        />
        <DatasetMetaPanel
          title="Training History"
          countLabel="Current training count"
          countValue={trainingCount}
          meta={trainingImportMeta}
        />
      </CardContent>
    </Card>
  );
}

function DatasetMetaPanel({
  title,
  countLabel,
  countValue,
  meta,
}: {
  title: string;
  countLabel: string;
  countValue: number;
  meta: DatasetImportMeta | null;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/72 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent-strong)]">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {countLabel}
          </p>
        </div>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
        {countValue.toLocaleString()}
      </p>

      <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
        <p>Last import: {formatRelativeTime(meta?.importedAt ?? null)}</p>
        <p>File: {meta?.fileName ?? "--"}</p>
      </div>
    </div>
  );
}

function ValidationSummaryCard({
  kind,
  fileName,
  summary,
}: {
  kind: ImportKind;
  fileName: string;
  summary: ValidationSummary;
}) {
  const items = [
    { label: "Total Records", value: summary.totalRecords },
    { label: "Valid Records", value: summary.validRecords },
    { label: "Invalid Records", value: summary.invalidRecords },
    { label: "Missing Required Fields", value: summary.missingRequiredFields },
    { label: "Invalid Branch Codes", value: summary.invalidBranchCodes },
    { label: "Duplicate NRP", value: summary.duplicateNrp },
  ];

  if (kind === "training") {
    items.push({
      label: "Unknown Employee NRP",
      value: summary.unknownEmployeeNrp,
    });
  }

  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Validation Summary</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{fileName}</p>
        </div>
        <Badge>{summary.invalidRecords === 0 ? "Ready to Import" : "Review Issues"}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplacementWarningCard({
  currentEmployeeCount,
  newEmployeeCount,
  lastImportDate,
  confirmed,
  onConfirmedChange,
}: {
  currentEmployeeCount: number;
  newEmployeeCount: number;
  lastImportDate: string | null;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  return (
    <div className="rounded-[26px] border border-amber-300 bg-amber-50/90 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Replacement warning
            </p>
            <p className="mt-1 text-sm leading-7 text-amber-900/80">
              Importing this employee file will replace the active employee
              dataset. Training history will be cleared until a new training file
              is imported.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <WarningMetric
              label="Current Employee Count"
              value={currentEmployeeCount}
            />
            <WarningMetric label="New Employee Count" value={newEmployeeCount} />
            <WarningMetric
              label="Last Import Date"
              value={lastImportDate ? formatDateLabel(lastImportDate) : "--"}
            />
          </div>

          <label className="flex items-start gap-3 rounded-[20px] border border-amber-200 bg-white/70 p-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-400"
            />
            <span className="text-sm leading-7 text-amber-950">
              I confirm that this import should replace the current employee
              dataset.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function WarningMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-amber-950">{value}</p>
    </div>
  );
}

function PreviewTableCard({ rows }: { rows: Record<string, string>[] }) {
  const previewRows = rows.slice(0, 20);
  const headers = Array.from(
    previewRows.reduce((headerSet, row) => {
      Object.keys(row).forEach((key) => headerSet.add(key));
      return headerSet;
    }, new Set<string>()),
  );

  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-white/76">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Preview Table</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Showing the first 20 rows only. This preview is read-only.
          </p>
        </div>
        <Badge>{previewRows.length} Rows</Badge>
      </div>

      <div className="max-h-[360px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#f8f6f0]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap border-b border-[var(--border)] px-4 py-3 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, index) => (
              <tr key={`${index}-${Object.values(row).join("|")}`}>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="max-w-[260px] whitespace-nowrap border-b border-[var(--border)] px-4 py-3 text-[var(--muted)]"
                  >
                    {row[header] || "--"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IssueListCard({ issues }: { issues: ImportIssue[] }) {
  if (issues.length === 0) {
    return (
      <NoticeCard
        tone="success"
        title="Validation passed"
        body="No row-level validation issues were found."
      />
    );
  }

  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-white/76">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="text-sm font-semibold">Validation Issues</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          First {Math.min(issues.length, 12)} issues shown.
        </p>
      </div>
      <div className="space-y-3 p-5">
        {issues.slice(0, 12).map((issue) => (
          <div
            key={`${issue.row}-${issue.message}`}
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Row {issue.row}
            </p>
            <p className="mt-2 text-sm leading-7">{issue.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportSuccessCard({
  success,
}: {
  success: ImportSuccessState | null;
}) {
  if (!success) {
    return (
      <Card className="rounded-[30px]">
        <CardHeader>
          <CardTitle>Import Success Summary</CardTitle>
          <CardDescription>
            A completed import will appear here with dataset size and timestamp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm leading-7 text-[var(--muted)]">
            No successful import yet in this session.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[30px] border-emerald-200 bg-emerald-50/80">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-emerald-950">Import successful</CardTitle>
            <CardDescription className="mt-2 text-emerald-900/75">
              The {success.kind === "employees" ? "employee" : "training"} dataset
              is now active in Zustand and persisted to local storage.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <SuccessMetric label="Imported Records" value={success.meta.recordCount} />
        <SuccessMetric
          label="Imported At"
          value={formatDateLabel(success.meta.importedAt)}
        />
        <SuccessMetric label="File Name" value={success.meta.fileName} />
        <SuccessMetric label="Invalid Records" value={success.invalidRecords} />
      </CardContent>
    </Card>
  );
}

function SuccessMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[20px] border border-emerald-200 bg-white/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function EmptyValidationState() {
  return (
    <div className="rounded-[26px] border border-dashed border-[var(--border)] bg-white/60 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent-strong)]">
          <RefreshCcw className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Awaiting CSV upload</p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Upload a CSV file to start validation. The flow stays intentionally
            lightweight: validate, review summary, inspect preview, then import.
          </p>
        </div>
      </div>
    </div>
  );
}

function NoticeCard({
  tone,
  title,
  body,
}: {
  tone: "success" | "warning";
  title: string;
  body: string;
}) {
  const palette =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
      : "border-amber-300 bg-amber-50/90 text-amber-950";

  return (
    <div className={`rounded-[24px] border p-5 ${palette}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 opacity-80">{body}</p>
    </div>
  );
}

function buildValidationSummary(
  totalRecords: number,
  issues: ImportIssue[],
): ValidationSummary {
  const missingRequiredFields = issues.filter((issue) =>
    issue.message.includes(" is required"),
  ).length;
  const invalidBranchCodes = issues.filter((issue) =>
    issue.message.startsWith("Unknown Branch Code:"),
  ).length;
  const duplicateNrp = issues.filter((issue) =>
    issue.message.startsWith("Duplicate NRP:"),
  ).length;
  const unknownEmployeeNrp = issues.filter((issue) =>
    issue.message.startsWith("Training record references unknown employee NRP:"),
  ).length;

  return {
    totalRecords,
    validRecords: totalRecords - issues.length,
    invalidRecords: issues.length,
    missingRequiredFields,
    invalidBranchCodes,
    duplicateNrp,
    unknownEmployeeNrp,
    otherIssues:
      issues.length -
      missingRequiredFields -
      invalidBranchCodes -
      duplicateNrp -
      unknownEmployeeNrp,
  };
}
