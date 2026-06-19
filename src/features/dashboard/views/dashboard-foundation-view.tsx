"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/shared/page-hero";
import { usePortalStore } from "@/store/portal-store";
import { getOrganizationBranches } from "@/lib/organization";
import { Users, AlertTriangle, Target, TrendingUp, ChevronRight, Lightbulb } from "lucide-react";

const HAV_CATEGORIES = [
  "Strong Performer",
  "Candidate",
  "Career Person",
  "Potential Candidate",
  "Unfit Employee",
];

const HAV_COLORS: Record<string, string> = {
  "Strong Performer": "#10b981", // emerald-500
  "Candidate": "#3b82f6", // blue-500
  "Career Person": "#6366f1", // indigo-500
  "Potential Candidate": "#f59e0b", // amber-500
  "Unfit Employee": "#ef4444", // red-500
};

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

function getStaticDistribution(values: (string | undefined)[], categories: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (value && categories.includes(value)) {
      acc[value] = (acc[value] ?? 0) + 1;
    }
    return acc;
  }, {});

  return categories.map((cat) => ({ label: cat, count: counts[cat] ?? 0, color: HAV_COLORS[cat] || "#94a3b8" }));
}

export function DashboardFoundationView() {
  const employees = usePortalStore((state) => state.employees);
  const organization = getOrganizationBranches();

  const branchMap = useMemo(() => {
    const map = new Map<string, typeof organization[0]>();
    organization.forEach((b) => map.set(b.branchCode.toUpperCase(), b));
    return map;
  }, [organization]);

  const {
    nationalKpi,
    nationalHav,
    unfitCount,
    havMix,
    branchSummaries,
    regionSummaries,
    intelligence,
  } = useMemo(() => {
    let sumKpi = 0;
    let countKpi = 0;
    let sumHav = 0;
    let countHav = 0;
    let unfitCount = 0;

    const branchAggMap = new Map<string, { count: number; sumKpi: number; countKpi: number }>();
    const regionAggMap = new Map<string, { count: number; sumKpi: number; countKpi: number; sumHav: number; countHav: number; unfitCount: number; devBacklogCount: number; strongCount: number }>();

    for (const emp of employees) {
      const kpi = emp.kpiFullYear ?? emp.kpiMidYear;
      if (kpi !== undefined && kpi !== null) {
        sumKpi += kpi;
        countKpi++;
      }
      
      if (emp.havScore !== undefined && emp.havScore !== null) {
        sumHav += emp.havScore;
        countHav++;
      }

      if (emp.havCategory === "Unfit Employee") unfitCount++;

      const code = emp.branchCode.toUpperCase();
      if (!branchAggMap.has(code)) branchAggMap.set(code, { count: 0, sumKpi: 0, countKpi: 0 });
      const bStats = branchAggMap.get(code)!;
      bStats.count++;
      if (kpi !== undefined && kpi !== null) {
        bStats.sumKpi += kpi;
        bStats.countKpi++;
      }

      const branchInfo = branchMap.get(code);
      const regionId = branchInfo?.region ?? "Unknown Region";
      if (!regionAggMap.has(regionId)) {
        regionAggMap.set(regionId, { count: 0, sumKpi: 0, countKpi: 0, sumHav: 0, countHav: 0, unfitCount: 0, devBacklogCount: 0, strongCount: 0 });
      }
      const rStats = regionAggMap.get(regionId)!;
      rStats.count++;
      if (kpi !== undefined && kpi !== null) {
        rStats.sumKpi += kpi;
        rStats.countKpi++;
      }
      if (emp.havScore !== undefined && emp.havScore !== null) {
        rStats.sumHav += emp.havScore;
        rStats.countHav++;
      }
      if (emp.havCategory === "Unfit Employee") rStats.unfitCount++;
      if (emp.havCategory === "Strong Performer") rStats.strongCount++;
      if (emp.developmentProgramStatus === "Not Started") rStats.devBacklogCount++;
    }

    const branchSummariesList = Array.from(branchAggMap.entries()).map(([code, stats]) => ({
      branchCode: code,
      branchName: branchMap.get(code)?.branchName ?? code,
      employeeCount: stats.count,
      avgKpi: stats.countKpi > 0 ? stats.sumKpi / stats.countKpi : NaN,
    }));

    const regionSummariesList = Array.from(regionAggMap.entries()).map(([regionId, stats]) => ({
      regionId,
      employeeCount: stats.count,
      avgKpi: stats.countKpi > 0 ? stats.sumKpi / stats.countKpi : NaN,
      avgHav: stats.countHav > 0 ? stats.sumHav / stats.countHav : NaN,
      unfitRatio: stats.count > 0 ? stats.unfitCount / stats.count : 0,
      devBacklogCount: stats.devBacklogCount,
      talentDensity: stats.count > 0 ? stats.strongCount / stats.count : 0,
    })).sort((a, b) => b.employeeCount - a.employeeCount);

    const validRegions = regionSummariesList.filter(r => r.regionId !== "Unknown Region" && r.employeeCount > 0);
    const lowestKpiRegion = validRegions.length > 0 ? [...validRegions].sort((a, b) => a.avgKpi - b.avgKpi)[0] : null;
    const highestDevBacklogRegion = validRegions.length > 0 ? [...validRegions].sort((a, b) => b.devBacklogCount - a.devBacklogCount)[0] : null;
    const highestUnfitRegion = validRegions.length > 0 ? [...validRegions].sort((a, b) => b.unfitRatio - a.unfitRatio)[0] : null;
    const highestTalentRegion = validRegions.length > 0 ? [...validRegions].sort((a, b) => b.talentDensity - a.talentDensity)[0] : null;

    return {
      nationalKpi: countKpi > 0 ? sumKpi / countKpi : NaN,
      nationalHav: countHav > 0 ? sumHav / countHav : NaN,
      unfitCount,
      havMix: getStaticDistribution(employees.map((e) => e.havCategory), HAV_CATEGORIES),
      branchSummaries: branchSummariesList,
      regionSummaries: regionSummariesList,
      intelligence: {
        lowestKpiRegion,
        highestDevBacklogRegion,
        highestUnfitRegion,
        highestTalentRegion,
      }
    };
  }, [employees, branchMap]);

  const bottomBranches = useMemo(() => {
    return [...branchSummaries]
      .filter((b) => !Number.isNaN(b.avgKpi))
      .sort((a, b) => a.avgKpi - b.avgKpi)
      .slice(0, 5);
  }, [branchSummaries]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <PageHero
          eyebrow="Workforce Intelligence"
          title="National Command Center"
          description="High-density analytics overview of workforce health, talent pipeline, and critical risks."
        />
      </div>

      {/* Row 1: Summary Layer (Executive Pulse) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute right-[-20px] top-[20px] text-blue-50/50">
            <Users size={120} strokeWidth={1} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wider">
              <Users size={16} /> Total Headcount
            </div>
            <div className="text-4xl font-black tracking-tight">{employees.length.toLocaleString()}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">Active Personnel</div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden relative">
          <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-2 uppercase tracking-wider">
                <Target size={16} /> National KPI
              </div>
              <div className="text-4xl font-black tracking-tight">{formatPercent(nationalKpi)}</div>
            </div>
            <div className="mt-4">
              <ProgressBar value={Number.isNaN(nationalKpi) ? 0 : nationalKpi} color="#10b981" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden relative">
          <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
                <TrendingUp size={16} /> National HAV
              </div>
              <div className="text-4xl font-black tracking-tight">{formatDecimal(nationalHav)} <span className="text-lg text-[var(--muted)] font-medium">/ 5.0</span></div>
            </div>
            <div className="mt-4">
              <ProgressBar value={Number.isNaN(nationalHav) ? 0 : nationalHav / 5.0} color="#6366f1" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-red-200 shadow-sm bg-red-50/50 overflow-hidden relative">
          <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-2 uppercase tracking-wider">
                <AlertTriangle size={16} /> Critical Risk Index
              </div>
              <div className="text-4xl font-black tracking-tight text-red-700">{unfitCount}</div>
            </div>
            <div className="mt-2 text-sm font-medium text-red-600/80">
              Unfit Employees flagged
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Brief */}
      <Card className="rounded-[24px] border border-amber-200 bg-amber-50/50 shadow-sm">
        <CardHeader className="pb-2 border-b border-amber-200/50 px-6 py-4">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <Lightbulb size={18} className="text-amber-600" />
            Intelligence Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Lowest KPI Region</div>
              <div className="font-semibold text-slate-800">{intelligence.lowestKpiRegion?.regionId ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.lowestKpiRegion?.avgKpi ?? null)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Highest Dev Backlog</div>
              <div className="font-semibold text-slate-800">{intelligence.highestDevBacklogRegion?.regionId ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{intelligence.highestDevBacklogRegion?.devBacklogCount ?? 0} employees</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Highest Unfit Concentration</div>
              <div className="font-semibold text-slate-800">{intelligence.highestUnfitRegion?.regionId ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.highestUnfitRegion?.unfitRatio ?? null)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-amber-700/70 tracking-wider">Highest Talent Density</div>
              <div className="font-semibold text-slate-800">{intelligence.highestTalentRegion?.regionId ?? "--"}</div>
              <div className="text-xs text-[var(--muted)]">{formatPercent(intelligence.highestTalentRegion?.talentDensity ?? null)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Visualization & Insight Layer */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Card className="rounded-[24px] border border-[var(--border)] shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-[var(--border)] px-6 py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              Intervention Radar (Bottom 5 Branches)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {bottomBranches.map((branch, i) => (
                <Link
                  key={branch.branchCode}
                  href={`/branches/${encodeURIComponent(branch.branchCode)}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--surface)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface)] text-xs font-bold text-[var(--muted)]">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm group-hover:underline">{branch.branchName}</div>
                      <div className="text-xs text-[var(--muted)]">{branch.employeeCount} personnel</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                      {formatPercent(branch.avgKpi)}
                    </Badge>
                    <ChevronRight size={16} className="text-[var(--muted)]" />
                  </div>
                </Link>
              ))}
              {bottomBranches.length === 0 && (
                <div className="p-8 text-center text-[var(--muted)] text-sm">No branch data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-[var(--border)] shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-[var(--border)] px-6 py-4">
            <CardTitle className="text-base">National Talent Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <StackedBar items={havMix} total={employees.length} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {havMix.map((item) => (
                <div key={item.label} className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-[var(--muted)] uppercase truncate">{item.label}</span>
                  </div>
                  <div className="text-xl font-bold">{item.count}</div>
                  <div className="text-xs text-[var(--muted)]">{((item.count / Math.max(employees.length, 1)) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Detail Layer (Territory Heatmap) */}
      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight">Territory Heatmap (Region Comparison)</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {regionSummaries.map((region) => (
            <Link
              key={region.regionId}
              href={`/regions/${encodeURIComponent(region.regionId)}`}
            >
              <Card className="cursor-pointer rounded-[20px] border-[var(--border)] bg-white transition-all hover:border-[var(--accent)] hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-base truncate pr-2">{region.regionId}</p>
                    <Badge variant="outline" className="font-semibold">{region.employeeCount} HC</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-[var(--muted)]">KPI Avg</span>
                        <span className="text-emerald-700">{formatPercent(region.avgKpi)}</span>
                      </div>
                      <ProgressBar value={Number.isNaN(region.avgKpi) ? 0 : region.avgKpi} color="#10b981" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-[var(--muted)]">HAV Avg</span>
                        <span className="text-indigo-700">{formatDecimal(region.avgHav)}/5.0</span>
                      </div>
                      <ProgressBar value={Number.isNaN(region.avgHav) ? 0 : region.avgHav / 5.0} color="#6366f1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {regionSummaries.length === 0 && (
            <div className="col-span-full p-8 text-center text-[var(--muted)] border border-dashed rounded-[20px]">
              No regions mapped.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function StackedBar({ items, total }: { items: { label: string; count: number; color: string }[], total: number }) {
  if (total === 0) {
    return <div className="h-4 w-full rounded-full bg-[var(--border)]" />;
  }
  return (
    <div className="flex h-4 w-full rounded-full overflow-hidden border border-[var(--border)]">
      {items.map(item => {
        if (item.count === 0) return null;
        return (
          <div
            key={item.label}
            className="h-full transition-all duration-500 hover:opacity-80"
            style={{ width: `${(item.count / total) * 100}%`, backgroundColor: item.color }}
            title={`${item.label}: ${item.count} (${((item.count / total) * 100).toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}
