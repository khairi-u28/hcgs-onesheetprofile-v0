# TECH_STACK.md

# Technology Decision Freeze

All development must follow this stack.

Do not replace libraries unless there is a critical technical issue.

---

# Framework

Next.js 16+

App Router

TypeScript

---

# Styling

Tailwind CSS

shadcn/ui

---

# Icons

Lucide React

---

# Charts

Recharts

Used for:

* HAV Distribution
* KPI Distribution
* Development Status
* Region Comparison
* Workforce Distribution

---

# Tables

TanStack Table

Used for:

* Employee Directory
* Branch Employee List

Requirements:

* Sorting
* Filtering
* Pagination
* Global Search

---

# CSV Parsing

PapaParse

Supported Files:

* employees.csv
* training_history.csv

---

# State Management

Zustand

Stores:

* Organization Data
* Employee Data
* Training History
* Analytics Results

---

# Local Persistence

localStorage

Purpose:

Persist imported data between page refreshes.

No backend database.

No API.

No IndexedDB for V1.

---

# Date Handling

date-fns

Used for:

* Age calculation
* Tenure calculation
* Training timeline

---

# Validation

Zod

Used for:

* CSV validation
* Data transformation

---

# Folder Structure

src/

├── app/
│
├── components/
│
├── features/
│   ├── dashboard/
│   ├── organization/
│   ├── employees/
│   ├── training/
│   └── import/
│
├── store/
│
├── lib/
│   ├── csv/
│   ├── analytics/
│   ├── validators/
│   └── utils/
│
├── types/
│
├── data/
│   └── organization.json
│
└── hooks/

---

# Design System

Visual Style:

Modern

Executive

Premium

Minimal

Analytics-Oriented

---

# Avoid

Do NOT use:

* Filament-style layouts
* Dense forms
* Admin-looking interfaces
* Excessive tables
* Small unreadable charts

---

# Prefer

Use:

* KPI Cards
* Drilldown Navigation
* Insight Blocks
* Timeline Components
* Responsive Layouts
* Large Typography

---

# Data Flow

organization.json
↓

employees.csv
↓

training_history.csv
↓

zustand store
↓

analytics engine
↓

dashboard + pages

---

# Future Expansion

Architecture must allow future integration with:

* Laravel Backend
* LMS
* TMS
* Competency Engine

without requiring major frontend refactoring.

---

# V1 Deployment

Primary:

Vercel

Alternative:

Local Next.js deployment

No backend deployment required.
