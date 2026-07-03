"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/shared/page-hero";
import { usePortalStore } from "@/store/portal-store";
import { getOrganizationBranches } from "@/lib/organization";
import { Lightbulb } from "lucide-react";
import { slugifyRegionName, slugifyOrganizationName } from "@/lib/utils/slugify";
import {
  getMainContentClasses,
  getCardHeaderClasses,
  getCardContentClasses,
} from "@/lib/ui/layout-config";

const HAV_CATEGORIES = [
  "Strong Performer",
  "Candidate",
  "Career Person",
  "Potential Candidate",
  "Unfit Employee",
];

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

export function AreaFoundationView({ areaId }: { areaId: string }) {
  const employees = usePortalStore((state) => state.employees);
  const organization = getOrganizationBranches();

  const targetAreaName = useMemo(() => {
    const uniqueAreaNames = Array.from(new Set(organization.map((b) => b.area).filter(Boolean)));
    return uniqueAreaNames.find((name) => slugifyOrganizationName(name) === areaId) || areaId;
  }, [organization, areaId]);

  const areaBranches = useMemo(
    () => organization.filter((branch) => branch.area === targetAreaName),
    [organization, targetAreaName],
  );

  const areaEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        areaBranches.some((branch) => branch.branchCode === employee.branchCode),
      ),
    [employees, areaBranches],
  );

  const branchSummaries = useMemo(() => {
    return areaBranches.map((branch) => {
      const branchEmployees = areaEmployees.filter(
        (employee) => employee.branchCode === branch.branchCode,
      );

      return {
        branch,
        employeeCount: branchEmployees.length,
        avgKpi: average(
          branchEmployees
            .map((employee) => employee.kpiFullYear ?? employee.kpiMidYear)
            .filter((kpi): kpi is number => kpi !== null && kpi !== undefined)
        ),
        avgHav: average(
          branchEmployees
            .map((employee) => employee.havScore)
            .filter((hav): hav is number => hav !== null && hav !== undefined)
        ),
        unfitCount: branchEmployees.filter((e) => e.havCategory === "Unfit Employee").length,
      };
    });
  }, [areaBranches, areaEmployees]);

  const intelligence = useMemo(() => {
    const validBranches = branchSummaries.filter(b => b.employeeCount > 0);
    const lowestKpiBranch = validBranches.length > 0 ? [...validBranches].sort((a,b) => a.avgKpi - b.avgKpi)[0] : null;
    const highestRiskBranch = validBranches.length > 0 ? [...validBranches].sort((a,b) => (b.unfitCount / b.employeeCount) - (a.unfitCount / a.employeeCount))[0] : null;
    const bestBranch = validBranches.length > 0 ? [...validBranches].sort((a,b) => b.avgKpi - a.avgKpi)[0] : null;
    
    return { lowestKpiBranch, highestRiskBranch, bestBranch };
  }, [branchSummaries]);

  const avgKpi = average(
    areaEmployees
      .map((employee) => employee.kpiFullYear ?? employee.kpiMidYear)
      .filter((kpi): kpi is number => kpi !== null && kpi !== undefined)
  );
  const avgHav = average(
    areaEmployees
      .map((employee) => employee.havScore)
      .filter((hav): hav is number => hav !== null && hav !== undefined)
  );
  const havMix = getStaticDistribution(
    areaEmployees.map((employee) => employee.havCategory),
    HAV_CATEGORIES
  );

  const regionId = areaBranches[0]?.region ?? "Unknown Region";

  return (
    <div className={getMainContentClasses("space-y-6")}>
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>›</span>
        {regionId !== "Unknown Region" ? (
          <Link href={`/regions/${slugifyRegionName(regionId)}`} className="hover:text-foreground">{regionId}</Link>
        ) : (
          <span>{regionId}</span>
        )}
        <span>›</span>
        <span className="font-medium text-foreground">{targetAreaName}</span>
      </div>

      <PageHero
        eyebrow="Area Detail"
        title={targetAreaName}
        description={`Area-level workforce analytics for ${targetAreaName}.`}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Employee Count" value={areaEmployees.length} />
        <SummaryCard label="Average KPI" value={formatPercent(avgKpi)} />
        <SummaryCard label="Average HAV" value={formatDecimal(avgHav)} />
        <SummaryCard label="Branch Count" value={areaBranches.length} />
      </div>

      <Card className="rounded-[24px] border border-amber-200 bg-amber-50/50 shadow-sm">
        <CardHeader className={getCardHeaderClasses("pb-2 border-b border-amber-200/50")}>
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <Lightbulb size={18} className="text-amber-600" />
            Area Intelligence Brief
          </CardTitle>
        </CardHeader>
        <CardContent className={getCardContentClasses()}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Lowest KPI Branch</div>
              <div className="font-semibold text-slate-800">{intelligence.lowestKpiBranch?.branch.branchName ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.lowestKpiBranch?.avgKpi ?? null)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Highest Risk Branch</div>
              <div className="font-semibold text-slate-800">{intelligence.highestRiskBranch?.branch.branchName ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.highestRiskBranch ? intelligence.highestRiskBranch.unfitCount / intelligence.highestRiskBranch.employeeCount : null)} Unfit</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Best Performing Branch</div>
              <div className="font-semibold text-slate-800">{intelligence.bestBranch?.branch.branchName ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.bestBranch?.avgKpi ?? null)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Area Snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Region" value={regionId} />
            <MetricCard label="Branches" value={areaBranches.length} />
            <MetricCard label="Avg KPI" value={formatPercent(avgKpi)} />
            <MetricCard label="Avg HAV" value={formatDecimal(avgHav)} />
          </div>
        </SectionCard>
        
        <SectionCard title="HAV Distribution">
          <div className="space-y-4">
            {havMix.map(([category, count]) => (
              <DistributionBar
                key={category}
                label={category}
                count={count}
                total={areaEmployees.length}
                color="var(--accent)"
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Branch Comparison">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {branchSummaries.map(({ branch, employeeCount, avgKpi, avgHav }) => (
            <Link
              key={branch.branchCode}
              href={`/branches/${encodeURIComponent(branch.branchCode)}`}
            >
              <Card className="cursor-pointer rounded-[26px] border-[var(--border)] bg-white/80 transition hover:bg-[var(--surface)]">
                <CardContent className={getCardContentClasses("space-y-3")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{branch.branchName}</p>
                    <Badge>{branch.branchCode}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--muted)]">
                    <p>{employeeCount} employees</p>
                    <p>Avg KPI: {formatPercent(avgKpi)}</p>
                    <p>Avg HAV: {formatDecimal(avgHav)}</p>
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
      <CardHeader className={getCardHeaderClasses()}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={getCardContentClasses()}>{children}</CardContent>
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
