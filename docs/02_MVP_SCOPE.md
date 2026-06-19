# 02_MVP_SCOPE.md

# One Sheet Profile V2

## MVP Scope Definition

Version: 2.0

---

# 1. MVP Objective

Deliver a Workforce Intelligence Platform capable of providing workforce visibility from national level down to individual employee level.

---

# 2. In Scope

## Dashboard

### Workforce Summary

* Total Headcount
* Average KPI
* Average HAV
* Unfit Employee Alert

### Workforce Health

* HAV Distribution
* Development Distribution

### Territory Comparison

* Region Comparison

### Management Attention Required

* Bottom KPI Branches
* Workforce Risk Indicators

---

## Organization Module

### Region

* Workforce Summary
* KPI Analytics
* HAV Analytics
* Development Analytics
* Area Comparison

### Area

* Workforce Summary
* KPI Analytics
* HAV Analytics
* Development Analytics
* Branch Comparison

### Branch

* Workforce Summary
* KPI Analytics
* HAV Analytics
* Development Analytics
* Position Distribution
* Employee Directory

---

## Employee Directory

### Search

* Global Search

### Filters

* Region
* Area
* Branch
* Position
* HAV Category
* Development Status

### Scalability

* Pagination
* 10,000+ employee support

---

## Employee One Sheet Profile

### Executive Summary

* Employee Identity
* Position
* POS
* Golongan
* Branch Information

### Performance Analytics

* KPI Mid Year
* KPI Full Year
* HAV
* PK 2023
* PK 2024
* PK 2025

### Personal Information

* Age
* Date of Birth
* Education
* Strengths
* Development Areas

### Development Journey

* Development Program
* Status
* Period

### Training History

* Training Records
* Status Tracking

### Working Experience

* Position History
* Branch History
* Career Timeline

---

## Import Center

### Employee Dataset

employees.csv

### Training Dataset

training_history.csv

### Work History Dataset

work_history.csv

### Validation

* Required Columns
* Duplicate NRP Detection
* Unknown Branch Detection
* Invalid Data Detection

### Import Experience

* Preview
* Validation Summary
* Dataset Replacement
* Persistence

---

# 3. Out of Scope

The following are intentionally excluded from MVP:

## Integrations

* LMS Integration
* TMS Integration
* SAP Integration
* API Integration

## Security

* Role Based Access Control
* SSO
* Multi Tenant Support

## Advanced Analytics

* Predictive Analytics
* Succession Analytics
* AI Recommendation Engine
* Forecasting

## Data Export

* Excel Export
* PDF Export

## Administration

* User Management
* Permission Management

---

# 4. MVP Completion Criteria

The MVP is considered complete when users can:

1. Import workforce datasets.
2. Navigate from Dashboard to Region.
3. Navigate from Region to Area.
4. Navigate from Area to Branch.
5. Navigate from Branch to Employee.
6. Analyze workforce conditions at every level.
7. View complete employee intelligence profiles.
8. Investigate workforce risks using analytics and drilldowns.

---

# 5. Current Status

Status: FEATURE FREEZE APPROVED

Completed:

* Sprint 1
* Sprint 2
* Sprint 2.5
* Sprint 2.6
* Sprint 3

Next Phase:

Executive UI Refresh & Analytics Enhancement
