# ADR 003: Governance and Audit Mechanisms

## Status
Accepted

## Context
Transparency and accountability are essential for the operation of Barendra International. The system must maintain an immutable record of all changes and provide a clear path for approvals.

## Decision
We have implemented the following governance mechanisms:

### 1. Audit Logging
- Every mutation (CREATE, UPDATE, DELETE) in the system is logged to an `AuditLog` table.
- Logs include: `entity`, `entityId`, `action`, `oldValues`, `newValues`, `performedBy`, and `timestamp`.
- Utilities in `src/lib/audit.ts` automate the comparison of old and new states to log only actual changes.

### 2. Approval Workflows
- Structured approval chains are defined in `src/lib/permissions.ts`.
- Critical processes (e.g., Worker Daily Entries) must move through a multi-stage approval process:
  - `Pending Approval` (Created by Supervisor/Line Leader)
  - `LL Reviewed` (Reviewed by Line Leader)
  - `HL Reviewed` (Reviewed by Head Leader)
  - `PM Approved` (Reviewed by Production Manager)
  - `Owner Approved` (Final approval by Owner)

### 3. Accountability
- All actions are tied to a specific user (`performedBy`).
- Traceability: Each record can display its history of changes.
- Automated Alerts: Notifications are generated for critical events like high wastage or low inventory.

## Consequences
- Full transparency of system usage.
- Hardened data integrity through required approvals.
- Clear audit trail for financial and operational auditing.
- Increased accountability for all system users.
