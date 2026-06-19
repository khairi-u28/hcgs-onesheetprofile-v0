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
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";

import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOrganizationBranches } from "@/lib/organization";
import { usePortalStore } from "@/store/portal-store";

type BranchSummary = {
  branchName: string;
  branchCode: string;
  parentArea: string;
  parentRegion: string;
  totalHeadcount: number;
  avgKpi: number;
  avgHav: number;
};

const columnHelper = createColumnHelper<BranchSummary>();

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export function BranchesDirectoryView() {
  const router = useRouter();
  const employees = usePortalStore((state) => state.employees);
  const organization = getOrganizationBranches();

  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "branchName", desc: false }]);

  const branchData = useMemo(() => {
    const map = new Map<string, { name: string; area: string; region: string; count: number; sumKpi: number; countKpi: number; sumHav: number; countHav: number }>();

    for (const org of organization) {
      if (!map.has(org.branchCode)) {
        map.set(org.branchCode, { name: org.branchName, area: org.area, region: org.region, count: 0, sumKpi: 0, countKpi: 0, sumHav: 0, countHav: 0 });
      }
    }

    for (const emp of employees) {
      const code = emp.branchCode.toUpperCase();
      
      if (!map.has(code)) {
         map.set(code, { name: code, area: "Unknown Area", region: "Unknown Region", count: 0, sumKpi: 0, countKpi: 0, sumHav: 0, countHav: 0 });
      }

      const stats = map.get(code)!;
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

    return Array.from(map.entries()).map(([branchCode, stats]) => ({
      branchCode,
      branchName: stats.name,
      parentArea: stats.area,
      parentRegion: stats.region,
      totalHeadcount: stats.count,
      avgKpi: stats.countKpi > 0 ? stats.sumKpi / stats.countKpi : NaN,
      avgHav: stats.countHav > 0 ? stats.sumHav / stats.countHav : NaN,
    })).filter(b => 
      b.branchName.toLowerCase().includes(search.toLowerCase()) || 
      b.branchCode.toLowerCase().includes(search.toLowerCase()) ||
      b.parentArea.toLowerCase().includes(search.toLowerCase()) ||
      b.parentRegion.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, organization, search]);

  const columns = useMemo(() => [
    columnHelper.accessor("branchName", {
      header: "Branch Name",
      cell: (info) => <div className="font-bold text-foreground">{info.getValue()}</div>,
    }),
    columnHelper.accessor("branchCode", {
      header: "Code",
      cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("parentArea", {
      header: "Area",
      cell: (info) => <div className="text-[var(--muted)]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("parentRegion", {
      header: "Region",
      cell: (info) => <div className="text-[var(--muted)]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("totalHeadcount", {
      header: "Headcount",
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
    data: branchData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHero
        eyebrow="Organization Directory"
        title="Branches"
        description="Directory of all operational branches."
      />

      <Card className="rounded-[24px] border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Branches Directory</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <Input
                placeholder="Search branches..."
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
                    onClick={() => router.push(`/branches/${encodeURIComponent(row.original.branchCode)}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {branchData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-12 text-center text-[var(--muted)]">
                      No branches found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {branchData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] p-5 text-sm text-[var(--muted)] bg-white">
              <div className="flex items-center gap-2">
                <span className="font-medium">Rows per page:</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
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
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 font-semibold shadow-sm"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
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
