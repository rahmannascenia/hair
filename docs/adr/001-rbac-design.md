# ADR 001: Role-Based Access Control (RBAC) Design

## Status
Accepted

## Context
The Barendra International ERP system requires a robust security model to ensure that users have access only to the data and actions necessary for their roles. The system serves multiple types of users, from factory supervisors to the company owner.

## Decision
We have implemented a central RBAC system in `src/lib/audit.ts` and `src/lib/permissions.ts`.

### Roles
- **Owner**: Full access to all modules, including financial data and final approvals.
- **Admin**: Full access except for final owner-level approvals.
- **PM (Production Manager)**: Oversight of production (Washing, Phase 1, Phase 2), but no access to financial data or payroll.
- **Accountant**: Full access to financial modules (Payroll, Procurement, Sales, LC Management) but no write access to production data.
- **Head Leader**: Access to their specific territory's data. Read-only for financial data.
- **Line Leader**: Access to their specific factories' data. No access to financial/pricing data.
- **Supervisor**: Access to their specific factory's data. Can enter daily production.
- **QC Inspector**: Access to all factories for grading. Can enter/approve grades but cannot see financial data.
- **Viewer**: Read-only access across non-sensitive modules.

### Implementation
1. **Permissions Matrix**: A comprehensive map in `src/lib/permissions.ts` defines `view`, `create`, `edit`, `delete`, `approve`, and `export` permissions for each role across all system sections.
2. **API Enforcement**: All API routes use the `checkPermission` utility to validate the user's role before processing requests.
3. **Data Scoping**: Future implementation will include `getDataScope` to filter database queries based on the user's organizational level (e.g., a Supervisor only sees their own factory's records).

## Consequences
- Enhanced security and data integrity.
- Clear separation of duties.
- Scalable permission management via a centralized matrix.
- Requirements for future data-level filtering are established.
