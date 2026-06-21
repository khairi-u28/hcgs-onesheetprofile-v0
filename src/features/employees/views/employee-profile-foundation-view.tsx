"use client";

import Link from "next/link";
import { differenceInYears, differenceInMonths, parseISO, format } from "date-fns";
import { Award, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, UserRound, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationByBranchCode } from "@/lib/organization";
import { formatDateLabel, resolvePhotoUrl } from "@/lib/utils";
import { getMasaKerjaTotal, getMasaKerjaJabatan, getMasaKerjaCabang, calculateTenureFromDate } from "@/lib/utils/tenure";
import { usePortalStore } from "@/store/portal-store";
import type { EmployeeRecord, TrainingHistoryRecord, WorkHistoryRecord } from "@/types";
import { slugifyRegionName } from "@/lib/utils/slugify";

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

function TrainingStatusBadge({ status }: { status: string }) {
  if (status === "Failed") return <Badge className="bg-red-500 text-white hover:bg-red-600 border-transparent">Failed</Badge>;
  if (status === "Promoted") return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-transparent">Promoted</Badge>;
  if (status === "Pool of Cadre") return <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 border-transparent">Pool of Cadre</Badge>;
  if (status === "On Going") return <Badge variant="outline" className="border-amber-500 text-amber-600">On Going</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function EmployeeProfileFoundationView({ nrp }: { nrp: string }) {
  const employees = usePortalStore((state) => state.employees);
  const trainingHistory = usePortalStore((state) => state.trainingHistory);
  const workHistory = usePortalStore((state) => state.workHistory);

  const employee = employees.find((record) => record.nrp.trim().toUpperCase() === nrp.trim().toUpperCase());

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted)]">
        Employee not found
      </div>
    );
  }

  const allowedTrainingStatuses = ["Failed", "Pool of Cadre", "Promoted", "On Going"];
  const trainingRecords = [...trainingHistory]
    .filter((record) => record.employeeNrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase() && record.status && allowedTrainingStatuses.includes(record.status))
    .sort(
      (a, b) =>
        new Date(b.completionDate || 0).getTime() - new Date(a.completionDate || 0).getTime(),
    );

  const workRecords = [...workHistory]
    .filter((record) => record.nrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase())
    .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());

  const branch = getOrganizationByBranchCode(employee.branchCode);
  const regionId = employee.regionDiv || branch?.region || "Unknown Region";
  const areaId = employee.areaDept || branch?.area || "Unknown Area";
  const branchName = branch?.branchName ?? employee.branchCode;

  const photoUrl = resolvePhotoUrl(employee.photoUrl);

  const mkTotal = getMasaKerjaTotal(employee.entryDate, employee.masaKerjaTotal);
  const mkJabatan = getMasaKerjaJabatan(employee.pos, employee.masaKerjaJabatan, workRecords);
  const mkCabang = getMasaKerjaCabang(employee.branchCode, employee.masaKerjaCabang, workRecords);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] font-medium">
        <Link href="/" className="hover:text-foreground hover:underline">Home</Link>
        <span>›</span>
        <Link href={"/regions" as any} className="hover:text-foreground hover:underline">Regions</Link>
        <span>›</span>
        {regionId !== "Unknown Region" ? (
          <Link href={`/regions/${slugifyRegionName(regionId)}`} className="hover:text-foreground hover:underline">{regionId}</Link>
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
        {/* Left Column: HEADER Dossier */}
        <div className="space-y-6 sticky top-6">
          <Card className="rounded-[30px] border-[var(--border)] overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-b from-slate-100 to-white pt-8 pb-4 flex flex-col items-center">
              <img
                src={photoUrl || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"}
                alt={employee.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm mb-4"
                onError={(e) => { e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png" }}
              />
              <h2 className="text-2xl font-black text-center tracking-tight px-4">{employee.name}</h2>
              <p className="text-[var(--muted)] text-sm mt-1 font-mono">{employee.nrp}</p>
              <Badge variant="outline" className="mt-3 bg-white text-center whitespace-normal">{employee.position}</Badge>
            </div>
            <CardContent className="p-6 pt-2">
              <div className="space-y-4 text-sm mt-4">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[var(--muted)] shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Location</div>
                    <div className="font-medium">{employee.branchCode} - {branchName}</div>
                    <div className="text-xs text-[var(--muted)]">{regionId} · {areaId}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">POS: {employee.pos}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness size={16} className="text-[var(--muted)] shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Employment</div>
                    <div className="font-medium">Entry: {formatDateLabel(employee.entryDate)}</div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded border">
                        <div className="text-[var(--muted)]">Total</div>
                        <div className="font-mono font-medium">{mkTotal}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border">
                        <div className="text-[var(--muted)]">Jabatan</div>
                        <div className="font-mono font-medium">{mkJabatan}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border col-span-2">
                        <div className="text-[var(--muted)]">Cabang</div>
                        <div className="font-mono font-medium">{mkCabang}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sections */}
        <div className="space-y-6">
          
          {/* PERFORMANCE INDEX */}
          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Performance Index
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[var(--border)]">
                <div className="p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">KPI</div>
                  <div className="text-3xl font-black text-emerald-600">{formatPercent(employee.kpiFullYear)}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Mid: {formatPercent(employee.kpiMidYear)}</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">HAV</div>
                  <div className="text-3xl font-black text-blue-600">{employee.havCategory || "--"}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">Score: {employee.havScore ? employee.havScore.toFixed(1) : "--"}</div>
                </div>
                <div className="p-6 text-center col-span-2 md:col-span-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">PK History</div>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold">{employee.pk2025 || "--"}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase">2025</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{employee.pk2024 || "--"}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase">2024</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{employee.pk2023 || "--"}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase">2023</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PERSONAL INFORMATION */}
          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserRound size={18} className="text-indigo-500" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Date of Birth & Age</div>
                  <div className="font-medium mt-1">{formatDateLabel(employee.dateOfBirth)} ({formatAge(employee.dateOfBirth)})</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Education</div>
                  <div className="font-medium mt-1">{employee.educationLevel || "--"}</div>
                  <div className="text-sm text-[var(--muted)]">{employee.educationInstitution || "--"}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Strengths</div>
                  <div className="flex flex-wrap gap-2">
                    {employee.strength1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <span className="text-emerald-600 font-bold">✓</span> {employee.strength1}
                      </span>
                    )}
                    {employee.strength2 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <span className="text-emerald-600 font-bold">✓</span> {employee.strength2}
                      </span>
                    )}
                    {!employee.strength1 && !employee.strength2 && (
                      <span className="text-sm text-[var(--muted)]">--</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Areas of Development</div>
                  <div className="flex flex-wrap gap-2">
                    {employee.developmentArea1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                        <span className="text-orange-600">▲</span> {employee.developmentArea1}
                      </span>
                    )}
                    {employee.developmentArea2 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                        <span className="text-orange-600">▲</span> {employee.developmentArea2}
                      </span>
                    )}
                    {!employee.developmentArea1 && !employee.developmentArea2 && (
                      <span className="text-sm text-[var(--muted)]">--</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DEV PROGRAM & TRAINING HISTORY */}
          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap size={18} className="text-teal-500" /> Dev Program & Training History
              </CardTitle>
            </CardHeader>
            <div className="p-6 bg-slate-50/30 border-b border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Last Dev Program</div>
                <div className="font-medium mt-1">{employee.lastDevelopmentProgram || "--"}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Program Status</div>
                <div className="font-medium mt-1">{employee.developmentProgramStatus || "--"}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Program Period</div>
                <div className="font-medium mt-1">{employee.developmentProgramPeriod || "--"}</div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-slate-50/30">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Training Name</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Year</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {trainingRecords.map((record, i) => {
                      const year = record.completionDate ? format(parseISO(record.completionDate), "yyyy") : "--";
                      return (
                        <tr key={i} className="hover:bg-[var(--surface)] transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-700">{record.trainingName || "--"}</td>
                          <td className="px-6 py-3 text-[var(--muted)]">{year}</td>
                          <td className="px-6 py-3 text-right">
                            <TrainingStatusBadge status={record.status!} />
                          </td>
                        </tr>
                      );
                    })}
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

          {/* WORKING EXPERIENCE HISTORY */}
          <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-slate-500" /> Working Experience History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-slate-50/30">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Timeline</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Position / POS</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)]">Branch</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {workRecords.map((record, i) => {
                      const start = formatDateLabel(record.startDate);
                      const end = record.endDate ? formatDateLabel(record.endDate) : "Present";
                      let duration = "--";
                      if (record.startDate && record.endDate) {
                        const m = differenceInMonths(parseISO(record.endDate), parseISO(record.startDate));
                        duration = `${Math.floor(m/12).toString().padStart(2, '0')}-${(m%12).toString().padStart(2, '0')}`;
                      } else if (record.startDate && !record.endDate) {
                         const calc = calculateTenureFromDate(record.startDate);
                         if (calc) duration = calc;
                      }

                      return (
                        <tr key={i} className="hover:bg-[var(--surface)] transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-700 whitespace-nowrap">{start}</div>
                            <div className="text-xs text-[var(--muted)] whitespace-nowrap">to {end}</div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-700">{record.position}</div>
                            <div className="text-xs text-[var(--muted)]">{record.pos}</div>
                          </td>
                          <td className="px-6 py-3">
                            {record.branchCode || record.branchName ? (
                              <div className="font-medium text-slate-700">
                                {record.branchCode && record.branchName
                                  ? `${record.branchCode} · ${record.branchName}`
                                  : record.branchCode || record.branchName}
                              </div>
                            ) : (
                              <div className="text-sm text-[var(--muted)]">Unknown Branch</div>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                             <Badge variant="outline" className="font-mono bg-white">{duration}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {workRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[var(--muted)]">No work history available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
