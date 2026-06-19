# PROJECT_BOOTSTRAP.md

# HCGS Workforce Intelligence Portal

## Mission

Build a modern Workforce Intelligence Portal focused on Employee Visibility and Workforce Analytics.

The platform is NOT an HRIS.

The platform is NOT an LMS.

The platform is NOT a CRUD Administration System.

---

# Primary User

HCGS Administrator

---

# Core User Journey

Dashboard
→ Region
→ Area
→ Branch
→ Employee
→ One Sheet Profile

Employee One Sheet Profile is the final destination.

---

# Architecture

Frontend Only

Next.js
TypeScript

No Backend

No Database Server

No API

---

# Data Sources

Static:

organization.json

Dynamic:

employees.csv
training_history.csv

---

# Dataset Philosophy

The application behaves like an analytics platform.

Imported CSV files are treated as datasets.

New imports replace existing datasets.

No row-level synchronization.

No merge logic.

No update logic.

---

# Employee Directory Requirements

Must support:

* Global Search
* Region Filter
* Area Filter
* Branch Filter
* Position Filter
* HAV Filter
* Development Status Filter

Region → Area → Branch filtering must be dependent.

---

# Import Requirements

Employee Import Flow:

Upload
→ Validate
→ Preview
→ Import

Training Import Flow:

Upload
→ Validate
→ Preview
→ Import

Support Dataset Replacement.

Always display replacement warning.

---

# One Sheet Requirements

This is the most important page.

Must display:

Identity

Organization

Personal Profile

Performance

Strengths

Development Areas

Development Program

Training Timeline

---

# Design Philosophy

Modern

Executive

Premium

Clean

Analytics-Oriented

Avoid:

* Admin Panels
* CRUD Layouts
* Dense Forms

Prefer:

* KPI Cards
* Insight Cards
* Drilldown Navigation
* Timelines
* Dashboard Layouts

---

# Success Criteria

User can:

* Import datasets
* Explore organization hierarchy
* Search employees
* Filter employees
* Open One Sheet Profiles
* View workforce analytics

without any backend dependency.
