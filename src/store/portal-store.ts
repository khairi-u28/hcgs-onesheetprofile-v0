"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getOrganizationBranches } from "@/lib/organization";
import type {
  ActiveDatasetState,
  DatasetImportMeta,
  EmployeeDirectoryFilters,
  EmployeeRecord,
  OrganizationBranch,
  TrainingHistoryRecord,
  WorkHistoryRecord,
} from "@/types";

type PortalStoreState = {
  hasHydrated: boolean;
  organization: OrganizationBranch[];
  employees: EmployeeRecord[];
  trainingHistory: TrainingHistoryRecord[];
  workHistory: WorkHistoryRecord[];
  dataset: ActiveDatasetState;
  directoryFilters: EmployeeDirectoryFilters;
  replaceEmployees: (
    employees: EmployeeRecord[],
    meta: DatasetImportMeta,
  ) => void;
  replaceTrainingHistory: (
    trainingHistory: TrainingHistoryRecord[],
    meta: DatasetImportMeta,
  ) => void;
  replaceWorkHistory: (
    workHistory: WorkHistoryRecord[],
    meta: DatasetImportMeta,
  ) => void;
  setDirectoryFilters: (filters: Partial<EmployeeDirectoryFilters>) => void;
  resetDirectoryFilters: () => void;
  clearImportedData: () => void;
};

const initialFilters: EmployeeDirectoryFilters = {
  search: "",
  region: null,
  area: null,
  branchCode: null,
  position: null,
  havCategory: null,
  developmentProgramStatus: null,
};

export const usePortalStore = create<PortalStoreState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      organization: getOrganizationBranches(),
      employees: [],
      trainingHistory: [],
      workHistory: [],
      dataset: {
        employeeImport: null,
        trainingImport: null,
      },
      directoryFilters: initialFilters,
      replaceEmployees: (employees, meta) =>
        set({
          employees,
          trainingHistory: [],
          workHistory: [],
          dataset: {
            employeeImport: meta,
            trainingImport: null,
          },
        }),
      replaceTrainingHistory: (trainingHistory, meta) =>
        set((state) => ({
          trainingHistory,
          dataset: {
            employeeImport: state.dataset.employeeImport,
            trainingImport: meta,
          },
        })),
      replaceWorkHistory: (workHistory, meta) =>
        set((state) => ({
          workHistory,
          dataset: {
            employeeImport: state.dataset.employeeImport,
            trainingImport: meta,
          },
        })),
      setDirectoryFilters: (filters) =>
        set((state) => ({
          directoryFilters: {
            ...state.directoryFilters,
            ...filters,
          },
        })),
      resetDirectoryFilters: () => set({ directoryFilters: initialFilters }),
      clearImportedData: () =>
        set({
          employees: [],
          trainingHistory: [],
          dataset: {
            employeeImport: null,
            trainingImport: null,
          },
        }),
    }),
    {
      name: "hcgs-workforce-portal",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        employees: state.employees,
        trainingHistory: state.trainingHistory,
        workHistory: state.workHistory,
        dataset: state.dataset,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    },
  ),
);
