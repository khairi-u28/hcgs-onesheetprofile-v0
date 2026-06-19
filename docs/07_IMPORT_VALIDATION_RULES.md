# IMPORT_VALIDATION_RULES.md

# Validation Philosophy

The application validates all datasets before import.

Invalid records are rejected.

Valid records may proceed.

---

# Employee Dataset Validation

File:

```text
employees.csv
```

---

## Required Columns

```text
NRP
Nama
Position
POS

Region/Div
Area/Dept
Branch Code

Entry Date

Masa Kerja Total
Masa Kerja Jabatan
Masa Kerja Cabang

Date of Birth
Age

HAV

Last Dev'l Program
Status Dev'l Program
Periode Dev'l Program

Gol

KPI Mid Year
KPI Full Year

PK 2023
PK 2024
PK 2025

Link Photo

Strength 1
Strength 2

Areas of Development 1
Areas of Development 2

Level Pendidikan Terakhir
Institusi Pendidikan Terakhir
```

---

## Validation Rules

NRP:

```text
Must be unique.
```

---

Branch Code:

```text
Must exist in organization.json
```

---

HAV:

```text
Cannot be empty.
```

---

KPI Fields:

```text
Must be numeric.
```

---

PK Fields:

Allowed:

```text
BS
B+
B
C+
C
K
```

---

# Training History Validation

File:

```text
training_history.csv
```

---

## Required Columns

```text
NRP

Training Name

Training Year

Status
```

---

## Validation Rules

NRP:

```text
Must exist in employees dataset.
```

---

Training Name:

```text
Cannot be empty.
```

---

Status:

Allowed:

```text
Failed

Pool of Cadre

Promoted

On Going
```

---

# Work History Validation

File:

```text
work_history.csv
```

---

## Required Columns

```text
NRP

Position

Branch Code

Start Date

End Date
```

---

## Optional Columns

```text
POS

Branch Name
```

---

## Validation Rules

NRP:

```text
Must exist in employees dataset.
```

---

Position:

```text
Cannot be empty.
```

---

Branch Code:

```text
Must exist in organization.json.
```

---

Start Date:

```text
Required.
```

---

End Date:

```text
Required.
```

---

Date Validation

```text
Start Date <= End Date
```

except:

```text
NOW
CURRENT
ACTIVE
```

for active assignments.

---

# Forbidden Columns

The following field must NOT exist:

```text
Duration
```

Reason:

Duration is calculated by the application.

---

# Dataset Replacement Validation

Employee Dataset:

```text
Replace Employee Dataset
```

requires confirmation.

---

Training Dataset:

```text
Replace Training Dataset
```

requires confirmation.

---

Work History Dataset:

```text
Replace Work History Dataset
```

requires confirmation.

---

# Import Summary

After successful validation display:

```text
Total Records

Valid Records

Invalid Records

Duplicate NRP

Unknown Branch Codes

Missing Required Fields
```

for all dataset types.

---

# Import Order Recommendation

Recommended import sequence:

```text
1. employees.csv

2. training_history.csv

3. work_history.csv
```

This ensures relational validation succeeds on first import.
