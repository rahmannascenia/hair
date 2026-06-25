/**
 * Barendra International ERP — Role-Based Access Control
 *
 * Based on Combined_transcription Category 6 analysis:
 * - Owner: Full access to everything + final approval authority
 * - Admin: Full access except final owner approvals
 * - PM (Production Manager): Distribution, washing, lot tracking, factory oversight (NOT salary approval, NOT financials)
 * - Accountant: Payroll, procurement, sales, FX, financial reports (can't modify production data)
 * - Head Leader (head1): Only their territory's factories, LLs, workers, daily records (read-only on pricing/financials)
 * - Line Leader (ll1): Only their factories' daily records, worker lists, WIP tracking (no pricing, no financials)
 * - Supervisor (supervisor1): Only their factory's daily records and worker list (can enter daily production data)
 * - QC Inspector (qc1): Can view all factories for grading, enter grades, can't see payroll or financials
 * - Viewer: Read-only access to most sections
 */

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface SectionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

// All ERP sections and their permission requirements
export type SectionKey =
  | 'dashboard'
  | 'procurement'
  | 'suppliers'
  | 'lot-master'
  | 'lot-tracker'
  | 'inventory'
  | 'washing-log'
  | 'phase1'
  | 'organization'
  | 'factory'
  | 'qc'
  | 'payroll'
  | 'phase2'
  | 'size-pricing'
  | 'sales'
  | 'costing'
  | 'kpi'
  | 'risks'
  | 'settings'
  | 'approval-workflow'
  | 'audit-log'
  | 'grade-dispute'
  | 'rejection-investigation'
  | 'worker-profile'
  | 'daily-reports'
  | 'leaderboard'
  | 'hierarchy'
  | 'lc-management'
  | 'consumables';

// Permission matrix per role per section
type Role = 'owner' | 'admin' | 'pm' | 'accountant' | 'head1' | 'supervisor1' | 'll1' | 'qc1' | 'viewer';

const FULL: SectionPermissions = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
const VIEW_ONLY: SectionPermissions = { view: true, create: false, edit: false, delete: false, approve: false, export: true };
const NO_ACCESS: SectionPermissions = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
const VIEW_EDIT: SectionPermissions = { view: true, create: true, edit: true, delete: false, approve: false, export: true };
const VIEW_APPROVE: SectionPermissions = { view: true, create: false, edit: false, delete: false, approve: true, export: true };

const ROLE_PERMISSIONS: Record<Role, Record<SectionKey, SectionPermissions>> = {
  owner: {
    dashboard: FULL, procurement: FULL, suppliers: FULL, 'lot-master': FULL, 'lot-tracker': FULL,
    inventory: FULL, 'washing-log': FULL, phase1: FULL, organization: FULL, factory: FULL,
    qc: FULL, payroll: FULL, phase2: FULL, 'size-pricing': FULL, sales: FULL, costing: FULL,
    kpi: FULL, risks: FULL, settings: FULL, 'approval-workflow': FULL, 'audit-log': FULL,
    'grade-dispute': FULL, 'rejection-investigation': FULL, 'worker-profile': FULL,
    'daily-reports': FULL, leaderboard: FULL, hierarchy: FULL, 'lc-management': FULL, consumables: FULL,
  },

  admin: {
    dashboard: FULL, procurement: FULL, suppliers: FULL, 'lot-master': FULL, 'lot-tracker': FULL,
    inventory: VIEW_EDIT, 'washing-log': FULL, phase1: FULL, organization: FULL, factory: FULL,
    qc: VIEW_EDIT, payroll: VIEW_EDIT, phase2: FULL, 'size-pricing': VIEW_EDIT, sales: FULL, costing: VIEW_EDIT,
    kpi: VIEW_EDIT, risks: FULL, settings: FULL, 'approval-workflow': { ...FULL, approve: true },
    'audit-log': FULL, 'grade-dispute': FULL, 'rejection-investigation': FULL, 'worker-profile': FULL,
    'daily-reports': FULL, leaderboard: VIEW_EDIT, hierarchy: VIEW_EDIT, 'lc-management': FULL, consumables: FULL,
  },

  pm: {
    // PM: Distribution, washing, lot tracking, factory oversight. NOT salary approval, NOT financials.
    dashboard: VIEW_EDIT, procurement: VIEW_EDIT, suppliers: VIEW_ONLY, 'lot-master': FULL, 'lot-tracker': VIEW_EDIT,
    inventory: VIEW_ONLY, 'washing-log': FULL, phase1: FULL, organization: VIEW_ONLY, factory: FULL,
    qc: VIEW_ONLY, payroll: NO_ACCESS, phase2: FULL, 'size-pricing': NO_ACCESS, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: VIEW_ONLY, risks: VIEW_ONLY, settings: NO_ACCESS, 'approval-workflow': VIEW_APPROVE,
    'audit-log': VIEW_ONLY, 'grade-dispute': VIEW_APPROVE, 'rejection-investigation': VIEW_APPROVE,
    'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_EDIT, leaderboard: VIEW_ONLY,
    hierarchy: VIEW_ONLY, 'lc-management': VIEW_ONLY, consumables: VIEW_ONLY,
  },

  accountant: {
    // Accountant: Payroll, procurement, sales, FX, financial reports. Can't modify production.
    dashboard: VIEW_EDIT, procurement: VIEW_EDIT, suppliers: VIEW_EDIT, 'lot-master': VIEW_ONLY, 'lot-tracker': NO_ACCESS,
    inventory: VIEW_ONLY, 'washing-log': NO_ACCESS, phase1: NO_ACCESS, organization: VIEW_ONLY, factory: VIEW_ONLY,
    qc: NO_ACCESS, payroll: FULL, phase2: NO_ACCESS, 'size-pricing': VIEW_ONLY, sales: FULL, costing: FULL,
    kpi: VIEW_ONLY, risks: VIEW_ONLY, settings: NO_ACCESS, 'approval-workflow': NO_ACCESS,
    'audit-log': FULL, 'grade-dispute': NO_ACCESS, 'rejection-investigation': NO_ACCESS,
    'worker-profile': VIEW_ONLY, 'daily-reports': NO_ACCESS, leaderboard: NO_ACCESS,
    hierarchy: NO_ACCESS, 'lc-management': VIEW_EDIT, consumables: VIEW_EDIT,
  },

  head1: {
    // Head Leader: Only their territory. Read-only on pricing/financials.
    dashboard: VIEW_ONLY, procurement: NO_ACCESS, suppliers: NO_ACCESS, 'lot-master': VIEW_ONLY, 'lot-tracker': VIEW_ONLY,
    inventory: NO_ACCESS, 'washing-log': VIEW_ONLY, phase1: VIEW_ONLY, organization: VIEW_ONLY, factory: VIEW_ONLY,
    qc: VIEW_ONLY, payroll: VIEW_ONLY, phase2: NO_ACCESS, 'size-pricing': NO_ACCESS, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: VIEW_ONLY, risks: NO_ACCESS, settings: NO_ACCESS, 'approval-workflow': VIEW_APPROVE,
    'audit-log': VIEW_ONLY, 'grade-dispute': VIEW_APPROVE, 'rejection-investigation': NO_ACCESS,
    'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_ONLY, leaderboard: VIEW_ONLY,
    hierarchy: VIEW_ONLY, 'lc-management': NO_ACCESS, consumables: NO_ACCESS,
  },

  supervisor1: {
    // Supervisor: Only their factory's records. Can enter daily production data.
    dashboard: VIEW_ONLY, procurement: NO_ACCESS, suppliers: NO_ACCESS, 'lot-master': NO_ACCESS, 'lot-tracker': NO_ACCESS,
    inventory: NO_ACCESS, 'washing-log': NO_ACCESS, phase1: NO_ACCESS, organization: NO_ACCESS, factory: VIEW_EDIT,
    qc: NO_ACCESS, payroll: NO_ACCESS, phase2: NO_ACCESS, 'size-pricing': NO_ACCESS, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: NO_ACCESS, risks: NO_ACCESS, settings: NO_ACCESS, 'approval-workflow': VIEW_ONLY,
    'audit-log': VIEW_ONLY, 'grade-dispute': { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    'rejection-investigation': NO_ACCESS, 'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_EDIT,
    leaderboard: NO_ACCESS, hierarchy: NO_ACCESS, 'lc-management': NO_ACCESS, consumables: NO_ACCESS,
  },

  ll1: {
    // Line Leader: Their factories' daily records, worker lists, WIP. No pricing/financials.
    dashboard: VIEW_ONLY, procurement: NO_ACCESS, suppliers: NO_ACCESS, 'lot-master': VIEW_ONLY, 'lot-tracker': VIEW_ONLY,
    inventory: NO_ACCESS, 'washing-log': NO_ACCESS, phase1: VIEW_ONLY, organization: VIEW_ONLY, factory: VIEW_ONLY,
    qc: NO_ACCESS, payroll: NO_ACCESS, phase2: NO_ACCESS, 'size-pricing': NO_ACCESS, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: VIEW_ONLY, risks: NO_ACCESS, settings: NO_ACCESS, 'approval-workflow': VIEW_APPROVE,
    'audit-log': VIEW_ONLY, 'grade-dispute': { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    'rejection-investigation': NO_ACCESS, 'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_ONLY,
    leaderboard: VIEW_ONLY, hierarchy: VIEW_ONLY, 'lc-management': NO_ACCESS, consumables: NO_ACCESS,
  },

  qc1: {
    // QC Inspector: View all factories for grading, enter grades, can't see payroll/financials.
    dashboard: VIEW_ONLY, procurement: NO_ACCESS, suppliers: NO_ACCESS, 'lot-master': VIEW_ONLY, 'lot-tracker': VIEW_ONLY,
    inventory: NO_ACCESS, 'washing-log': NO_ACCESS, phase1: NO_ACCESS, organization: NO_ACCESS, factory: VIEW_ONLY,
    qc: FULL, payroll: NO_ACCESS, phase2: NO_ACCESS, 'size-pricing': NO_ACCESS, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: VIEW_ONLY, risks: NO_ACCESS, settings: NO_ACCESS, 'approval-workflow': NO_ACCESS,
    'audit-log': VIEW_ONLY, 'grade-dispute': VIEW_APPROVE, 'rejection-investigation': VIEW_APPROVE,
    'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_ONLY, leaderboard: VIEW_ONLY,
    hierarchy: NO_ACCESS, 'lc-management': NO_ACCESS, consumables: NO_ACCESS,
  },

  viewer: {
    // Viewer: Read-only access to most sections (no sensitive financial data).
    dashboard: VIEW_ONLY, procurement: VIEW_ONLY, suppliers: VIEW_ONLY, 'lot-master': VIEW_ONLY, 'lot-tracker': VIEW_ONLY,
    inventory: VIEW_ONLY, 'washing-log': VIEW_ONLY, phase1: VIEW_ONLY, organization: VIEW_ONLY, factory: VIEW_ONLY,
    qc: VIEW_ONLY, payroll: NO_ACCESS, phase2: VIEW_ONLY, 'size-pricing': VIEW_ONLY, sales: NO_ACCESS, costing: NO_ACCESS,
    kpi: VIEW_ONLY, risks: VIEW_ONLY, settings: NO_ACCESS, 'approval-workflow': VIEW_ONLY,
    'audit-log': NO_ACCESS, 'grade-dispute': VIEW_ONLY, 'rejection-investigation': NO_ACCESS,
    'worker-profile': VIEW_ONLY, 'daily-reports': VIEW_ONLY, leaderboard: VIEW_ONLY,
    hierarchy: VIEW_ONLY, 'lc-management': NO_ACCESS, consumables: VIEW_ONLY,
  },
};

/**
 * Check if a role has a specific permission for a section
 */
export function hasPermission(role: string, section: SectionKey, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as Role];
  if (!rolePerms) return false;
  const sectionPerms = rolePerms[section];
  if (!sectionPerms) return false;
  return sectionPerms[permission];
}

/**
 * Get all permissions for a role on a specific section
 */
export function getSectionPermissions(role: string, section: SectionKey): SectionPermissions {
  const rolePerms = ROLE_PERMISSIONS[role as Role];
  if (!rolePerms) return NO_ACCESS;
  return rolePerms[section] || NO_ACCESS;
}

/**
 * Get all sections visible to a role (for sidebar filtering)
 */
export function getVisibleSections(role: string): SectionKey[] {
  const rolePerms = ROLE_PERMISSIONS[role as Role];
  if (!rolePerms) return [];
  return (Object.entries(rolePerms) as [SectionKey, SectionPermissions][])
    .filter(([, perms]) => perms.view)
    .map(([key]) => key);
}

/**
 * Get the approval chain for a given entity type
 * Based on transcription Category 6.3:
 * - Salary sheet: Supervisor submits → Head Leader reviews → PM reviews → Owner approves
 * - Purchase: PM recommends → Owner approves
 * - Exception: PM/Owner approves
 * - Grade dispute: QC/HL reviews → PM → Owner
 */
export interface ApprovalStep {
  status: string;
  requiredRole: string | string[];
  nextStatus: string;
  rejectStatus: string;
  label: string;
}

export const APPROVAL_CHAINS: Record<string, ApprovalStep[]> = {
  // Salary / daily entry approval chain
  daily_entry: [
    { status: 'Pending Approval', requiredRole: ['supervisor1', 'll1'], nextStatus: 'LL Reviewed', rejectStatus: 'Rejected', label: 'Submit / LL Review' },
    { status: 'LL Reviewed', requiredRole: ['head1', 'admin'], nextStatus: 'HL Reviewed', rejectStatus: 'Rejected', label: 'HL Review' },
    { status: 'HL Reviewed', requiredRole: ['pm', 'admin'], nextStatus: 'PM Approved', rejectStatus: 'Rejected', label: 'PM Review' },
    { status: 'PM Approved', requiredRole: ['owner', 'admin'], nextStatus: 'Owner Approved', rejectStatus: 'Rejected', label: 'Final Approval' },
  ],
  // Procurement / purchase approval
  procurement: [
    { status: 'Pending Approval', requiredRole: ['pm', 'admin'], nextStatus: 'PM Approved', rejectStatus: 'Rejected', label: 'PM Recommendation' },
    { status: 'PM Approved', requiredRole: ['owner', 'admin'], nextStatus: 'Owner Approved', rejectStatus: 'Rejected', label: 'Owner Approval' },
  ],
  // Grade dispute resolution
  grade_dispute: [
    { status: 'Pending', requiredRole: ['qc1', 'head1', 'admin'], nextStatus: 'UnderReview', rejectStatus: 'Rejected', label: 'Initial Review' },
    { status: 'UnderReview', requiredRole: ['pm', 'admin'], nextStatus: 'Resolved', rejectStatus: 'Overturned', label: 'PM Decision' },
    { status: 'Resolved', requiredRole: ['owner', 'admin'], nextStatus: 'Closed', rejectStatus: 'Reopened', label: 'Owner Confirmation' },
  ],
};

/**
 * Check if a role can perform an action on an approval step
 */
export function canApprove(role: string, entityType: string, currentStatus: string): { canAct: boolean; actions: string[] } {
  const chain = APPROVAL_CHAINS[entityType];
  if (!chain) return { canAct: false, actions: [] };

  const step = chain.find(s => s.status === currentStatus);
  if (!step) return { canAct: false, actions: [] };

  const canAct = step.requiredRole.includes(role) || role === 'owner' || role === 'admin';
  if (!canAct) return { canAct: false, actions: [] };

  return {
    canAct: true,
    actions: [`Approve → ${step.nextStatus}`, `Reject → ${step.rejectStatus}`],
  };
}

/**
 * Audit log visibility: who can see what
 * Based on transcription 6.4: Only Owner/Accountant see full trail; others see own changes only
 */
export function canViewFullAuditLog(role: string): boolean {
  return ['owner', 'admin', 'accountant'].includes(role);
}

/**
 * Data scope: filter data based on role's organizational scope
 * - supervisor1: only their factory
 * - ll1: only factories under their line leader
 * - head1: only factories under their head leader
 * - Others: all data
 */
export type DataScope = 'all' | 'own_factory' | 'own_territory_ll' | 'own_territory_hl';

export function getDataScope(role: string): DataScope {
  switch (role) {
    case 'supervisor1': return 'own_factory';
    case 'll1': return 'own_territory_ll';
    case 'head1': return 'own_territory_hl';
    default: return 'all';
  }
}

// Default export for convenience
export default ROLE_PERMISSIONS;