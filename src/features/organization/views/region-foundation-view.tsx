"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/shared/page-hero";
import { usePortalStore } from "@/store/portal-store";
import { getOrganizationBranches } from "@/lib/organization";
import { Lightbulb } from "lucide-react";

const pkScoreMap: Record<string, number> = {
  BS: 5,
  "B+": 4.5,
  B: 4,
  "C+": 3.5,
  C: 3,
  K: 2,
};

const DEV_STATUSES = ["Completed", "Ongoing", "Not Started"];

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return value.toFixed(1);
}

function average(values: number[]) {
  if (values.length === 0) {
    return NaN;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStaticDistribution(values: (string | undefined)[], categories: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (value && categories.includes(value)) {
      acc[value] = (acc[value] ?? 0) + 1;
    }
    return acc;
  }, {});

  return categories.map((cat) => [cat, counts[cat] ?? 0] as const);
}

export function RegionFoundationView({ regionId }: { regionId: string }) {
  const employees = usePortalStore((state) => state.employees);
  const organization = getOrganizationBranches();

  const regionBranches = useMemo(
    () => organization.filter((branch) => branch.region === regionId),
    [organization, regionId],
  );

  const regionEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        regionBranches.some((branch) => branch.branchCode === employee.branchCode),
      ),
    [employees, regionBranches],
  );

  const areaSummaries = useMemo(() => {
    const areaMap = new Map<string, { area: string; branches: typeof regionBranches; employees: typeof regionEmployees }>();

    for (const branch of regionBranches) {
      if (!areaMap.has(branch.area)) {
        areaMap.set(branch.area, {
          area: branch.area,
          branches: [],
          employees: [],
        });
      }

      const summary = areaMap.get(branch.area)!;
      summary.branches.push(branch);
      summary.employees.push(
        ...regionEmployees.filter(
          (employee) => employee.branchCode === branch.branchCode,
        ),
      );
    }

    return Array.from(areaMap.values()).map((summary) => ({
      ...summary,
      employeeCount: summary.employees.length,
      avgKpi: average(
        summary.employees.map(
          (employee) => employee.kpiFullYear ?? employee.kpiMidYear ?? 0,
        ),
      ),
      avgHav: average(
        summary.employees.map((employee) => employee.havScore ?? 0),
      ),
      developmentMix: getStaticDistribution(
        summary.employees.map((employee) => employee.developmentProgramStatus),
        DEV_STATUSES
      ),
      unfitCount: summary.employees.filter((e) => e.havCategory === "Unfit Employee").length,
    }));
  }, [regionBranches, regionEmployees]);

  const intelligence = useMemo(() => {
    const validAreas = areaSummaries.filter(a => a.employeeCount > 0);
    const lowestKpiArea = validAreas.length > 0 ? [...validAreas].sort((a,b) => a.avgKpi - b.avgKpi)[0] : null;
    const highestRiskArea = validAreas.length > 0 ? [...validAreas].sort((a,b) => (b.unfitCount / b.employeeCount) - (a.unfitCount / a.employeeCount))[0] : null;
    const bestArea = validAreas.length > 0 ? [...validAreas].sort((a,b) => b.avgKpi - a.avgKpi)[0] : null;
    
    return { lowestKpiArea, highestRiskArea, bestArea };
  }, [areaSummaries]);

  const employeeCount = regionEmployees.length;
  const averageKpi = average(
    regionEmployees.map(
      (employee) => employee.kpiFullYear ?? employee.kpiMidYear ?? 0,
    ),
  );
  const averageHav = average(
    regionEmployees.map((employee) => employee.havScore ?? 0),
  );
  const areaCount = areaSummaries.length;
  const branchCount = regionBranches.length;
  const developmentMix = getStaticDistribution(
    regionEmployees.map((employee) => employee.developmentProgramStatus),
    DEV_STATUSES
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>›</span>
        <span className="font-medium text-foreground">{regionId}</span>
      </div>

      <PageHero
        eyebrow="Region Detail"
        title={regionId}
        description={`Region-level workforce overview and area comparison for ${regionId}.`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Employee Count" value={employeeCount} />
        <SummaryCard label="Average KPI" value={formatPercent(averageKpi)} />
        <SummaryCard label="Average HAV" value={formatDecimal(averageHav)} />
        <SummaryCard label="Area Count" value={areaCount} />
      </div>

      <Card className="rounded-[24px] border border-amber-200 bg-amber-50/50 shadow-sm">
        <CardHeader className="pb-2 border-b border-amber-200/50 px-6 py-4">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <Lightbulb size={18} className="text-amber-600" />
            Region Intelligence Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Lowest KPI Area</div>
              <div className="font-semibold text-slate-800">{intelligence.lowestKpiArea?.area ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.lowestKpiArea?.avgKpi ?? null)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Highest Risk Area</div>
              <div className="font-semibold text-slate-800">{intelligence.highestRiskArea?.area ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.highestRiskArea ? intelligence.highestRiskArea.unfitCount / intelligence.highestRiskArea.employeeCount : null)} Unfit</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Best Performing Area</div>
              <div className="font-semibold text-slate-800">{intelligence.bestArea?.area ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.bestArea?.avgKpi ?? null)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Region Snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Areas" value={areaCount} />
            <MetricCard label="Branches" value={branchCount} />
            <MetricCard label="Avg KPI" value={formatPercent(averageKpi)} />
            <MetricCard label="Avg HAV" value={formatDecimal(averageHav)} />
          </div>
        </SectionCard>
        <SectionCard title="Development Program Analytics">
          <div className="space-y-4">
            {developmentMix.map(([status, count]) => (
              <DistributionBar
                key={status}
                label={status}
                count={count}
                total={employeeCount}
                color="var(--accent)"
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Area Comparison">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areaSummaries.map((summary) => (
            <Link
              key={summary.area}
              href={`/areas/${encodeURIComponent(summary.area)}`}
            >
              <Card className="cursor-pointer rounded-[26px] border-[var(--border)] bg-white/80 transition hover:bg-[var(--surface)]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{summary.area}</p>
                    <Badge>{summary.branches.length} branches</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted)]">
                    <p>{summary.employeeCount} employees</p>
                    <p>Avg KPI: {formatPercent(summary.avgKpi)}</p>
                    <p>Avg HAV: {formatDecimal(summary.avgHav)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[30px] border-[var(--border)] bg-white/90">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-white/80 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="truncate pr-4">{label}</span>
        <span className="font-semibold">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)]">
        <div
          className="h-2 rounded-full"
          style={{
            backgroundColor: color,
            width: `${(count / Math.max(total, 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
