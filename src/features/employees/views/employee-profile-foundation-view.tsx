"use client";

import Link from "next/link";
import { differenceInYears, differenceInMonths, parseISO } from "date-fns";
import { BriefcaseBusiness, GraduationCap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationByBranchCode } from "@/lib/organization";
import { formatDateLabel, resolvePhotoUrl } from "@/lib/utils";
import {
  getMasaKerjaTotal,
  getMasaKerjaJabatan,
  getMasaKerjaCabang,
} from "@/lib/utils/tenure";
import { usePortalStore } from "@/store/portal-store";
import {
  slugifyRegionName,
  slugifyOrganizationName,
} from "@/lib/utils/slugify";
import { useMemo } from "react";
import {
  getMainContentClasses,
  getCardHeaderClasses,
  getCardContentClasses,
  getTableTdClasses,
  getTableThClasses,
} from "@/lib/ui/layout-config";

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
  if (status === "Failed")
    return (
      <Badge className="bg-red-500 text-white hover:bg-red-600 border-transparent">
        Failed
      </Badge>
    );
  if (status === "Promoted")
    return (
      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-transparent">
        Promoted
      </Badge>
    );
  if (status === "Pool of Cadre")
    return (
      <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 border-transparent">
        Pool of Cadre
      </Badge>
    );
  if (status === "On Going")
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-600">
        On Going
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

export function EmployeeProfileFoundationView({ nrp }: { nrp: string }) {
  const employees = usePortalStore((state) => state.employees);
  const trainingHistory = usePortalStore((state) => state.trainingHistory);
  const workHistory = usePortalStore((state) => state.workHistory);

  const employee = useMemo(() => {
    return employees.find(
      (record) => record.nrp.trim().toUpperCase() === nrp.trim().toUpperCase(),
    );
  }, [employees, nrp]);

  const latestProgramRecord = useMemo(() => {
    if (!employee) return null;
    const employeeTrainings = trainingHistory.filter(
      (record) =>
        record.employeeNrp.trim().toUpperCase() ===
        employee.nrp.trim().toUpperCase(),
    );
    if (employeeTrainings.length === 0) return null;

    return [...employeeTrainings].sort((a, b) => {
      const endA = a.endDate || a.completionDate || "";
      const endB = b.endDate || b.completionDate || "";
      if (endA !== endB) {
        if (!endA) return 1;
        if (!endB) return -1;
        return new Date(endB).getTime() - new Date(endA).getTime();
      }

      const startA = a.startDate || "";
      const startB = b.startDate || "";
      if (startA !== startB) {
        if (!startA) return 1;
        if (!startB) return -1;
        return new Date(startB).getTime() - new Date(startA).getTime();
      }

      return trainingHistory.indexOf(b) - trainingHistory.indexOf(a);
    })[0];
  }, [trainingHistory, employee]);

  const trainingRecords = useMemo(() => {
    if (!employee) return [];
    return [...trainingHistory]
      .filter(
        (record) =>
          record.employeeNrp.trim().toUpperCase() ===
          employee.nrp.trim().toUpperCase(),
      )
      .sort((a, b) => {
        const dateA = new Date(
          a.endDate || a.completionDate || a.startDate || 0,
        ).getTime();
        const dateB = new Date(
          b.endDate || b.completionDate || b.startDate || 0,
        ).getTime();
        return dateB - dateA;
      });
  }, [trainingHistory, employee]);

  const workRecords = useMemo(() => {
    if (!employee) return [];
    return [...workHistory]
      .filter(
        (record) =>
          record.nrp.trim().toUpperCase() === employee.nrp.trim().toUpperCase(),
      )
      .sort(
        (a, b) =>
          new Date(b.startDate || 0).getTime() -
          new Date(a.startDate || 0).getTime(),
      );
  }, [workHistory, employee]);

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted)]">
        Employee not found
      </div>
    );
  }

  const lastDevProgram = latestProgramRecord
    ? latestProgramRecord.trainingName
    : employee.lastDevelopmentProgram || "--";

  const lastDevProgramStatus = latestProgramRecord
    ? latestProgramRecord.status || "--"
    : employee.developmentProgramStatus || "--";

  const lastDevProgramPeriod = latestProgramRecord
    ? latestProgramRecord.period ||
      (latestProgramRecord.endDate || latestProgramRecord.completionDate
        ? new Date(
            latestProgramRecord.endDate ||
              latestProgramRecord.completionDate ||
              "",
          )
            .getFullYear()
            .toString()
        : "--")
    : employee.developmentProgramPeriod || "--";

  const branch = getOrganizationByBranchCode(employee.branchCode);
  const regionId = employee.regionDiv || branch?.region || "Unknown Region";
  const areaId = employee.areaDept || branch?.area || "Unknown Area";
  const branchName = branch?.branchName ?? employee.branchCode;

  const photoUrl = resolvePhotoUrl(employee.photoUrl);

  const mkTotal = getMasaKerjaTotal(
    employee.entryDate,
    employee.masaKerjaTotal,
  );
  const mkJabatan = getMasaKerjaJabatan(
    employee.pos,
    employee.masaKerjaJabatan,
    workRecords,
  );
  const mkCabang = getMasaKerjaCabang(
    employee.branchCode,
    employee.masaKerjaCabang,
    workRecords,
  );

  return (
    <div className={getMainContentClasses("space-y-4 pb-8")}>
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] font-medium">
        <Link href="/" className="hover:text-foreground hover:underline">
          Home
        </Link>
        <span>›</span>
        <Link href="/regions" className="hover:text-foreground hover:underline">
          Regions
        </Link>
        <span>›</span>
        {regionId !== "Unknown Region" ? (
          <Link
            href={`/regions/${slugifyRegionName(regionId)}`}
            className="hover:text-foreground hover:underline"
          >
            {regionId}
          </Link>
        ) : (
          <span>{regionId}</span>
        )}
        <span>›</span>
        {areaId !== "Unknown Area" ? (
          <Link
            href={`/areas/${slugifyOrganizationName(areaId)}`}
            className="hover:text-foreground hover:underline"
          >
            {areaId}
          </Link>
        ) : (
          <span>{areaId}</span>
        )}
        <span>›</span>
        <Link
          href={`/branches/${encodeURIComponent(employee.branchCode)}`}
          className="hover:text-foreground hover:underline"
        >
          {branchName}
        </Link>
        <span>›</span>
        <span className="font-bold text-foreground bg-[var(--surface)] px-2 py-0.5 rounded-md text-xs">
          {employee.name}
        </span>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(280px,22%)_1fr] items-start">
        {/* Left Column: Sticky Dossier Sidebar */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <Card className="rounded-[4px] border-[var(--border)] overflow-hidden bg-white shadow-sm">
            {/* 1. Employee Section */}
            <div className="bg-gradient-to-b from-slate-50 to-white pt-2 pb-2 flex flex-col items-center border-b border-slate-100">
              <img
                src={
                  photoUrl ||
                  "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
                }
                alt={employee.name}
                className="rounded-full border-4 border-white object-cover shadow-sm mb-2"
                style={{ height: "96px", width: "96px" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
                }}
              />
              <h2 className="text-lg font-black text-center tracking-tight px-4 leading-tight text-slate-800">
                {employee.name}
              </h2>
              <p className="text-[var(--muted)] text-[11px] font-mono mt-0.5">
                {employee.nrp}
              </p>
              <Badge
                variant="outline"
                className="mt-2 bg-white text-center text-[10px] px-2 py-0.5 border-slate-200 text-slate-600 max-w-[90%] truncate"
              >
                {employee.position}
              </Badge>
            </div>

            <CardContent
              className={getCardContentClasses("p-0 space-y-3.5 text-xs")}
            >
              {/* 2. Organization Section */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                  Organization
                </h3>
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                  <span className="text-[var(--muted)]">Region</span>
                  <span className="font-medium text-slate-800">{regionId}</span>
                  <span className="text-[var(--muted)]">Area</span>
                  <span className="font-medium text-slate-800">{areaId}</span>
                  <span className="text-[var(--muted)]">Branch</span>
                  <span className="font-medium text-slate-800">
                    {employee.branchCode} - {branchName}
                  </span>
                  <span className="text-[var(--muted)]">POS</span>
                  <span className="font-medium text-slate-800">
                    {employee.pos}
                  </span>
                </div>
              </div>

              {/* 3. Employment Section */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                  Employment
                </h3>
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 items-baseline">
                  <span className="text-[var(--muted)]">Join Date</span>
                  <span className="font-medium text-slate-800">
                    {formatDateLabel(employee.entryDate)}
                  </span>
                  <span className="text-[var(--muted)]">Golongan</span>
                  <span className="font-medium text-slate-800">
                    {employee.golongan || "--"}
                  </span>
                  <span className="text-[var(--muted)]">HAV Category</span>
                  <span className="font-medium text-slate-800">
                    {employee.havCategory || "--"}
                  </span>
                  <span className="text-[var(--muted)] col-span-2">
                    Masa Kerja:
                  </span>
                  <div className="col-span-2 grid grid-cols-3 gap-1.5 text-center mt-1 w-full">
                    <div className="bg-slate-50/50 border border-slate-100 py-1 px-0.5 rounded">
                      <div className="text-[8px] text-[var(--muted)] uppercase font-semibold">
                        Total
                      </div>
                      <div className="font-mono font-bold text-slate-700 text-[10px]">
                        {mkTotal}
                      </div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 py-1 px-0.5 rounded">
                      <div className="text-[8px] text-[var(--muted)] uppercase font-semibold">
                        Position
                      </div>
                      <div className="font-mono font-bold text-slate-700 text-[10px]">
                        {mkJabatan}
                      </div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 py-1 px-0.5 rounded">
                      <div className="text-[8px] text-[var(--muted)] uppercase font-semibold">
                        Branch
                      </div>
                      <div className="font-mono font-bold text-slate-700 text-[10px]">
                        {mkCabang}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Personal Section */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                  Personal
                </h3>
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                  <span className="text-[var(--muted)]">Age</span>
                  <span className="font-medium text-slate-800">
                    {formatAge(employee.dateOfBirth)}
                  </span>
                  <span className="text-[var(--muted)]">Birth Date</span>
                  <span className="font-medium text-slate-800">
                    {formatDateLabel(employee.dateOfBirth)}
                  </span>
                  <span className="text-[var(--muted)]">Education</span>
                  <span className="font-medium text-slate-800">
                    {employee.educationLevel || "--"}
                  </span>
                  {employee.educationInstitution && (
                    <>
                      <span className="text-[var(--muted)]">Institution</span>
                      <span className="font-medium text-slate-800 leading-tight">
                        {employee.educationInstitution}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 5. Strengths Section */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                  Strengths
                </h3>
                <div className="flex flex-wrap gap-1">
                  {employee.strength1 && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-semibold hover:bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ {employee.strength1}
                    </Badge>
                  )}
                  {employee.strength2 && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-semibold hover:bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ {employee.strength2}
                    </Badge>
                  )}
                  {!employee.strength1 && !employee.strength2 && (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </div>
              </div>

              {/* 6. Areas of Development Section */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                  Areas of Development
                </h3>
                <div className="flex flex-wrap gap-1">
                  {employee.developmentArea1 && (
                    <Badge className="bg-orange-50 text-orange-700 border-orange-100 text-[10px] font-semibold hover:bg-orange-50 px-2 py-0.5 rounded-full">
                      ▲ {employee.developmentArea1}
                    </Badge>
                  )}
                  {employee.developmentArea2 && (
                    <Badge className="bg-orange-50 text-orange-700 border-orange-100 text-[10px] font-semibold hover:bg-orange-50 px-2 py-0.5 rounded-full">
                      ▲ {employee.developmentArea2}
                    </Badge>
                  )}
                  {!employee.developmentArea1 && !employee.developmentArea2 && (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stacked Content List */}
        <div className="space-y-4">
          {/* Card 1: PERFORMANCE INDEX */}
          <Card className="rounded-[4px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className={getCardHeaderClasses("p-2")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Performance
                Index
              </CardTitle>
            </CardHeader>
            <CardContent className={getCardContentClasses("p-0")}>
              <div className="flex flex-col divide-y divide-[var(--border)]">
                {/* Top summary row */}
                <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                  <div className="p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      KPI
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                      {formatPercent(employee.kpiFullYear)}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      Mid: {formatPercent(employee.kpiMidYear)}
                    </div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      HAV
                    </div>
                    <div className="text-2xl font-black text-blue-600">
                      {employee.havCategory || "--"}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      Score:{" "}
                      {employee.havScore ? employee.havScore.toFixed(1) : "--"}
                    </div>
                  </div>
                </div>
                {/* Bottom section: PK History */}
                <div className="p-2 bg-slate-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 text-center">
                    PK History
                  </div>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-base font-bold text-slate-800">
                        {employee.pk2025 || "--"}
                      </div>
                      <div className="text-[9px] text-[var(--muted)] uppercase font-semibold">
                        2025
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-slate-800">
                        {employee.pk2024 || "--"}
                      </div>
                      <div className="text-[9px] text-[var(--muted)] uppercase font-semibold">
                        2024
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-slate-800">
                        {employee.pk2023 || "--"}
                      </div>
                      <div className="text-[9px] text-[var(--muted)] uppercase font-semibold">
                        2023
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: DEV PROGRAM & TRAINING HISTORY */}
          <Card className="rounded-[4px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className={getCardHeaderClasses("p-2")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-teal-500" /> Dev
                Program & Training History
              </CardTitle>
            </CardHeader>
            <div className="p-2 bg-slate-50/20 border-b border-[var(--border)] grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Last Dev Program
                </div>
                <div className="font-semibold mt-0.5 text-slate-800">
                  {lastDevProgram}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Program Status
                </div>
                <div className="font-semibold mt-0.5 text-slate-800">
                  {lastDevProgramStatus}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Program Period
                </div>
                <div className="font-semibold mt-0.5 text-slate-800">
                  {lastDevProgramPeriod}
                </div>
              </div>
            </div>
            <CardContent className={getCardContentClasses("p-0")}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border)] bg-slate-50/30">
                    <tr>
                      <th className={getTableThClasses("py-2 px-3")}>
                        Training Name
                      </th>
                      <th className={getTableThClasses("py-2 px-3")}>
                        Start Date
                      </th>
                      <th className={getTableThClasses("py-2 px-3")}>
                        End Date
                      </th>
                      <th className={getTableThClasses("py-2 px-3")}>Period</th>
                      <th className={getTableThClasses("py-2 px-3 text-right")}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {trainingRecords.map((record, i) => {
                      const startDateStr = record.startDate
                        ? formatDateLabel(record.startDate)
                        : "--";
                      const endDateStr =
                        record.endDate || record.completionDate
                          ? formatDateLabel(
                              record.endDate || record.completionDate,
                            )
                          : "--";
                      const periodStr = record.period || "--";
                      return (
                        <tr
                          key={i}
                          className="hover:bg-[var(--surface)] transition-colors"
                        >
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 font-semibold text-slate-700",
                            )}
                          >
                            {record.trainingName || "--"}
                          </td>
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 text-slate-600",
                            )}
                          >
                            {startDateStr}
                          </td>
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 text-slate-600",
                            )}
                          >
                            {endDateStr}
                          </td>
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 text-[var(--muted)]",
                            )}
                          >
                            {periodStr}
                          </td>
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 text-right",
                            )}
                          >
                            <TrainingStatusBadge
                              status={record.status || "--"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {trainingRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-[var(--muted)]"
                        >
                          No active training records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: WORKING EXPERIENCE HISTORY */}
          <Card className="rounded-[4px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <CardHeader className={getCardHeaderClasses("p-4")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <BriefcaseBusiness size={16} className="text-slate-500" />{" "}
                Working Experience History
              </CardTitle>
            </CardHeader>
            <CardContent className={getCardContentClasses("p-0")}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border)] bg-slate-50/30">
                    <tr>
                      <th className={getTableThClasses("py-2 px-2")}>
                        Timeline
                      </th>
                      <th className={getTableThClasses("py-2 px-2")}>
                        Position / POS
                      </th>
                      {/* <th className={getTableThClasses("py-2 px-3")}>Branch</th> */}
                      <th className={getTableThClasses("py-2 px-2 text-right")}>
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {workRecords.map((record, i) => {
                      const start = formatDateLabel(record.startDate);
                      const end = record.isCurrent
                        ? "Present"
                        : record.endDate
                          ? formatDateLabel(record.endDate)
                          : "Present";
                      let duration = "--";
                      if (record.startDate && record.endDate) {
                        try {
                          const m = differenceInMonths(
                            parseISO(record.endDate),
                            parseISO(record.startDate),
                          );
                          if (!isNaN(m)) {
                            duration = `${Math.floor(m / 12)
                              .toString()
                              .padStart(
                                2,
                                "0",
                              )}-${(m % 12).toString().padStart(2, "0")}`;
                          }
                        } catch {
                          duration = "--";
                        }
                      }

                      const branchDisplay = record.branchName
                        ? record.branchName
                        : record.branchCode
                          ? record.branchCode
                          : "Unknown Branch";

                      return (
                        <tr
                          key={i}
                          className="hover:bg-[var(--surface)] transition-colors"
                        >
                          <td className={getTableTdClasses("py-2 px-2")}>
                            <div className="font-semibold text-slate-700 whitespace-nowrap">
                              {start}
                            </div>
                            <div className="text-[11px] text-[var(--muted)] whitespace-nowrap">
                              to {end}
                            </div>
                          </td>
                          <td className={getTableTdClasses("py-2 px-2")}>
                            <div className="font-semibold text-slate-700">
                              {record.position}
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              {record.pos}
                            </div>
                          </td>
                          {/* <td
                            className={getTableTdClasses(
                              "py-2 px-3 font-semibold text-slate-700",
                            )}
                          >
                            {branchDisplay}
                          </td> */}
                          <td
                            className={getTableTdClasses(
                              "py-2 px-2 text-right",
                            )}
                          >
                            <Badge
                              variant="outline"
                              className="font-mono bg-white text-[10px] px-1.5 py-0.5 border-slate-200"
                            >
                              {duration}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {workRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-[var(--muted)]"
                        >
                          No work history available.
                        </td>
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
