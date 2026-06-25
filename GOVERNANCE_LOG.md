# Governance Log - Hairlan International ERP

## Overview
This document tracks the governance, accountability, and decision-making processes for the Hairlan International ERP system.

## 1. Architecture Decision Records (ADRs)

| ID | Date | Decision | Rationale | Status |
|----|------|----------|-----------|--------|
| ADR-001 | 2024-05-20 | Use Next.js App Router | Modern, server-side rendering, and easy API routing. | Approved |
| ADR-002 | 2024-05-20 | Prisma with SQLite | Lightweight, easy to set up for MVP, strong typing. | Approved |
| ADR-003 | 2024-05-20 | Role-Based Access Control (RBAC) | Secure access based on job functions (Owner, Admin, PM, etc.). | Approved |
| ADR-004 | 2024-05-20 | Audit Logging | Traceability of all data mutations for accountability. | Approved |
| ADR-005 | 2024-05-20 | Shadcn UI & Tailwind CSS | Rapid UI development with consistent, accessible components. | Approved |

## 2. Approval Flow Matrix

| Entity | Action | Required Approver |
|--------|--------|-------------------|
| Daily Production | Review | Line Leader / Head Leader |
| Daily Production | Verification | Production Manager |
| Daily Production | Final Approval | Owner / Admin |
| Procurement | Create | Admin / PM / Accountant |
| Procurement | Approval | Owner |
| Sales | Create | Accountant / Admin |
| Sales | Approval | Owner |
| Grade Dispute | Resolution | QC / PM / Owner |

## 3. Pre-Commit Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Linting/formatting clean (zero warnings)
- [ ] Type checking passes
- [ ] Accessibility audit passes
- [ ] Responsive design verified
- [ ] Audit logs verified for new mutations

## 4. Accountability & Ownership

| Module | Owner | Backup |
|--------|-------|--------|
| Core / Auth | Admin | Owner |
| Production / QC | PM | Head Leader |
| Finance / Payroll | Accountant | Owner |
| Inventory | PM | Accountant |
| Risks | Admin | Owner |

## 5. Failure Escalation Policy

| Severity | Description | Action |
|----------|-------------|--------|
| **Critical** | Data loss, Security breach, System down | Immediate notification to Owner & Admin |
| **High** | Blocked production, incorrect financial data | Notification to Admin & Department Head |
| **Medium** | Bug in non-critical UI, performance lag | Log in issue tracker, resolve in next sprint |
| **Low** | Minor UI polish, typo | Resolve in routine maintenance |
