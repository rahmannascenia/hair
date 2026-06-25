# ADR 001: Implementation of Audit Logging

## Status
Accepted

## Context
The system requires a high level of accountability and traceability for all data modifications. As an ERP for a manufacturing business, knowing who changed what and when is critical for financial and operational integrity.

## Decision
We implemented a centralized audit logging utility in `src/lib/audit.ts` that:
1. Records every CREATE, UPDATE, and DELETE action.
2. Stores `oldValues` and `newValues` as JSON strings.
3. Automatically calculates changed fields for UPDATE actions.
4. Identifies the actor from request headers (`x-erp-user`).
5. Associates logs with specific entities and their IDs.

## Consequences
- Every API mutation now includes an additional database write.
- Data changes are transparent and auditable.
- Minor performance overhead due to JSON serialization and extra DB write.
- Role-based visibility of logs ensures privacy (e.g., non-admin users only see their own logs).
