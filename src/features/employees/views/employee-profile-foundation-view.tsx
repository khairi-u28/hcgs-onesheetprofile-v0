"use client";

import Link from "next/link";
import { differenceInYears, differenceInMonths, formatDistanceToNowStrict, parseISO } from "date-fns";
import { Award, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, UserRound, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationByBranchCode } from "@/lib/organization";
import { formatDateLabel, resolvePhotoUrl } from "@/lib/utils";
import { usePortalStore } from "@/store/portal-store";
import type { EmployeeRecord, TrainingHistoryRecord, WorkHistoryRecord } from "@/types";

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatAge(value: string | null) {
  if (!value) return "--";
  const date = parseISO(value);
  if (!date || Number.isNaN(date.getTime())) return "--";
  return `${differenceInYears(new Date(), date)} years`;
}

export function EmployeeProfileFoundationView({ nrp }: { nrp: string }) {
  const employees = usePortalStore((state) => state.employees);
  const trainingHistory = usePortalStore((state) => state.trainingHistory);
  const workHistory = usePortalStore((state) => state.workHistory);

  const employee = employees.find((record) => record.nrp === nrp);

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted)]">
        Employee not found
      </div>
    );
  }

  const organization = getOrganizationByBranchCode(employee.branchCode);
  const allowedTrainingStatuses = ["Failed", "Pool of Cadre", "Promoted", "On Going"];
  const trainingRecords = [...trainingHistory]
    .filter((record) => record.employeeNrp === employee.nrp && record.status && allowedTrainingStatuses.includes(record.status))
    .sort(
      (a, b) =>
        new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime(),
    );

  const workRecords = [...workHistory]
    .filter((record) => record.nrp === employee.nrp)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const branch = getOrganizationByBranchCode(employee.branchCode);
  const regionId = branch?.region ?? "Unknown Region";
  const areaId = branch?.area ?? "Unknown Area";
  const branchName = branch?.branchName ?? employee.branchCode;

  const photoUrl = resolvePhotoUrl(employee.photoUrl);
  const totalTenure = formatDistanceToNowStrict(parseISO(employee.entryDate), { addSuffix: false });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] font-medium">
        <Link href="/" className="hover:text-foreground hover:underline">Home</Link>
        <span>›</span>
        {regionId !== "Unknown Region" ? (
          <Link href={`/regions/${encodeURIComponent(regionId)}`} className="hover:text-foreground hover:underline">{regionId}</Link>
        ) : (
          <span>{regionId}</span>
        )}
        <span>›</span>
        {areaId !== "Unknown Area" ? (
          <Link href={`/areas/${encodeURIComponent(areaId)}`} className="hover:text-foreground hover:underline">{areaId}</Link>
        ) : (
          <span>{areaId}</span>
        )}
        <span>›</span>
        <Link href={`/branches/${encodeURIComponent(employee.branchCode)}`} className="hover:text-foreground hover:underline">{branchName}</Link>
        <span>›</span>
        <span className="font-bold text-foreground bg-[var(--surface)] px-2 py-0.5 rounded-md">{employee.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] items-start">
        {/* Left Column: Identity Dossier (30%) */}
        <div className="space-y-6 sticky top-6">
          <Card className="rounded-[30px] border-[var(--border)] overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-b from-slate-100 to-white pt-8 pb-4 flex flex-col items-center">
              <img
                src={photoUrl || "/placeholder-avatar.jpg"}
                alt={employee.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm mb-4"
              />
              <h2 className="text-2xl font-black text-center tracking-tight px-4">{employee.name}</h2>
              <p className="text-[var(--muted)] text-sm mt-1">{employee.nrp}</p>
              <Badge variant="outline" className="mt-3 bg-white">{employee.position}</Badge>
            </div>
            <CardContent className="p-6 pt-2">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {employee.havCategory && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">HAV: {employee.havCategory}</Badge>
                )}
                {employee.pk2025 && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">PK: {employee.pk2025}</Badge>
                )}
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">KPI: {formatPercent(employee.kpiFullYear ?? employee.kpiMidYear)}</Badge>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <UserRound size={16} className="text-[var(--muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Demographics</div>
                    <div className="font-medium">{formatAge(employee.dateOfBirth)} ({formatDateLabel(employee.dateOfBirth)})</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness size={16} className="text-[var(--muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Employment</div>
                    <div className="font-medium">{totalTenure} tenure</div>
                    <div className="text-xs text-[var(--muted)]">Since {formatDateLabel(employee.entryDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[var(--muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Location</div>
                    <div className="font-medium">{branchName}</div>
                    <div className="text-xs text-[var(--muted)]">POS: {employee.pos}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Performance & History (70%) */}
        <div className="space-y-6">
          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                <div className="p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">KPI Full Year</div>
                  <div className="text-3xl font-black text-emerald-600">{formatPercent(employee.kpiFullYear)}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Mid Year: {formatPercent(employee.kpiMidYear)}</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">PK Evaluation</div>
                  <div className="text-3xl font-black text-indigo-600">{employee.pk2025 || "--"}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">2024: {employee.pk2024 || "--"} · 2023: {employee.pk2023 || "--"}</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">HAV Score</div>
                  <div className="text-3xl font-black text-blue-600">{employee.havScore ? employee.havScore.toFixed(1) : "--"}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">{employee.havRaw || "No raw score"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-500" /> Development & Training
              </CardTitle>
              <Badge variant="outline">{employee.developmentProgramStatus || "Not in program"}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-slate-50/30">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Program</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Completion</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {trainingRecords.map((record, i) => (
                      <tr key={i} className="hover:bg-[var(--surface)] transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-700">{record.trainingName || "--"}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">{formatDateLabel(record.completionDate)}</td>
                        <td className="px-6 py-3 text-right">
                          <TrainingStatusBadge status={record.status!} />
                        </td>
                      </tr>
                    ))}
                    {trainingRecords.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-[var(--muted)]">No active training records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-slate-500" /> Career Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {workRecords.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border)] before:to-transparent">
                  {workRecords.map((record, i) => {
                    const start = parseISO(record.startDate);
                    const end = parseISO(record.endDate);
                    const duration = (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()))
                      ? differenceInMonths(end, start)
                      : null;
                      
                    return (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[var(--surface)] text-[var(--muted)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Award size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[var(--surface)] p-4 rounded-[20px] border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-slate-800 text-sm">{record.position}</h3>
                            <span className="text-xs font-semibold text-[var(--muted)]">{formatDateLabel(record.startDate)}</span>
                          </div>
                          <div className="text-xs text-[var(--muted)] mb-2">{record.branchName} · {record.branchCode}</div>
                          {duration !== null && (
                            <Badge variant="outline" className="text-[10px] bg-white text-slate-500 border-slate-200">
                              {Math.floor(duration / 12)}y {duration % 12}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-[var(--muted)] py-8">No historical work records imported.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TrainingStatusBadge({ status }: { status: string }) {
  if (status === "Failed") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><AlertTriangle size={12}/> {status}</span>;
  }
  if (status === "Promoted") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><CheckCircle2 size={12}/> {status}</span>;
  }
  if (status === "On Going") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"><CircleDashed size={12}/> {status}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200"><Sparkles size={12}/> {status}</span>;
}
