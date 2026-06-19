"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/shared/page-hero";
import { usePortalStore } from "@/store/portal-store";
import { getOrganizationBranches } from "@/lib/organization";

const pkScoreMap: Record<string, number> = {
  BS: 5,
  "B+": 4.5,
  B: 4,
  "C+": 3.5,
  C: 3,
  K: 2,
};

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

  const areaBranches = useMemo(
    () => organization.filter((branch) => branch.area === areaId),
    [organization, areaId],
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
          branchEmployees.map(
            (employee) => employee.kpiFullYear ?? employee.kpiMidYear ?? 0,
          ),
        ),
        avgHav: average(
          branchEmployees.map((employee) => employee.havScore ?? 0),
        ),
      };
    });
  }, [areaBranches, areaEmployees]);

  const avgKpi = average(
    areaEmployees.map(
      (employee) => employee.kpiFullYear ?? employee.kpiMidYear ?? 0,
    ),
  );
  const avgHav = average(
    areaEmployees.map((employee) => employee.havScore ?? 0),
  );
  const havMix = getStaticDistribution(
    areaEmployees.map((employee) => employee.havCategory),
    HAV_CATEGORIES
  );

  const regionId = areaBranches[0]?.region ?? "Unknown Region";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>›</span>
        {regionId !== "Unknown Region" ? (
          <Link href={`/regions/${encodeURIComponent(regionId)}`} className="hover:text-foreground">{regionId}</Link>
        ) : (
          <span>{regionId}</span>
        )}
        <span>›</span>
        <span className="font-medium text-foreground">{areaId}</span>
      </div>

      <PageHero
        eyebrow="Area Detail"
        title={areaId}
        description={`Area-level workforce analytics for ${areaId}.`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Employee Count" value={areaEmployees.length} />
        <SummaryCard label="Average KPI" value={formatPercent(avgKpi)} />
        <SummaryCard label="Average HAV" value={formatDecimal(avgHav)} />
        <SummaryCard label="Branch Count" value={areaBranches.length} />
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branchSummaries.map(({ branch, employeeCount, avgKpi, avgHav }) => (
            <Link
              key={branch.branchCode}
              href={`/branches/${encodeURIComponent(branch.branchCode)}`}
            >
              <Card className="cursor-pointer rounded-[26px] border-[var(--border)] bg-white/80 transition hover:bg-[var(--surface)]">
                <CardContent className="space-y-3 p-5">
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
