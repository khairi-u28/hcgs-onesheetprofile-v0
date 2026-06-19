"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";

import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOrganizationBranches } from "@/lib/organization";
import { usePortalStore } from "@/store/portal-store";

type AreaSummary = {
  areaName: string;
  parentRegion: string;
  totalHeadcount: number;
  avgKpi: number;
  avgHav: number;
  totalBranches: number;
};

const columnHelper = createColumnHelper<AreaSummary>();

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export function AreasDirectoryView() {
  const router = useRouter();
  const employees = usePortalStore((state) => state.employees);
  const organization = getOrganizationBranches();

  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "areaName", desc: false }]);

  const areaData = useMemo(() => {
    const map = new Map<string, { region: string; branches: Set<string>; count: number; sumKpi: number; countKpi: number; sumHav: number; countHav: number }>();

    for (const org of organization) {
      if (!map.has(org.area)) {
        map.set(org.area, { region: org.region, branches: new Set(), count: 0, sumKpi: 0, countKpi: 0, sumHav: 0, countHav: 0 });
      }
      map.get(org.area)!.branches.add(org.branchCode);
    }

    for (const emp of employees) {
      const branchInfo = organization.find(b => b.branchCode.toUpperCase() === emp.branchCode.toUpperCase());
      const area = branchInfo?.area || "Unknown Area";
      
      if (!map.has(area)) {
         map.set(area, { region: branchInfo?.region || "Unknown Region", branches: new Set(), count: 0, sumKpi: 0, countKpi: 0, sumHav: 0, countHav: 0 });
      }

      const stats = map.get(area)!;
      stats.count++;
      
      const kpi = emp.kpiFullYear ?? emp.kpiMidYear;
      if (kpi !== undefined && kpi !== null) {
        stats.sumKpi += kpi;
        stats.countKpi++;
      }
      if (emp.havScore !== undefined && emp.havScore !== null) {
        stats.sumHav += emp.havScore;
        stats.countHav++;
      }
    }

    return Array.from(map.entries()).map(([areaName, stats]) => ({
      areaName,
      parentRegion: stats.region,
      totalHeadcount: stats.count,
      avgKpi: stats.countKpi > 0 ? stats.sumKpi / stats.countKpi : NaN,
      avgHav: stats.countHav > 0 ? stats.sumHav / stats.countHav : NaN,
      totalBranches: stats.branches.size,
    })).filter(a => a.areaName.toLowerCase().includes(search.toLowerCase()) || a.parentRegion.toLowerCase().includes(search.toLowerCase()));
  }, [employees, organization, search]);

  const columns = useMemo(() => [
    columnHelper.accessor("areaName", {
      header: "Area Name",
      cell: (info) => <div className="font-bold text-foreground">{info.getValue()}</div>,
    }),
    columnHelper.accessor("parentRegion", {
      header: "Region",
      cell: (info) => <div className="text-[var(--muted)]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("totalBranches", {
      header: "Total Branches",
      cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("totalHeadcount", {
      header: "Total Headcount",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("avgKpi", {
      header: "Avg KPI",
      cell: (info) => <div className="font-medium text-emerald-700">{formatPercent(info.getValue())}</div>,
    }),
    columnHelper.accessor("avgHav", {
      header: "Avg HAV",
      cell: (info) => <div className="font-medium text-indigo-700">{formatDecimal(info.getValue())}</div>,
    }),
  ], []);

  const table = useReactTable({
    data: areaData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHero
        eyebrow="Organization Directory"
        title="Areas"
        description="Directory of all operational areas."
      />

      <Card className="rounded-[24px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Areas Directory</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <Input
                placeholder="Search areas or regions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-[var(--border)]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-[var(--border)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-3 font-semibold text-[var(--muted)] cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-[var(--surface)] transition-colors group"
                    onClick={() => router.push(`/areas/${encodeURIComponent(row.original.areaName)}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {areaData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-12 text-center text-[var(--muted)]">
                      No areas found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
