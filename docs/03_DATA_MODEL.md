# DATA_MODEL.md

# HCGS Workforce Intelligence Portal

## Core Philosophy

The application is a Workforce Intelligence Platform.

Employees are the center of the data model.

All analytics, drilldowns, and profiles originate from Employee records.

---

# Entity Relationship Overview

Employee
├── TrainingHistory[]
└── WorkHistory[]

Organization
└── Employee[]

---

# Organization Hierarchy

Region
↓
Area
↓
Branch
↓
Employee

---

# Organization Entity

```ts
interface OrganizationBranch {
  branchCode: string;
  branchName: string;

  areaName: string;
  regionName: string;
}
```

---

# Employee Entity

```ts
interface EmployeeRecord {
  nrp: string;

  nama: string;

  position: string;

  pos: string;

  regionDiv: string;

  areaDept: string;

  branchCode: string;

  entryDate: string;

  masaKerjaTotal: string;

  masaKerjaJabatan: string;

  masaKerjaCabang: string;

  dateOfBirth: string;

  age: string;

  hav: string;

  lastDevProgram: string;

  statusDevProgram: string;

  periodeDevProgram: string;

  gol: string;

  kpiMidYear: string;

  kpiFullYear: string;

  pk2023: string;

  pk2024: string;

  pk2025: string;

  linkPhoto: string;

  strength1: string;

  strength2: string;

  developmentArea1: string;

  developmentArea2: string;

  lastEducationDegree: string;

  lastEducationInstitution: string;
}
```

---

# Training History Entity

Relationship:

```text
Employee
↓
Training History
```

via:

```text
NRP
```

---

```ts
interface TrainingHistoryRecord {
  nrp: string;

  trainingName: string;

  trainingYear: string;

  status:
    | "Failed"
    | "Pool of Cadre"
    | "Promoted"
    | "On Going";
}
```

---

# Work History Entity

Relationship:

```text
Employee
↓
Work History
```

via:

```text
NRP
```

---

```ts
interface WorkHistoryRecord {
  nrp: string;

  position: string;

  pos?: string;

  branchCode: string;

  branchName?: string;

  startDate: string;

  endDate: string;
}
```

---

# Important Rule

Duration is NOT stored.

```text
❌ Duration Column
```

must not exist.

---

Duration is calculated dynamically.

Example:

```text
Start Date:
01-01-2020

End Date:
31-12-2023
```

↓

```text
Duration:
3-11
```

---

# Dataset Model

The application uses dataset replacement.

There is only one active dataset.

---

Employee Dataset

```text
employees.csv
```

---

Training Dataset

```text
training_history.csv
```

---

Work History Dataset

```text
work_history.csv
```

---

# Import Behavior

New dataset replaces old dataset.

No merge logic.

No synchronization.

No row-level updates.

No versioning.

---

# Analytics Relationship

Employee
↓
Branch
↓
Area
↓
Region
↓
National

All metrics are derived client-side.
