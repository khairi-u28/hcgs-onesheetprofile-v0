"use client";

import { Briefcase, Database, FileSpreadsheet, GraduationCap } from "lucide-react";
import { summarizeDataset } from "@/lib/analytics/overview";
import { formatRelativeTime } from "@/lib/utils";
import { usePortalStore } from "@/store/portal-store";

export function DatasetStatus() {
  const employees = usePortalStore((state) => state.employees);
  const trainingHistory = usePortalStore((state) => state.trainingHistory);
  const workHistory = usePortalStore((state) => state.workHistory);
  const dataset = usePortalStore((state) => state.dataset);
  const summary = summarizeDataset(employees, trainingHistory);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatusChip
        icon={Database}
        label="Employee records"
        value={summary.employeeCount.toLocaleString()}
      />
      <StatusChip
        icon={GraduationCap}
        label="Training records"
        value={summary.trainingCount.toLocaleString()}
      />
      <StatusChip
        icon={Briefcase}
        label="Work history records"
        value={workHistory.length.toLocaleString()}
      />
      <StatusChip
        icon={FileSpreadsheet}
        label="Last replacement"
        value={formatRelativeTime(
          dataset.workHistoryImport?.importedAt ??
            dataset.trainingImport?.importedAt ??
            dataset.employeeImport?.importedAt ??
            null,
        )}
      />
    </div>
  );
}

function StatusChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/72 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent-strong)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
