# CSV_SPECIFICATION.md

# Supported Files

The application supports:

1. employees.csv
2. training_history.csv
3. work_history.csv

---

# employees.csv

Required Columns

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

# Important Rules

Branch Code must exist in:

```text
organization.json
```

---

Masa Kerja fields are stored directly.

Example:

```text
24-12
8-4
3-7
```

Do not convert.

Do not calculate.

Display exactly as provided.

---

Photo URL

Supports:

```text
Direct Image URL
```

and:

```text
Google Drive URL
```

Example:

```text
https://drive.google.com/file/d/FILE_ID/view
```

---

# training_history.csv

Required Columns

```text
NRP

Training Name

Training Year

Status
```

---

# Supported Status

```text
Failed

Pool of Cadre

Promoted

On Going
```

Only these statuses are displayed inside Employee Profile.

---

# Relationship

```text
NRP
```

must exist inside:

```text
employees.csv
```

---

# work_history.csv

Required Columns

```text
NRP

Position

Branch Code

Start Date

End Date
```

---

Optional Columns

```text
POS

Branch Name
```

---

# Relationship

```text
NRP
```

must exist inside:

```text
employees.csv
```

---

# Important Rule

Duration column is NOT allowed.

Do not include:

```text
Duration
```

inside CSV.

---

The application calculates duration automatically.

Example:

```text
Start Date:
01-01-2020

End Date:
31-12-2023
```

↓

```text
3-11
```

---

# Import Order

Recommended:

1. employees.csv
2. training_history.csv
3. work_history.csv

---

# Dataset Replacement

All imports replace existing datasets.

Example:

```text
Upload New Employee CSV
```

↓

```text
Replace Previous Employee Dataset
```

No merge.

No synchronization.

No update process.
