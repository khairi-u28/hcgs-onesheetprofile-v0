"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/shared/page-hero";
import { usePortalStore } from "@/store/portal-store";
import { getOrganizationByBranchCode } from "@/lib/organization";

const HAV_CATEGORIES = [
  "Strong Performer",
  "Candidate",
  "Career Person",
  "Potential Candidate",
  "Unfit Employee",
];

const HAV_COLORS: Record<string, string> = {
  "Strong Performer": "#10b981",
  "Candidate": "#3b82f6",
  "Career Person": "#6366f1",
  "Potential Candidate": "#f59e0b",
  "Unfit Employee": "#ef4444",
};

const DEV_STATUSES = ["Completed", "Ongoing", "Not Started"];

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

function average(values: number[]) {
  if (values.length === 0) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getDistribution(values: (string | undefined)[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function getStaticDistribution(values: (string | undefined)[], categories: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (value && categories.includes(value)) {
      acc[value] = (acc[value] ?? 0) + 1;
    }
    return acc;
  }, {});

  return categories.map((cat) => ({
    label: cat,
    count: counts[cat] ?? 0,
    color: HAV_COLORS[cat] || "var(--accent)"
  }));
}

function SemanticBadge({ category }: { category: string }) {
  const base = "px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider whitespace-nowrap";
  let classes = "bg-slate-50 text-slate-600 border-slate-200";
  
  if (category === "Strong Performer") classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
  else if (category === "Candidate") classes = "bg-blue-50 text-blue-700 border-blue-200";
  else if (category === "Career Person") classes = "bg-indigo-50 text-indigo-700 border-indigo-200";
  else if (category === "Potential Candidate") classes = "bg-amber-50 text-amber-700 border-amber-200";
  else if (category === "Unfit Employee") classes = "bg-red-50 text-red-700 border-red-200";

  return <span className={`${base} ${classes}`}>{category}</span>;
}

export function BranchFoundationView({
  branchCode,
}: {
  branchCode: string;
}) {
  const router = useRouter();
  const employees = usePortalStore((state) => state.employees);
  const branch = getOrganizationByBranchCode(branchCode);

  const branchEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => employee.branchCode.toUpperCase() === branchCode.toUpperCase(),
      ),
    [employees, branchCode],
  );

  const avgKpi = average(
    branchEmployees.map(
      (employee) => employee.kpiFullYear ?? employee.kpiMidYear ?? 0,
    ),
  );
  const avgHav = average(
    branchEmployees.map((employee) => employee.havScore ?? 0),
  );
  
  const devParticipants = branchEmployees.filter(
    (e) => e.developmentProgramStatus && e.developmentProgramStatus !== "Not Started"
  ).length;

  const developmentMix = getStaticDistribution(
    branchEmployees.map((employee) => employee.developmentProgramStatus),
    DEV_STATUSES
  );
  const havMix = getStaticDistribution(
    branchEmployees.map((employee) => employee.havCategory),
    HAV_CATEGORIES
  );
  const positionMix = getDistribution(
    branchEmployees.map((employee) => employee.position),
  );

  const regionId = branch?.region ?? "Unknown Region";
  const areaId = branch?.area ?? "Unknown Area";
  const branchName = branch?.branchName ?? branchCode;
  
  const devConversionRate = branchEmployees.length > 0 
    ? (devParticipants / branchEmployees.length) 
    : 0;

  // Pagination State
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const totalPages = Math.max(1, Math.ceil(branchEmployees.length / pageSize));
  const paginatedEmployees = branchEmployees.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

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
        <span className="font-bold text-foreground bg-[var(--surface)] px-2 py-0.5 rounded-md">{branchName}</span>
      </div>

      <PageHero
        eyebrow={`Operational War Room • ${branchCode}`}
        title={branchName}
        description="High-density localized intelligence for Branch leadership."
      />

      {/* Row 1: Summary Layer */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Branch Headcount" value={branchEmployees.length} />
        <SummaryCard label="Average KPI" value={formatPercent(avgKpi)} />
        <SummaryCard label="Average HAV" value={formatDecimal(avgHav)} />
        <SummaryCard 
          label="Dev Program Conversion" 
          value={formatPercent(devConversionRate)} 
          subValue={`${devParticipants} Participants`} 
        />
      </div>

      {/* Row 2: Insight Layer */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Talent Distribution">
          <div className="space-y-4">
            {havMix.map((item) => (
              <DistributionBar
                key={item.label}
                label={item.label}
                count={item.count}
                total={branchEmployees.length}
                color={item.color}
              />
            ))}
          </div>
        </SectionCard>
        
        <SectionCard title="Position Distribution">
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {positionMix.map(([position, count]) => (
              <DistributionBar
                key={position}
                label={position}
                count={count}
                total={branchEmployees.length}
                color="var(--accent-secondary)"
              />
            ))}
            {positionMix.length === 0 && <p className="text-sm text-[var(--muted)]">No position data.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Development Trajectory">
          <div className="space-y-4">
            {developmentMix.map((item) => (
              <DistributionBar
                key={item.label}
                label={item.label}
                count={item.count}
                total={branchEmployees.length}
                color="var(--accent)"
              />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Row 3: Detail Layer (Workforce Roster) */}
      <Card className="rounded-[30px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-[var(--surface)] border-b border-[var(--border)] py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Workforce Roster</CardTitle>
          <Badge variant="outline" className="font-semibold border-none bg-slate-100">{branchEmployees.length} Personnel</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-[var(--muted)] whitespace-nowrap">NRP</th>
                  <th className="px-6 py-3 font-semibold text-[var(--muted)]">Personnel</th>
                  <th className="px-6 py-3 font-semibold text-[var(--muted)] text-right">HAV Category</th>
                  <th className="px-6 py-3 font-semibold text-[var(--muted)] text-right">KPI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.nrp}
                    className="cursor-pointer transition hover:bg-[var(--surface)] group"
                    onClick={() => router.push(`/employees/${employee.nrp}`)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">{employee.nrp}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground group-hover:text-[var(--accent)] transition-colors">{employee.name}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {employee.havCategory ? (
                        <SemanticBadge category={employee.havCategory} />
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatPercent(employee.kpiFullYear ?? employee.kpiMidYear)}
                    </td>
                  </tr>
                ))}
                {paginatedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[var(--muted)]">
                      No personnel assigned to this branch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {branchEmployees.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] p-5 text-sm text-[var(--muted)] bg-white">
              <div className="flex items-center gap-2">
                <span className="font-medium">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                  }}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-foreground font-medium outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-medium">
                  Page {pageIndex + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pageIndex === 0}
                    className="h-8 font-semibold shadow-sm"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={pageIndex >= totalPages - 1}
                    className="h-8 font-semibold shadow-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[24px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] px-6 py-4 bg-slate-50/30">
        <CardTitle className="text-sm uppercase tracking-wider text-[var(--muted)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, subValue }: { label: string; value: number | string; subValue?: string }) {
  return (
    <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden relative">
      <CardContent className="p-6 relative z-10">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-3">
          {label}
        </div>
        <div className="text-4xl font-black tracking-tight">{value}</div>
        {subValue && <div className="mt-2 text-sm font-medium text-[var(--accent)]">{subValue}</div>}
      </CardContent>
    </Card>
  );
}

function DistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.min(Math.max((count / Math.max(total, 1)) * 100, 0), 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="truncate pr-4 font-medium">{label}</span>
        <span className="font-bold text-foreground">{count} <span className="text-[var(--muted)] font-normal text-xs ml-1">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ backgroundColor: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}
