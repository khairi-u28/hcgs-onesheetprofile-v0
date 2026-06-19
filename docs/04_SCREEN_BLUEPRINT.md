# 04_SCREEN_BLUEPRINT.md

# One Sheet Profile V2

## Screen Blueprint

Version: 2.0

Status: Approved

---

# Design Philosophy

One Sheet Profile is a Workforce Intelligence & Talent Analytics Platform.

Every screen must provide four layers of information:

## Layer 1 — Summary

Provide quick understanding of current condition.

---

## Layer 2 — Visualization

Provide graphical understanding of trends and distributions.

---

## Layer 3 — Insight

Provide management-focused findings.

Answer:

"What should management pay attention to?"

---

## Layer 4 — Detail

Provide supporting information for investigation.

---

# Navigation Structure

Dashboard
→ Region
→ Area
→ Branch
→ Employee

Import Center remains independent.

---

# 1. DASHBOARD

## Primary Question

Where should management focus?

---

## Section A — Workforce Summary

Top KPI cards:

* Total Headcount
* Average KPI
* Average HAV
* Development Participants
* Unfit Employee Alert

---

## Section B — Management Attention Required

Priority section.

Display:

### Lowest KPI Branches

Top 5 lowest KPI branches.

Columns:

* Branch
* Region
* KPI
* Employee Count

---

### Highest Development Backlog

Top 5 branches.

Columns:

* Branch
* Employees Without Development Program

---

### Highest Unfit Employee Count

Top 5 branches.

Columns:

* Branch
* Unfit Employee Count

---

## Section C — Workforce Health

### HAV Distribution

Chart:

* Donut Chart
* Bar Chart

Categories:

* Strong Performer
* Candidate
* Potential Candidate
* Career Person
* Unfit Employee

---

### Development Program Distribution

Chart:

* Stacked Bar
* Donut

Categories:

* Completed
* Ongoing
* Not Started

---

## Section D — Territory Comparison

### Region KPI Comparison

Chart:

* Horizontal Bar

Metrics:

* Average KPI

---

### Region HAV Comparison

Chart:

* Horizontal Bar

Metrics:

* Average HAV

---

## Section E — National Workforce Table

Columns:

* Region
* Employee Count
* Average KPI
* Average HAV
* Development Participants

Clickable drilldown.

---

# 2. REGION DETAIL

## Primary Question

Which areas require intervention?

---

## Section A — Region Summary

Cards:

* Employee Count
* Average KPI
* Average HAV
* Development Participants

---

## Section B — Workforce Analytics

### Area KPI Comparison

Chart:

* Horizontal Bar

---

### Area HAV Comparison

Chart:

* Horizontal Bar

---

### Area Employee Distribution

Chart:

* Donut

---

## Section C — Talent Analytics

### HAV Distribution

Chart:

* Donut

Categories:

* Strong Performer
* Candidate
* Potential Candidate
* Career Person
* Unfit Employee

---

## Section D — Development Analytics

### Development Status Distribution

Chart:

* Donut

Categories:

* Completed
* Ongoing
* Not Started

---

## Section E — Region Insight

Examples:

* Area with lowest KPI
* Area with highest backlog
* Area with highest unfit employees

---

## Section F — Area Ranking

Table:

* Area
* Employee Count
* KPI
* HAV
* Development %

Clickable rows.

---

# 3. AREA DETAIL

## Primary Question

Which branches require intervention?

---

## Section A — Area Summary

Cards:

* Employee Count
* Average KPI
* Average HAV
* Development Participants

---

## Section B — Branch Analytics

### Branch KPI Comparison

Chart:

* Horizontal Bar

---

### Branch HAV Comparison

Chart:

* Horizontal Bar

---

### Branch Employee Distribution

Chart:

* Donut

---

## Section C — Talent Analytics

### HAV Distribution

Chart:

* Donut

---

## Section D — Development Analytics

### Development Status Distribution

Chart:

* Donut

---

## Section E — Area Insight

Examples:

* Lowest KPI branch
* Highest backlog branch
* Highest unfit branch

---

## Section F — Branch Ranking

Columns:

* Branch
* Employee Count
* KPI
* HAV

Clickable rows.

---

# 4. BRANCH DETAIL

## Primary Question

Which employees require intervention?

---

## Section A — Branch Summary

Cards:

* Employee Count
* Average KPI
* Average HAV
* Development Participants

---

## Section B — Workforce Analytics

### Position Distribution

Chart:

* Horizontal Bar

---

### HAV Distribution

Chart:

* Donut

---

### Development Distribution

Chart:

* Donut

---

## Section C — Branch Insight

Examples:

* Employees without development program
* Unfit employees
* Strong performers
* Promotion candidates

---

## Section D — Employee Ranking

Top Performers

Columns:

* NRP
* Name
* Position
* KPI
* HAV

---

### Attention Required

Columns:

* NRP
* Name
* Position
* Risk Indicator

---

## Section E — Employee Directory

Search

Filters:

* Position
* HAV
* Development Status

Pagination required.

---

# 5. EMPLOYEE DIRECTORY

## Primary Question

Who should I investigate?

---

## Section A — Search & Filters

Search:

* NRP
* Name
* Position

Filters:

* Region
* Area
* Branch
* Position
* HAV
* Development Status

---

## Section B — Workforce Summary

Cards:

* Employee Count
* Average KPI
* Average HAV

---

## Section C — Employee Table

Columns:

* NRP
* Name
* Position
* Branch
* KPI
* HAV
* Development Status

Pagination:

* 25
* 50
* 100 rows

---

# 6. EMPLOYEE PROFILE

## Primary Question

What action should management take for this employee?

---

## Layout Structure

Two-column intelligence workspace.

---

## Section A — Executive Summary

Contents:

* Photo
* NRP
* Name
* Position
* POS
* Gol
* Branch Code
* Branch Name

Key Metrics:

* KPI Full Year
* HAV
* PK 2025

---

## Section B — Employee Intelligence Summary

Auto-generated management findings.

Examples:

* Strong performer
* Development backlog
* Promotion candidate
* Talent pool candidate

---

## Section C — Performance Analytics

Metrics:

* KPI Mid Year
* KPI Full Year
* HAV
* PK 2023
* PK 2024
* PK 2025

Visualization:

* PK Trend Chart
* KPI Trend Chart (future)

---

## Section D — Personal Information

Fields:

* Date of Birth
* Age
* Education Degree
* Education Institution
* Strength 1
* Strength 2
* Development Area 1
* Development Area 2

---

## Section E — Development Program

Fields:

* Last Development Program
* Development Status
* Development Period

Visualization:

* Status Indicator

---

## Section F — Training Analytics

Summary:

* Total Trainings
* Completed Trainings
* Failed Trainings

Visualization:

* Training Status Distribution

---

## Section G — Training History

Columns:

* Training Name
* Year
* Status

Allowed Status:

* Failed
* Pool of Cadre
* Promoted
* On Going

---

## Section H — Career Journey

Timeline:

* Position
* POS
* Branch
* Start Date
* End Date

Duration calculated automatically by system.

---

# 7. IMPORT CENTER

## Primary Question

Can the dataset be trusted?

---

## Section A — Dataset Status

Cards:

* Employee Records
* Training Records
* Work History Records

---

## Section B — Upload

Files:

* employees.csv
* training_history.csv
* work_history.csv

---

## Section C — Validation

Checks:

* Required Columns
* Duplicate NRP
* Unknown Branch
* Invalid Values

---

## Section D — Preview

Display:

* First 20 rows

---

## Section E — Import Confirmation

Display:

* Record Count
* Replacement Warning

---

## Section F — Import Result

Display:

* Success
* Error Count
* Imported Records
