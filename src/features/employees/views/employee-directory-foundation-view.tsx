"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOrganizationByBranchCode } from "@/lib/organization";
import { usePortalStore } from "@/store/portal-store";
import type { EmployeeRecord } from "@/types";

const columnHelper = createColumnHelper<EmployeeRecord>();

const pkScoreMap: Record<string, number> = {
  BS: 5,
  "B+": 4.5,
  B: 4,
  "C+": 3.5,
  C: 3,
  K: 2,
};

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatAverage(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return "EM";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function EmployeeDirectoryFoundationView() {
  const router = useRouter();
  const employees = usePortalStore((state) => state.employees);
  const organization = usePortalStore((state) => state.organization);
  const filters = usePortalStore((state) => state.directoryFilters);
  const setDirectoryFilters = usePortalStore(
    (state) => state.setDirectoryFilters,
  );
  const resetDirectoryFilters = usePortalStore(
    (state) => state.resetDirectoryFilters,
  );

  const regionOptions = useMemo(
    () => [...new Set(organization.map((branch) => branch.region))].sort(),
    [organization],
  );

  const areaOptions = useMemo(() => {
    if (!filters.region) {
      return [];
    }

    return [
      ...new Set(
        organization
          .filter((branch) => branch.region === filters.region)
          .map((branch) => branch.area),
      ),
    ].sort();
  }, [filters.region, organization]);

  const branchOptions = useMemo(() => {
    if (!filters.region || !filters.area) {
      return [];
    }

    return organization
      .filter(
        (branch) =>
          branch.region === filters.region && branch.area === filters.area,
      )
      .sort((a, b) => a.branchCode.localeCompare(b.branchCode));
  }, [filters.area, filters.region, organization]);

  const positionOptions = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.position))].filter(Boolean),
    [employees],
  );

  const havOptions = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.havCategory))].filter(
        Boolean,
      ),
    [employees],
  );

  const developmentStatusOptions = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.developmentProgramStatus))]
        .filter(Boolean)
        .sort(),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return employees.filter((employee) => {
      const branch = getOrganizationByBranchCode(employee.branchCode);
      const matchesSearch =
        !searchTerm ||
        [employee.nrp, employee.name, employee.position]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);

      const matchesRegion = !filters.region || branch?.region === filters.region;
      const matchesArea = !filters.area || branch?.area === filters.area;
      const matchesBranch =
        !filters.branchCode || employee.branchCode === filters.branchCode;
      const matchesPosition =
        !filters.position || employee.position === filters.position;
      const matchesHav =
        !filters.havCategory || employee.havCategory === filters.havCategory;
      const matchesDevelopmentStatus =
        !filters.developmentProgramStatus ||
        employee.developmentProgramStatus === filters.developmentProgramStatus;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesArea &&
        matchesBranch &&
        matchesPosition &&
        matchesHav &&
        matchesDevelopmentStatus
      );
    });
  }, [employees, filters]);

  const averageKpi = useMemo(() => {
    if (filteredEmployees.length === 0) {
      return 0;
    }

    const total = filteredEmployees.reduce(
      (sum, employee) => sum + (employee.kpiFullYear ?? employee.kpiMidYear ?? 0),
      0,
    );

    return total / filteredEmployees.length;
  }, [filteredEmployees]);

  const averagePk = useMemo(() => {
    if (filteredEmployees.length === 0) {
      return 0;
    }

    const total = filteredEmployees.reduce((sum, employee) => {
      const score = employee.pk2025 ? pkScoreMap[employee.pk2025] ?? 0 : 0;
      return sum + score;
    }, 0);

    return total / filteredEmployees.length;
  }, [filteredEmployees]);

  const developmentParticipants = useMemo(
    () =>
      filteredEmployees.filter(
        (employee) =>
          employee.developmentProgramStatus &&
          employee.developmentProgramStatus !== "Not Started",
      ).length,
    [filteredEmployees],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.photoUrl, {
        id: "photo",
        header: "Photo",
        cell: ({ row }) => {
          const employee = row.original;
          const avatarUrl = employee.photoUrl?.trim();

          return (
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--accent-strong)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={employee.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(employee.name)
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("nrp", {
        header: "NRP",
        cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
      }),
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("position", {
        header: "Position",
      }),
      columnHelper.accessor((row) => row.branchCode, {
        id: "branch",
        header: "Branch",
        cell: ({ row }) => {
          const branch = getOrganizationByBranchCode(row.original.branchCode);
          return branch ? `${branch.branchCode} · ${branch.branchName}` : row.original.branchCode;
        },
      }),
      columnHelper.accessor("havRaw", {
        header: "HAV",
      }),
      columnHelper.accessor((row) => row.kpiFullYear ?? row.kpiMidYear, {
        id: "kpi",
        header: "KPI",
        cell: ({ getValue }) => formatPercent(getValue() ?? null),
      }),
      columnHelper.accessor("pk2025", {
        header: "PK 2025",
        cell: ({ getValue }) => getValue() ?? "--",
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredEmployees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  useEffect(() => {
    table.resetPageIndex();
  }, [filters, table]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Employee Directory"
        title="Search, filter, and review workforce records"
        description="Use the search bar and hierarchy controls to narrow the employee list before reviewing summaries and records."
      />

      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-[28px] border border-[var(--border)] bg-white/80 p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={filters.search}
              onChange={(event) =>
                setDirectoryFilters({ search: event.target.value })
              }
              placeholder="Search by NRP, name, or position"
              className="pl-11"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => resetDirectoryFilters()}
            className="w-full md:w-auto"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Region
            </p>
            <select
              value={filters.region ?? ""}
              onChange={(event) =>
                setDirectoryFilters({
                  region: event.target.value || null,
                  area: null,
                  branchCode: null,
                })
              }
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm"
            >
              <option value="">All Regions</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Area
            </p>
            <select
              value={filters.area ?? ""}
              onChange={(event) =>
                setDirectoryFilters({
                  area: event.target.value || null,
                  branchCode: null,
                })
              }
              disabled={!filters.region}
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Areas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Branch
            </p>
            <select
              value={filters.branchCode ?? ""}
              onChange={(event) =>
                setDirectoryFilters({ branchCode: event.target.value || null })
              }
              disabled={!filters.region || !filters.area}
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.branchCode} value={branch.branchCode}>
                  {branch.branchCode} · {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Position
            </p>
            <select
              value={filters.position ?? ""}
              onChange={(event) =>
                setDirectoryFilters({ position: event.target.value || null })
              }
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm"
            >
              <option value="">All Positions</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              HAV Category
            </p>
            <select
              value={filters.havCategory ?? ""}
              onChange={(event) =>
                setDirectoryFilters({ havCategory: event.target.value || null })
              }
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm"
            >
              <option value="">All HAV</option>
              {havOptions.map((hav) => (
                <option key={hav} value={hav}>
                  {hav}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Development Status
            </p>
            <select
              value={filters.developmentProgramStatus ?? ""}
              onChange={(event) =>
                setDirectoryFilters({
                  developmentProgramStatus: event.target.value || null,
                })
              }
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm"
            >
              <option value="">All Statuses</option>
              {developmentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
          <span className="font-semibold text-[var(--muted)]">Filters</span>
          <span className="text-[var(--muted)]">›</span>
          <span className="font-semibold">{filters.region ?? "All Regions"}</span>
          {filters.area ? (
            <>
              <span className="text-[var(--muted)]">›</span>
              <span className="font-semibold">{filters.area}</span>
            </>
          ) : null}
          {filters.branchCode ? (
            <>
              <span className="text-[var(--muted)]">›</span>
              <span className="font-semibold">{filters.branchCode}</span>
            </>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Employee Count" value={filteredEmployees.length} />
          <SummaryCard label="Average KPI" value={formatPercent(averageKpi)} />
          <SummaryCard
            label="Average PK"
            value={formatAverage(averagePk)}
          />
          <SummaryCard
            label="Development Participants"
            value={developmentParticipants}
          />
        </div>

        <Card className="rounded-[30px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Employee Directory</CardTitle>
              <Badge>{filteredEmployees.length} results</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[24px] border border-[var(--border)]">
              <div className="max-h-[640px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#f8f6f0]">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="whitespace-nowrap border-b border-[var(--border)] px-4 py-3 font-semibold"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/employees/${row.original.nrp}`)}
                        className="cursor-pointer transition hover:bg-[var(--surface)]"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="border-b border-[var(--border)] px-4 py-3 align-middle"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] p-5 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                {[25, 50, 100].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
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
