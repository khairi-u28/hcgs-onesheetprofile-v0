"use client";

import Link from "next/link";
import { startTransition, useCallback, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  History,
  LayoutDashboard,
  RefreshCcw,
  RotateCcw,
  Upload,
  Users,
} from "lucide-react";
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

/* ────────────────────────── Types ──────────────────────────────────── */

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

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_META: Record<
  WizardStep,
  { label: string; description: string }
> = {
  1: {
    label: "Employee Dataset",
    description: "Upload and validate your employee master data",
  },
  2: {
    label: "Training History",
    description: "Upload training records linked to employees",
  },
  3: {
    label: "Work History",
    description: "Upload career movement records",
  },
  4: {
    label: "Review Summary",
    description: "Confirm all datasets before proceeding",
  },
  5: {
    label: "Start Exploring",
    description: "Your data is ready — dive in",
  },
};

/* ──────────────────── Root Wizard Component ─────────────────────────── */

export function ImportCenterFoundationView() {
  const organization = usePortalStore((state) => state.organization);
  const employees = usePortalStore((state) => state.employees);
  const trainingHistory = usePortalStore((state) => state.trainingHistory);
  const workHistory = usePortalStore((state) => state.workHistory);
  const dataset = usePortalStore((state) => state.dataset);
  const replaceEmployees = usePortalStore((state) => state.replaceEmployees);
  const replaceTrainingHistory = usePortalStore(
    (state) => state.replaceTrainingHistory,
  );
  const replaceWorkHistory = usePortalStore(
    (state) => state.replaceWorkHistory,
  );
  const resetAllData = usePortalStore((state) => state.resetAllData);

  /* ── Wizard state ── */
  const resolvedStep = useMemo((): WizardStep => {
    if (employees.length === 0) return 1;
    if (!dataset.trainingImport) return 2;
    if (!dataset.workHistoryImport) return 3;
    return 4;
  }, [employees.length, dataset.trainingImport, dataset.workHistoryImport]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(resolvedStep);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Allow the wizard to stay on a completed step to see results,
  // but never let it go ahead of resolvedStep (unless step 4→5 CTA)
  const activeStep = currentStep <= resolvedStep || currentStep === 5
    ? currentStep
    : resolvedStep;

  /* ── CSV local state ── */
  const [employeeCandidate, setEmployeeCandidate] =
    useState<ImportCandidate<EmployeeRecord> | null>(null);
  const [trainingCandidate, setTrainingCandidate] =
    useState<ImportCandidate<TrainingHistoryRecord> | null>(null);
  const [workHistoryCandidate, setWorkHistoryCandidate] =
    useState<ImportCandidate<WorkHistoryRecord> | null>(null);

  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [workHistoryError, setWorkHistoryError] = useState<string | null>(null);

  const [isParsingEmployee, setIsParsingEmployee] = useState(false);
  const [isParsingTraining, setIsParsingTraining] = useState(false);
  const [isParsingWorkHistory, setIsParsingWorkHistory] = useState(false);

  const [employeeReplacementConfirmed, setEmployeeReplacementConfirmed] =
    useState(false);

  const employeeInputId = useId();
  const trainingInputId = useId();
  const workHistoryInputId = useId();

  const branchCodeSet = useMemo(
    () =>
      new Set(organization.map((branch) => branch.branchCode.toUpperCase())),
    [organization],
  );
  const employeeNrpSet = useMemo(
    () => new Set(employees.map((e) => e.nrp)),
    [employees],
  );

  /* ── File handlers ── */
  const handleEmployeeFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setEmployeeError(null);
      setEmployeeCandidate(null);
      setEmployeeReplacementConfirmed(false);
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
          error instanceof Error
            ? error.message
            : "Employee CSV could not be read.",
        );
        setIsParsingEmployee(false);
      } finally {
        event.target.value = "";
      }
    },
    [branchCodeSet],
  );

  const handleTrainingFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setTrainingError(null);
      setTrainingCandidate(null);
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
          error instanceof Error
            ? error.message
            : "Training CSV could not be read.",
        );
        setIsParsingTraining(false);
      } finally {
        event.target.value = "";
      }
    },
    [employeeNrpSet],
  );

  const handleWorkHistoryFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setWorkHistoryError(null);
      setWorkHistoryCandidate(null);
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
              error instanceof Error
                ? error.message
                : "Work History CSV could not be parsed.",
            );
          } finally {
            setIsParsingWorkHistory(false);
          }
        });
      } catch (error) {
        setWorkHistoryError(
          error instanceof Error
            ? error.message
            : "Work History CSV could not be read.",
        );
        setIsParsingWorkHistory(false);
      } finally {
        event.target.value = "";
      }
    },
    [employeeNrpSet],
  );

  /* ── Import handlers ── */
  function importEmployees() {
    if (
      !employeeCandidate ||
      employeeCandidate.summary.invalidRecords > 0
    )
      return;
    if (employees.length > 0 && !employeeReplacementConfirmed) return;

    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: employeeCandidate.fileName,
      recordCount: employeeCandidate.parsedData.length,
    };
    replaceEmployees(employeeCandidate.parsedData, meta);
    setEmployeeCandidate(null);
    setEmployeeReplacementConfirmed(false);
    setCurrentStep(2);
  }

  function importTraining() {
    if (
      !trainingCandidate ||
      trainingCandidate.summary.invalidRecords > 0 ||
      employees.length === 0
    )
      return;

    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: trainingCandidate.fileName,
      recordCount: trainingCandidate.parsedData.length,
    };
    replaceTrainingHistory(trainingCandidate.parsedData, meta);
    setTrainingCandidate(null);
    setCurrentStep(3);
  }

  function importWorkHistory() {
    if (
      !workHistoryCandidate ||
      workHistoryCandidate.summary.invalidRecords > 0 ||
      employees.length === 0
    )
      return;

    const meta: DatasetImportMeta = {
      importedAt: new Date().toISOString(),
      fileName: workHistoryCandidate.fileName,
      recordCount: workHistoryCandidate.parsedData.length,
    };
    replaceWorkHistory(workHistoryCandidate.parsedData, meta);
    setWorkHistoryCandidate(null);
    setCurrentStep(4);
  }

  function handleReset() {
    resetAllData();
    setEmployeeCandidate(null);
    setTrainingCandidate(null);
    setWorkHistoryCandidate(null);
    setEmployeeError(null);
    setTrainingError(null);
    setWorkHistoryError(null);
    setShowResetDialog(false);
    setCurrentStep(1);
  }

  /* ── Derived flags ── */
  const employeeCanImport = employeeCandidate
    ? employeeCandidate.summary.invalidRecords === 0 &&
      (employees.length === 0 || employeeReplacementConfirmed)
    : false;

  const trainingCanImport =
    !!trainingCandidate &&
    employees.length > 0 &&
    trainingCandidate.summary.invalidRecords === 0;

  const workHistoryCanImport =
    !!workHistoryCandidate &&
    employees.length > 0 &&
    workHistoryCandidate.summary.invalidRecords === 0;

  /* ── Step completion status ── */
  const stepCompleted: Record<WizardStep, boolean> = {
    1: employees.length > 0,
    2: !!dataset.trainingImport,
    3: !!dataset.workHistoryImport,
    4: employees.length > 0 && !!dataset.trainingImport && !!dataset.workHistoryImport,
    5: false,
  };

  return (
    <div className="space-y-6">
      {/* ── Stepper header ─────────────────────────────── */}
      <div className="rounded-[28px] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Badge>Import Wizard</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Setup your workspace
            </h1>
          </div>
          {employees.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Data
            </Button>
          )}
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex items-center gap-2">
          {([1, 2, 3, 4, 5] as WizardStep[]).map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (step <= resolvedStep || (step === 5 && stepCompleted[4])) {
                    setCurrentStep(step);
                  }
                }}
                disabled={step > resolvedStep && !(step === 5 && stepCompleted[4])}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                  stepCompleted[step]
                    ? "bg-emerald-600 text-white"
                    : step === activeStep
                      ? "bg-[var(--accent)] text-white ring-4 ring-[var(--ring)]"
                      : step <= resolvedStep
                        ? "bg-white/80 text-[var(--foreground)] border border-[var(--border)]"
                        : "bg-white/40 text-[var(--muted)] border border-[var(--border)] opacity-50 cursor-not-allowed"
                }`}
              >
                {stepCompleted[step] ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  step
                )}
              </button>
              {idx < 4 && (
                <div
                  className={`hidden h-0.5 w-6 rounded-full sm:block md:w-10 lg:w-14 ${
                    stepCompleted[step]
                      ? "bg-emerald-400"
                      : "bg-[var(--border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current step label */}
        <div className="mt-4">
          <p className="text-sm font-semibold">
            Step {activeStep}: {STEP_META[activeStep].label}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {STEP_META[activeStep].description}
          </p>
        </div>
      </div>

      {/* ── Step content ───────────────────────────────── */}
      {activeStep === 1 && (
        <WizardUploadStep
          kind="employees"
          title="Upload Employee Dataset"
          description="Upload `employees.csv` to populate the workforce master. All rows will be validated against the organization branch structure."
          badgeLabel="employees.csv"
          inputId={employeeInputId}
          isParsing={isParsingEmployee}
          onFileSelection={handleEmployeeFile}
          candidate={employeeCandidate}
          errorMessage={employeeError}
          onImport={importEmployees}
          canImport={employeeCanImport}
          stepCompleted={stepCompleted[1]}
          completedCount={employees.length}
          completedLabel="employees loaded"
          onContinue={() => setCurrentStep(2)}
          replacementWarning={
            employees.length > 0 && employeeCandidate ? (
              <ReplacementWarningCard
                currentEmployeeCount={employees.length}
                newEmployeeCount={employeeCandidate.summary.validRecords}
                lastImportDate={dataset.employeeImport?.importedAt ?? null}
                confirmed={employeeReplacementConfirmed}
                onConfirmedChange={setEmployeeReplacementConfirmed}
              />
            ) : null
          }
        />
      )}

      {activeStep === 2 && (
        <WizardUploadStep
          kind="training"
          title="Upload Training History"
          description="Upload `training_history.csv` and validate it against the active employee master."
          badgeLabel="training_history.csv"
          inputId={trainingInputId}
          isParsing={isParsingTraining}
          onFileSelection={handleTrainingFile}
          candidate={trainingCandidate}
          errorMessage={trainingError}
          onImport={importTraining}
          canImport={trainingCanImport}
          stepCompleted={stepCompleted[2]}
          completedCount={trainingHistory.length}
          completedLabel="training records loaded"
          onContinue={() => setCurrentStep(3)}
        />
      )}

      {activeStep === 3 && (
        <WizardUploadStep
          kind="work_history"
          title="Upload Work History"
          description="Upload `work_history.csv` and validate it against the active employee master."
          badgeLabel="work_history.csv"
          inputId={workHistoryInputId}
          isParsing={isParsingWorkHistory}
          onFileSelection={handleWorkHistoryFile}
          candidate={workHistoryCandidate}
          errorMessage={workHistoryError}
          onImport={importWorkHistory}
          canImport={workHistoryCanImport}
          stepCompleted={stepCompleted[3]}
          completedCount={workHistory.length}
          completedLabel="work history records loaded"
          onContinue={() => setCurrentStep(4)}
        />
      )}

      {activeStep === 4 && (
        <ReviewStep
          employeeCount={employees.length}
          trainingCount={trainingHistory.length}
          workHistoryCount={workHistory.length}
          dataset={dataset}
          onContinue={() => setCurrentStep(5)}
          allComplete={stepCompleted[4]}
        />
      )}

      {activeStep === 5 && <SuccessStep />}

      {/* ── Reset confirmation dialog ─────────────────── */}
      {showResetDialog && (
        <ResetConfirmationDialog
          onCancel={() => setShowResetDialog(false)}
          onConfirm={handleReset}
        />
      )}
    </div>
  );
}

/* ────────────────────── Upload Step ────────────────────────────────── */

function WizardUploadStep<T>({
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
  stepCompleted,
  completedCount,
  completedLabel,
  onContinue,
  replacementWarning,
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
  stepCompleted: boolean;
  completedCount: number;
  completedLabel: string;
  onContinue: () => void;
  replacementWarning?: React.ReactNode;
}) {
  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge>{badgeLabel}</Badge>
              {stepCompleted && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Imported
                </span>
              )}
            </div>
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
              {stepCompleted ? "Re-upload CSV" : "Upload CSV"}
            </label>
            <input
              id={inputId}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileSelection}
              className="sr-only"
            />
            {isParsing && (
              <p className="text-xs font-medium text-[var(--muted)]">
                Validating file...
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Completed state */}
        {stepCompleted && !candidate && (
          <div className="flex items-center justify-between gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Dataset imported successfully
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  {completedCount.toLocaleString()} {completedLabel}
                </p>
              </div>
            </div>
            <Button onClick={onContinue} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <NoticeCard
            tone="warning"
            title="Validation could not start"
            body={errorMessage}
          />
        )}

        {/* Candidate review */}
        {candidate && (
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
        )}

        {/* Empty state */}
        {!stepCompleted && !candidate && !errorMessage && (
          <EmptyValidationState />
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────── Review Step (Step 4) ──────────────────────── */

function ReviewStep({
  employeeCount,
  trainingCount,
  workHistoryCount,
  dataset,
  onContinue,
  allComplete,
}: {
  employeeCount: number;
  trainingCount: number;
  workHistoryCount: number;
  dataset: {
    employeeImport: DatasetImportMeta | null;
    trainingImport: DatasetImportMeta | null;
    workHistoryImport: DatasetImportMeta | null;
  };
  onContinue: () => void;
  allComplete: boolean;
}) {
  const summaryItems = [
    {
      icon: Users,
      label: "Employee Dataset",
      count: employeeCount,
      meta: dataset.employeeImport,
      status: employeeCount > 0,
    },
    {
      icon: GraduationCap,
      label: "Training History",
      count: trainingCount,
      meta: dataset.trainingImport,
      status: !!dataset.trainingImport,
    },
    {
      icon: History,
      label: "Work History",
      count: workHistoryCount,
      meta: dataset.workHistoryImport,
      status: !!dataset.workHistoryImport,
    },
  ];

  return (
    <Card className="rounded-[30px]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge>Review</Badge>
          {allComplete && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              All datasets loaded
            </span>
          )}
        </div>
        <CardTitle>Dataset Summary</CardTitle>
        <CardDescription>
          Review all imported datasets before starting to explore your data.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-[24px] border p-5 ${
                item.status
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-[var(--border)] bg-white/72"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    item.status
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  {item.status ? (
                    <span className="text-xs text-emerald-700">Imported</span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">
                      Not imported
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                {item.count.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">records</p>

              {item.meta && (
                <div className="mt-4 space-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                  <p>File: {item.meta.fileName}</p>
                  <p>
                    Imported:{" "}
                    {formatRelativeTime(item.meta.importedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {allComplete && (
          <div className="flex items-center justify-between gap-4 rounded-[24px] bg-[var(--surface)] p-5">
            <div>
              <p className="text-sm font-semibold">All datasets ready</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Your workspace is fully configured. Continue to start exploring.
              </p>
            </div>
            <Button onClick={onContinue} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────── Success Step (Step 5) ─────────────────────── */

function SuccessStep() {
  return (
    <Card className="rounded-[30px] border-emerald-200 bg-emerald-50/60">
      <CardContent className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-emerald-950 sm:text-3xl">
          You&apos;re all set!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-emerald-800/80">
          All datasets have been imported and persisted. Your workforce analytics
          workspace is ready.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="gap-2 bg-emerald-600 px-8 hover:bg-emerald-700">
            <Link href="/">
              <LayoutDashboard className="h-4 w-4" />
              Open Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────── Reset Confirmation Dialog ──────────────────────── */

function ResetConfirmationDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Reset All Imported Data?
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              This will permanently remove:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Employee Dataset
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Training History
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Work History
              </li>
            </ul>
            <p className="mt-3 text-sm font-medium text-red-600">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Reset Everything
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Validation Summary Card ────────────────────────── */

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

  if (kind === "training" || kind === "work_history") {
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
        <Badge>
          {summary.invalidRecords === 0 ? "Ready to Import" : "Review Issues"}
        </Badge>
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

/* ────────────────── Replacement Warning Card ─────────────────────── */

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
              dataset. Training and work history will be cleared until new files
              are imported.
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

/* ──────────────────── Preview Table Card ──────────────────────────── */

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

/* ────────────────── Issue List Card ───────────────────────────────── */

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

/* ────────────────── Empty / Notice helpers ────────────────────────── */

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

/* ────────────────── Validation helpers ────────────────────────────── */

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
