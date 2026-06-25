import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getSectionPermissions,
  getVisibleSections,
  canApprove,
  canViewFullAuditLog,
  getDataScope,
  APPROVAL_CHAINS,
  type SectionKey,
  type Permission,
} from '../permissions';

describe('permissions.ts', () => {
  // ─────────────────────────────────────────────
  // hasPermission
  // ─────────────────────────────────────────────
  describe('hasPermission', () => {
    it('returns true for owner with full access', () => {
      expect(hasPermission('owner', 'payroll', 'view')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'create')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'edit')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'delete')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'approve')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'export')).toBe(true);
    });

    it('returns false for viewer with create permission', () => {
      expect(hasPermission('viewer', 'dashboard', 'create')).toBe(false);
      expect(hasPermission('viewer', 'dashboard', 'edit')).toBe(false);
      expect(hasPermission('viewer', 'dashboard', 'delete')).toBe(false);
    });

    it('returns true for viewer with view permission on dashboard', () => {
      expect(hasPermission('viewer', 'dashboard', 'view')).toBe(true);
    });

    it('returns false for viewer on payroll (no access)', () => {
      expect(hasPermission('viewer', 'payroll', 'view')).toBe(false);
      expect(hasPermission('viewer', 'payroll', 'export')).toBe(false);
    });

    it('returns false for unknown role', () => {
      expect(hasPermission('unknown_role', 'dashboard', 'view')).toBe(false);
    });

    it('returns false for unknown section', () => {
      expect(hasPermission('owner', 'nonexistent_section' as SectionKey, 'view')).toBe(false);
    });

    it('enforces PM restrictions — no payroll access', () => {
      expect(hasPermission('pm', 'payroll', 'view')).toBe(false);
      expect(hasPermission('pm', 'payroll', 'create')).toBe(false);
    });

    it('enforces PM restrictions — no financials access', () => {
      expect(hasPermission('pm', 'sales', 'view')).toBe(false);
      expect(hasPermission('pm', 'costing', 'view')).toBe(false);
      expect(hasPermission('pm', 'size-pricing', 'view')).toBe(false);
    });

    it('allows PM production-related access', () => {
      expect(hasPermission('pm', 'factory', 'view')).toBe(true);
      expect(hasPermission('pm', 'factory', 'edit')).toBe(true);
      expect(hasPermission('pm', 'phase1', 'view')).toBe(true);
      expect(hasPermission('pm', 'phase1', 'edit')).toBe(true);
      expect(hasPermission('pm', 'lot-master', 'view')).toBe(true);
      expect(hasPermission('pm', 'lot-master', 'create')).toBe(true);
    });

    it('enforces accountant restrictions — no production data modification', () => {
      expect(hasPermission('accountant', 'factory', 'edit')).toBe(false);
      expect(hasPermission('accountant', 'factory', 'create')).toBe(false);
      expect(hasPermission('accountant', 'phase1', 'view')).toBe(false);
    });

    it('allows accountant financial access', () => {
      expect(hasPermission('accountant', 'payroll', 'view')).toBe(true);
      expect(hasPermission('accountant', 'payroll', 'create')).toBe(true);
      expect(hasPermission('accountant', 'sales', 'view')).toBe(true);
      expect(hasPermission('accountant', 'sales', 'create')).toBe(true);
      expect(hasPermission('accountant', 'costing', 'view')).toBe(true);
      expect(hasPermission('accountant', 'costing', 'edit')).toBe(true);
    });

    it('enforces supervisor1 factory-only access', () => {
      expect(hasPermission('supervisor1', 'factory', 'view')).toBe(true);
      expect(hasPermission('supervisor1', 'factory', 'edit')).toBe(true);
      expect(hasPermission('supervisor1', 'procurement', 'view')).toBe(false);
      expect(hasPermission('supervisor1', 'payroll', 'view')).toBe(false);
    });

    it('enforces ll1 territory-only access', () => {
      expect(hasPermission('ll1', 'daily-reports', 'view')).toBe(true);
      expect(hasPermission('ll1', 'daily-reports', 'edit')).toBe(false);
      expect(hasPermission('ll1', 'procurement', 'view')).toBe(false);
      expect(hasPermission('ll1', 'payroll', 'view')).toBe(false);
    });

    it('enforces head1 territory-only access', () => {
      expect(hasPermission('head1', 'factory', 'view')).toBe(true);
      expect(hasPermission('head1', 'factory', 'edit')).toBe(false);
      expect(hasPermission('head1', 'procurement', 'view')).toBe(false);
      expect(hasPermission('head1', 'payroll', 'view')).toBe(true);
    });

    it('enforces qc1 grading-focused access', () => {
      expect(hasPermission('qc1', 'qc', 'view')).toBe(true);
      expect(hasPermission('qc1', 'qc', 'create')).toBe(true);
      expect(hasPermission('qc1', 'qc', 'edit')).toBe(true);
      expect(hasPermission('qc1', 'payroll', 'view')).toBe(false);
      expect(hasPermission('qc1', 'sales', 'view')).toBe(false);
    });

    it('allows admin near-full access', () => {
      expect(hasPermission('admin', 'payroll', 'view')).toBe(true);
      expect(hasPermission('admin', 'payroll', 'edit')).toBe(true);
      expect(hasPermission('admin', 'factory', 'create')).toBe(true);
      expect(hasPermission('admin', 'sales', 'create')).toBe(true);
    });

    it('allows viewer export on accessible sections', () => {
      expect(hasPermission('viewer', 'dashboard', 'export')).toBe(true);
      expect(hasPermission('viewer', 'procurement', 'export')).toBe(true);
      expect(hasPermission('viewer', 'qc', 'export')).toBe(true);
    });

    it('blocks viewer export on sensitive sections', () => {
      expect(hasPermission('viewer', 'sales', 'export')).toBe(false);
      expect(hasPermission('viewer', 'payroll', 'export')).toBe(false);
    });

    it('owner has all 29 sections with full permissions', () => {
      const sections: SectionKey[] = [
        'dashboard', 'procurement', 'suppliers', 'lot-master', 'lot-tracker',
        'inventory', 'washing-log', 'phase1', 'organization', 'factory',
        'qc', 'payroll', 'phase2', 'size-pricing', 'sales', 'costing',
        'kpi', 'risks', 'settings', 'approval-workflow', 'audit-log',
        'grade-dispute', 'rejection-investigation', 'worker-profile',
        'daily-reports', 'leaderboard', 'hierarchy', 'lc-management', 'consumables',
      ];
      const permissions: Permission[] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
      for (const section of sections) {
        for (const perm of permissions) {
          expect(hasPermission('owner', section, perm)).toBe(true);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // getSectionPermissions
  // ─────────────────────────────────────────────
  describe('getSectionPermissions', () => {
    it('returns FULL for owner on any section', () => {
      const perms = getSectionPermissions('owner', 'payroll');
      expect(perms).toEqual({
        view: true, create: true, edit: true, delete: true, approve: true, export: true,
      });
    });

    it('returns NO_ACCESS for unknown role', () => {
      const perms = getSectionPermissions('unknown', 'dashboard');
      expect(perms).toEqual({
        view: false, create: false, edit: false, delete: false, approve: false, export: false,
      });
    });

    it('returns VIEW_ONLY for viewer on accessible sections', () => {
      const perms = getSectionPermissions('viewer', 'dashboard');
      expect(perms).toEqual({
        view: true, create: false, edit: false, delete: false, approve: false, export: true,
      });
    });

    it('returns correct permissions for PM on lot-master', () => {
      const perms = getSectionPermissions('pm', 'lot-master');
      expect(perms.view).toBe(true);
      expect(perms.create).toBe(true);
      expect(perms.edit).toBe(true);
      expect(perms.delete).toBe(true);
      expect(perms.approve).toBe(true);
      expect(perms.export).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // getVisibleSections
  // ─────────────────────────────────────────────
  describe('getVisibleSections', () => {
    it('returns all 29 sections for owner', () => {
      const visible = getVisibleSections('owner');
      expect(visible).toHaveLength(29);
    });

    it('returns fewer sections for supervisor1', () => {
      const visible = getVisibleSections('supervisor1');
      expect(visible.length).toBeLessThan(28);
      expect(visible).toContain('factory');
      expect(visible).toContain('dashboard');
    });

    it('excludes payroll from viewer visible sections', () => {
      const visible = getVisibleSections('viewer');
      expect(visible).not.toContain('payroll');
    });

    it('excludes sales and costing from viewer visible sections', () => {
      const visible = getVisibleSections('viewer');
      expect(visible).not.toContain('sales');
      expect(visible).not.toContain('costing');
    });

    it('returns empty array for unknown role', () => {
      const visible = getVisibleSections('unknown_role');
      expect(visible).toEqual([]);
    });

    it('includes qc for qc1 role', () => {
      const visible = getVisibleSections('qc1');
      expect(visible).toContain('qc');
    });

    it('excludes financial sections for qc1', () => {
      const visible = getVisibleSections('qc1');
      expect(visible).not.toContain('payroll');
      expect(visible).not.toContain('sales');
      expect(visible).not.toContain('costing');
    });

    it('PM can see grade-dispute and approval-workflow', () => {
      const visible = getVisibleSections('pm');
      expect(visible).toContain('grade-dispute');
      expect(visible).toContain('approval-workflow');
    });
  });

  // ─────────────────────────────────────────────
  // APPROVAL_CHAINS
  // ─────────────────────────────────────────────
  describe('APPROVAL_CHAINS', () => {
    it('has daily_entry chain with 4 steps', () => {
      expect(APPROVAL_CHAINS.daily_entry).toHaveLength(4);
      expect(APPROVAL_CHAINS.daily_entry[0].status).toBe('Pending Approval');
      expect(APPROVAL_CHAINS.daily_entry[3].status).toBe('PM Approved');
    });

    it('has procurement chain with 2 steps', () => {
      expect(APPROVAL_CHAINS.procurement).toHaveLength(2);
      expect(APPROVAL_CHAINS.procurement[0].requiredRole).toEqual(['pm', 'admin']);
      expect(APPROVAL_CHAINS.procurement[1].requiredRole).toEqual(['owner', 'admin']);
    });

    it('has grade_dispute chain with 3 steps', () => {
      expect(APPROVAL_CHAINS.grade_dispute).toHaveLength(3);
      expect(APPROVAL_CHAINS.grade_dispute[0].status).toBe('Pending');
      expect(APPROVAL_CHAINS.grade_dispute[2].nextStatus).toBe('Closed');
    });

    it('each step has required fields', () => {
      for (const [, chain] of Object.entries(APPROVAL_CHAINS)) {
        for (const step of chain) {
          expect(step).toHaveProperty('status');
          expect(step).toHaveProperty('requiredRole');
          expect(step).toHaveProperty('nextStatus');
          expect(step).toHaveProperty('rejectStatus');
          expect(step).toHaveProperty('label');
          expect(Array.isArray(step.requiredRole)).toBe(true);
          expect(step.requiredRole.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // canApprove
  // ─────────────────────────────────────────────
  describe('canApprove', () => {
    it('owner can always approve any step', () => {
      const result = canApprove('owner', 'daily_entry', 'Pending Approval');
      expect(result.canAct).toBe(true);
    });

    it('admin can always approve any step', () => {
      const result = canApprove('admin', 'daily_entry', 'Pending Approval');
      expect(result.canAct).toBe(true);
    });

    it('supervisor1 can approve first step of daily_entry', () => {
      const result = canApprove('supervisor1', 'daily_entry', 'Pending Approval');
      expect(result.canAct).toBe(true);
      expect(result.actions).toContain('Approve → LL Reviewed');
      expect(result.actions).toContain('Reject → Rejected');
    });

    it('supervisor1 cannot approve second step of daily_entry', () => {
      const result = canApprove('supervisor1', 'daily_entry', 'LL Reviewed');
      expect(result.canAct).toBe(false);
      expect(result.actions).toEqual([]);
    });

    it('head1 can approve second step of daily_entry', () => {
      const result = canApprove('head1', 'daily_entry', 'LL Reviewed');
      expect(result.canAct).toBe(true);
      expect(result.actions).toContain('Approve → HL Reviewed');
    });

    it('pm can approve third step of daily_entry', () => {
      const result = canApprove('pm', 'daily_entry', 'HL Reviewed');
      expect(result.canAct).toBe(true);
      expect(result.actions).toContain('Approve → PM Approved');
    });

    it('returns false for unknown entity type', () => {
      const result = canApprove('owner', 'unknown_entity', 'some_status');
      expect(result.canAct).toBe(false);
    });

    it('returns false for unknown status', () => {
      const result = canApprove('owner', 'daily_entry', 'unknown_status');
      expect(result.canAct).toBe(false);
    });

    it('pm can initiate procurement approval', () => {
      const result = canApprove('pm', 'procurement', 'Pending Approval');
      expect(result.canAct).toBe(true);
      expect(result.actions).toContain('Approve → PM Approved');
    });

    it('viewer cannot approve anything', () => {
      expect(canApprove('viewer', 'daily_entry', 'Pending Approval').canAct).toBe(false);
      expect(canApprove('viewer', 'procurement', 'Pending Approval').canAct).toBe(false);
    });

    it('qc1 can initiate grade dispute review', () => {
      const result = canApprove('qc1', 'grade_dispute', 'Pending');
      expect(result.canAct).toBe(true);
    });

    it('qc1 cannot resolve grade dispute (needs pm/owner)', () => {
      const result = canApprove('qc1', 'grade_dispute', 'UnderReview');
      expect(result.canAct).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // canViewFullAuditLog
  // ─────────────────────────────────────────────
  describe('canViewFullAuditLog', () => {
    it('owner can view full audit log', () => {
      expect(canViewFullAuditLog('owner')).toBe(true);
    });

    it('admin can view full audit log', () => {
      expect(canViewFullAuditLog('admin')).toBe(true);
    });

    it('accountant can view full audit log', () => {
      expect(canViewFullAuditLog('accountant')).toBe(true);
    });

    it('pm cannot view full audit log', () => {
      expect(canViewFullAuditLog('pm')).toBe(false);
    });

    it('supervisor1 cannot view full audit log', () => {
      expect(canViewFullAuditLog('supervisor1')).toBe(false);
    });

    it('viewer cannot view full audit log', () => {
      expect(canViewFullAuditLog('viewer')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // getDataScope
  // ─────────────────────────────────────────────
  describe('getDataScope', () => {
    it('returns "all" for owner', () => {
      expect(getDataScope('owner')).toBe('all');
    });

    it('returns "all" for admin', () => {
      expect(getDataScope('admin')).toBe('all');
    });

    it('returns "all" for pm', () => {
      expect(getDataScope('pm')).toBe('all');
    });

    it('returns "all" for accountant', () => {
      expect(getDataScope('accountant')).toBe('all');
    });

    it('returns "own_factory" for supervisor1', () => {
      expect(getDataScope('supervisor1')).toBe('own_factory');
    });

    it('returns "own_territory_ll" for ll1', () => {
      expect(getDataScope('ll1')).toBe('own_territory_ll');
    });

    it('returns "own_territory_hl" for head1', () => {
      expect(getDataScope('head1')).toBe('own_territory_hl');
    });

    it('returns "all" for qc1', () => {
      expect(getDataScope('qc1')).toBe('all');
    });

    it('returns "all" for viewer', () => {
      expect(getDataScope('viewer')).toBe('all');
    });
  });
});