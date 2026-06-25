---
Task ID: 1
Agent: main
Task: Read Combined_transcription, design role-based access control, implement audit logging, granular search

Work Log:
- Read Combined_transcription (545 lines) from upload folder — extracted Category 6 role/approval structure
- Mapped 9 roles to 28 sections with 6 permission types (view/create/edit/delete/approve/export)
- Created /src/lib/permissions.ts — comprehensive ROLE_PERMISSIONS matrix with approval chains
- Created /src/lib/audit.ts — writeAuditLog(), getChangedFields(), checkPermission(), canViewAuditEntry()
- Created /src/lib/api-client.ts — erpFetch() wrapper injecting x-erp-role and x-erp-user headers
- Updated /src/lib/store.ts — added roleKey, visibleSections, canView/canCreate/canEdit/canDelete/canApprove helpers
- Updated /src/app/api/auth/route.ts — returns roleKey, logs login to audit
- Updated /src/app/page.tsx — initializes api-client with store user
- Updated /src/components/erp/Sidebar.tsx — filters nav items by role permissions, grouped into Main/Management/Insights/System
- Updated /src/components/erp/LoginScreen.tsx — shows role descriptions in credential table
- Replaced all 85 raw fetch() calls across 25 components with erpFetch()
- Updated /src/app/api/audit-log/route.ts — added entity/user/date/entityId filtering, role-based visibility
- Enhanced /src/app/api/search/route.ts — 20 entity types with cross-references (worker→daily entries, lot→factory records, etc.)
- Rewrote /src/components/erp/GlobalSearchDialog.tsx — 20 search type icons/colors
- Rewrote /src/components/erp/AuditLogSection.tsx — full filter panel (entity/action/user/date/entityId), summary stats, pagination
- Fixed /src/components/erp/ApprovalWorkflowSection.tsx — uses roleKey from store for approval chain

Stage Summary:
- 9 roles mapped: owner(full), admin(near-full), pm(production), accountant(financials), head1(territory), supervisor1(factory), ll1(territory-daily), qc1(grading), viewer(read-only)
- Approval chain: Supervisor→LL Review→HL Review→PM Review→Owner Final (4-tier for salary sheets)
- Audit trail: Every CREATE/UPDATE/DELETE logged with who/what/when/old/new values
- Role-based audit visibility: Owner/Admin/Accountant see all; others see own changes only
- Granular search: 20 entity types + 4 cross-reference types (daily entries, factory records, phase2 jobs, distributions)
- All 44 API routes have checkPermission + writeAuditLog
- All 25 frontend components use erpFetch() to send auth headers
- Verified via API testing: permission blocks work for viewer, supervisor, qc; owner has full access
