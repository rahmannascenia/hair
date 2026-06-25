/**
 * Integration Tests: Audit + Permissions Cross-Module
 *
 * Tests that the audit system and permission system work together correctly:
 * - checkPermission correctly delegates to hasPermission
 * - Audit visibility respects role hierarchy
 * - Actor extraction from requests works in permission context
 */

import { describe, it, expect, vi } from 'vitest';
import { checkPermission, canViewAuditEntry, getActorFromRequest, getChangedFields } from '../lib/audit';
import { canViewFullAuditLog, hasPermission, getDataScope, getVisibleSections } from '../lib/permissions';
import { useErpStore } from '../lib/store';

describe('Integration: Audit + Permissions Cross-Module', () => {
  // ─────────────────────────────────────────────
  // checkPermission delegates correctly to hasPermission
  // ─────────────────────────────────────────────
  describe('checkPermission ↔ hasPermission consistency', () => {
    const testCases = [
      { role: 'owner', section: 'payroll', perm: 'delete' as const, expected: true },
      { role: 'viewer', section: 'payroll', perm: 'view' as const, expected: false },
      { role: 'pm', section: 'factory', perm: 'edit' as const, expected: true },
      { role: 'pm', section: 'sales', perm: 'view' as const, expected: false },
      { role: 'accountant', section: 'costing', perm: 'create' as const, expected: true },
      { role: 'accountant', section: 'factory', perm: 'create' as const, expected: false },
      { role: 'supervisor1', section: 'factory', perm: 'edit' as const, expected: true },
      { role: 'supervisor1', section: 'procurement', perm: 'view' as const, expected: false },
      { role: 'qc1', section: 'qc', perm: 'create' as const, expected: true },
      { role: 'qc1', section: 'payroll', perm: 'view' as const, expected: false },
    ];

    it.each(testCases)('checkPermission($role, $section, $perm) → allowed=$expected', ({ role, section, perm, expected }) => {
      const result = checkPermission(role, section, perm);
      expect(result.allowed).toBe(expected);
      // Verify it matches hasPermission directly
      expect(hasPermission(role, section, perm)).toBe(expected);
    });

    it('checkPermission returns error message when denied, undefined when allowed', () => {
      for (const { role, section, perm, expected } of testCases) {
        const result = checkPermission(role, section, perm);
        if (expected) {
          expect(result.error).toBeUndefined();
        } else {
          expect(result.error).toBeDefined();
          expect(result.error).toContain(role);
          expect(result.error).toContain(perm);
          expect(result.error).toContain(section);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // Audit visibility + Permission consistency
  // ─────────────────────────────────────────────
  describe('audit visibility ↔ permission consistency', () => {
    it('roles that can view audit-log section include full-audit roles', () => {
      const allRoles = ['owner', 'admin', 'pm', 'accountant', 'head1', 'supervisor1', 'll1', 'qc1', 'viewer'] as const;

      for (const role of allRoles) {
        const canViewSection = hasPermission(role, 'audit-log', 'view');
        const canViewFull = canViewFullAuditLog(role);

        if (canViewFull) {
          // Full audit access implies section view access
          expect(canViewSection).toBe(true);
        }
        // But section view doesn't imply full access (pm/supervisor can view section but only own entries)
      }
    });

    it('viewer cannot view audit-log section at all', () => {
      expect(hasPermission('viewer', 'audit-log', 'view')).toBe(false);
      expect(canViewFullAuditLog('viewer')).toBe(false);
    });

    it('canViewAuditEntry is consistent with canViewFullAuditLog', () => {
      const roles = ['owner', 'admin', 'accountant', 'pm', 'supervisor1', 'll1', 'viewer'] as const;

      for (const role of roles) {
        const canViewFull = canViewFullAuditLog(role);

        // Full access roles can view any entry
        if (canViewFull) {
          expect(canViewAuditEntry(role, 'anyone', 'anyone')).toBe(true);
          expect(canViewAuditEntry(role, 'other_user', 'my_user')).toBe(true);
        } else {
          // Restricted roles can only view own entries
          expect(canViewAuditEntry(role, 'other_user', 'my_user')).toBe(false);
          expect(canViewAuditEntry(role, 'my_user', 'my_user')).toBe(true);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // getActorFromRequest + checkPermission flow
  // ─────────────────────────────────────────────
  describe('getActorFromRequest + checkPermission flow', () => {
    it('full auth flow: extract actor, check permission, determine audit visibility', () => {
      // Simulate a request from a PM
      const request = new Request('http://localhost/api/workers', {
        headers: { 'x-erp-role': 'pm', 'x-erp-user': 'pm_user1' },
      });

      const actor = getActorFromRequest(request);
      expect(actor).toBe('pm_user1');

      const permCheck = checkPermission('pm', 'factory', 'view');
      expect(permCheck.allowed).toBe(true);

      // PM cannot view full audit
      expect(canViewFullAuditLog('pm')).toBe(false);
      // But can see own entries
      expect(canViewAuditEntry('pm', 'pm_user1', 'pm_user1')).toBe(true);
      expect(canViewAuditEntry('pm', 'other_user', 'pm_user1')).toBe(false);
    });

    it('unauthenticated request flow', () => {
      const request = new Request('http://localhost/api/workers');
      const actor = getActorFromRequest(request);
      expect(actor).toBe('anonymous');

      const permCheck = checkPermission('', 'dashboard', 'view');
      expect(permCheck.allowed).toBe(false);
      expect(permCheck.error).toBe('Authentication required');
    });
  });

  // ─────────────────────────────────────────────
  // getChangedFields + audit logging scenarios
  // ─────────────────────────────────────────────
  describe('getChangedFields audit scenarios', () => {
    it('worker salary update: only salary field is logged', () => {
      const oldWorker = { name: 'Rahim', baseSalary: 5000, bKash: '0171...' };
      const newWorker = { name: 'Rahim', baseSalary: 5500, bKash: '0171...' };
      const { oldValues, newValues } = getChangedFields(oldWorker, newWorker);
      expect(Object.keys(oldValues)).toEqual(['baseSalary']);
      expect(oldValues.baseSalary).toBe(5000);
      expect(newValues.baseSalary).toBe(5500);
    });

    it('lot status progression: only status changes', () => {
      const oldLot = { lotId: 'LOT-001', status: 'In Washing', grade: 'A' };
      const newLot = { lotId: 'LOT-001', status: 'Washing Complete', grade: 'A' };
      const { oldValues, newValues } = getChangedFields(oldLot, newLot);
      expect(oldValues).toEqual({ status: 'In Washing' });
      expect(newValues).toEqual({ status: 'Washing Complete' });
    });

    it('procurement approval: status + approvedBy + approvedAt', () => {
      const oldProc = { id: '1', status: 'Pending Approval', totalCost: 50000 };
      const newProc = { id: '1', status: 'PM Approved', totalCost: 50000, approvedBy: 'pm_user', approvedAt: '2025-01-01' };
      const { oldValues, newValues } = getChangedFields(oldProc, newProc);
      expect(oldValues).toEqual({ status: 'Pending Approval', approvedBy: undefined, approvedAt: undefined });
      expect(newValues.status).toBe('PM Approved');
    });
  });
});

describe('Integration: Store + Permissions End-to-End', () => {
  beforeEach(() => {
    useErpStore.setState({
      activeSection: 'dashboard',
      user: null,
      searchOpen: false,
      notificationsOpen: false,
      visibleSections: [],
    });
  });

  /**
   * Simulate the full login → navigate → permission check flow
   */
  it('owner login → navigate to payroll → check all permissions', () => {
    // 1. Login (setUser)
    const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Owner' };
    useErpStore.getState().setUser(owner);

    // 2. Navigate to payroll
    useErpStore.getState().setActiveSection('payroll');
    expect(useErpStore.getState().activeSection).toBe('payroll');

    // 3. Check all permissions via store helpers
    const store = useErpStore.getState();
    expect(store.canView('payroll')).toBe(true);
    expect(store.canCreate('payroll')).toBe(true);
    expect(store.canEdit('payroll')).toBe(true);
    expect(store.canDelete('payroll')).toBe(true);
    expect(store.canApprove('payroll')).toBe(true);
  });

  it('viewer login → cannot navigate to payroll → only view permissions', () => {
    // 1. Login
    const viewer = { username: 'viewer1', roleKey: 'viewer', role: 'Viewer', displayName: 'Viewer' };
    useErpStore.getState().setUser(viewer);

    // 2. Try to navigate to payroll (should be blocked)
    useErpStore.getState().setActiveSection('payroll');
    expect(useErpStore.getState().activeSection).toBe('dashboard'); // stays at dashboard

    // 3. Verify limited permissions on dashboard
    const store = useErpStore.getState();
    expect(store.canView('dashboard')).toBe(true);
    expect(store.canCreate('dashboard')).toBe(false);
    expect(store.canEdit('dashboard')).toBe(false);
    expect(store.canDelete('dashboard')).toBe(false);
  });

  it('supervisor login → limited sections → factory access only', () => {
    const sup = { username: 'sup1', roleKey: 'supervisor1', role: 'Supervisor', displayName: 'Sup' };
    useErpStore.getState().setUser(sup);

    // Can navigate to factory
    useErpStore.getState().setActiveSection('factory');
    expect(useErpStore.getState().activeSection).toBe('factory');
    expect(useErpStore.getState().canView('factory')).toBe(true);
    expect(useErpStore.getState().canEdit('factory')).toBe(true);

    // Cannot navigate to procurement
    useErpStore.getState().setActiveSection('procurement');
    expect(useErpStore.getState().activeSection).toBe('factory'); // blocked, stays at factory
  });

  it('role switch: logout → login as different role → permissions update', () => {
    // Login as owner
    const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Owner' };
    useErpStore.getState().setUser(owner);
    expect(useErpStore.getState().canView('payroll')).toBe(true);
    expect(useErpStore.getState().visibleSections.length).toBe(29);

    // Logout
    useErpStore.getState().setUser(null);
    expect(useErpStore.getState().canView('payroll')).toBe(false);
    expect(useErpStore.getState().visibleSections).toEqual([]);

    // Login as viewer
    const viewer = { username: 'v1', roleKey: 'viewer', role: 'Viewer', displayName: 'V' };
    useErpStore.getState().setUser(viewer);
    expect(useErpStore.getState().canView('payroll')).toBe(false);
    expect(useErpStore.getState().canView('dashboard')).toBe(true);
    expect(useErpStore.getState().visibleSections.length).toBeLessThan(29);
  });

  it('all sections in visibleSections have view permission', () => {
    for (const role of ['owner', 'admin', 'pm', 'accountant', 'viewer', 'supervisor1', 'll1', 'head1', 'qc1'] as const) {
      const user = { username: `${role}_test`, roleKey: role, role: role, displayName: role };
      useErpStore.getState().setUser(user);
      const { visibleSections } = useErpStore.getState();

      for (const section of visibleSections) {
        expect(useErpStore.getState().canView(section)).toBe(true);
      }
    }
  });
});

describe('Integration: Data Scope + Permission Alignment', () => {
  it('roles with restricted data scope have fewer sections', () => {
    const allScope = getDataScope('owner');
    expect(allScope).toBe('all');

    const supScope = getDataScope('supervisor1');
    expect(supScope).toBe('own_factory');

    // Supervisor should see fewer sections than owner
    const supVisible = getVisibleSections('supervisor1').length;
    const ownerVisible = getVisibleSections('owner').length;
    expect(supVisible).toBeLessThan(ownerVisible);
  });

  it('data scope roles cannot access cross-territory sections', () => {
    // supervisor1: own_factory only — should NOT have access to organization, suppliers, etc.
    expect(hasPermission('supervisor1', 'organization', 'view')).toBe(false);
    expect(hasPermission('supervisor1', 'suppliers', 'view')).toBe(false);

    // ll1: own_territory_ll — similar restrictions
    expect(hasPermission('ll1', 'procurement', 'view')).toBe(false);
    expect(hasPermission('ll1', 'suppliers', 'view')).toBe(false);
  });

  it('roles with "all" data scope can access broad sections', () => {
    const allScopeRoles = ['owner', 'admin', 'pm', 'accountant', 'qc1', 'viewer'];
    for (const role of allScopeRoles) {
      expect(getDataScope(role)).toBe('all');
    }
  });
});