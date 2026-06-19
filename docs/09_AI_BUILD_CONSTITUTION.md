# AI_BUILD_CONSTITUTION.md

# Build Philosophy

This project is an analytics platform.

Do NOT build an admin system.

Do NOT build CRUD interfaces.

Do NOT build database management screens.

---

# Employee Directory Principles

Employee Directory is an intelligence tool.

The layout order must be:

1. Search
2. Filters
3. Summary Cards
4. Employee Table

Never place table before filters.

---

# Nested Filtering Rules

Filters must be dependent.

Region
→ Area
→ Branch

When Region changes:

Area options must refresh.

When Area changes:

Branch options must refresh.

---

# Dataset Philosophy

Employees.csv is the source of truth.

Training_history.csv is the source of truth.

Imports replace existing datasets.

Do not implement:

* Merge Logic
* Synchronization
* Diff Engine
* Update Detection

---

# Dashboard Principles

Dashboard should answer:

* Who are our people?
* Where are our people?
* How are our people performing?
* How many employees are under development?

before showing detailed tables.

---

# One Sheet Principles

Employee One Sheet Profile is the flagship feature.

This page should receive the highest design quality.

Prioritize:

* Readability
* Information hierarchy
* Visual presentation

over compactness.

---

# UI Principles

Prefer:

* KPI Cards
* Summary Cards
* Timelines
* Charts
* Drilldowns

Avoid:

* Dense tables
* Long forms
* CRUD actions
* Modal-heavy workflows

---

# Performance Principles

Target:

5,000 - 10,000 employees

All analytics calculated client-side.

Filtering should feel instantaneous.

---

# Success Criteria

A first-time user should be able to:

Import Dataset
→ Navigate Region
→ Open Branch
→ Open Employee
→ View One Sheet

without needing training or documentation.
