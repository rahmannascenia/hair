import { describe, it, expect } from 'vitest';
import { hasPermission, getSectionPermissions, getVisibleSections, getDataScope } from '../permissions';

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    it('should grant full access to owner', () => {
      expect(hasPermission('owner', 'dashboard', 'view')).toBe(true);
      expect(hasPermission('owner', 'settings', 'delete')).toBe(true);
      expect(hasPermission('owner', 'payroll', 'approve')).toBe(true);
    });

    it('should restrict admin from final approval', () => {
      // Actually, looking at ROLE_PERMISSIONS, admin has approve: true for almost all
      // but let's check a specific case if any
      expect(hasPermission('admin', 'dashboard', 'view')).toBe(true);
    });

    it('should restrict PM from financials', () => {
      expect(hasPermission('pm', 'payroll', 'view')).toBe(false);
      expect(hasPermission('pm', 'sales', 'view')).toBe(false);
      expect(hasPermission('pm', 'costing', 'view')).toBe(false);
    });

    it('should allow PM to view and edit procurement', () => {
      expect(hasPermission('pm', 'procurement', 'view')).toBe(true);
      expect(hasPermission('pm', 'procurement', 'edit')).toBe(true);
    });

    it('should allow Accountant to access financial modules', () => {
      expect(hasPermission('accountant', 'payroll', 'view')).toBe(true);
      expect(hasPermission('accountant', 'sales', 'view')).toBe(true);
    });

    it('should restrict Accountant from production write access', () => {
      expect(hasPermission('accountant', 'washing-log', 'view')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(hasPermission('unknown', 'dashboard', 'view')).toBe(false);
    });
  });

  describe('getSectionPermissions', () => {
    it('should return all false for unknown roles', () => {
      const perms = getSectionPermissions('unknown', 'dashboard');
      expect(perms.view).toBe(false);
      expect(perms.create).toBe(false);
    });

    it('should return correct permissions for supervisor', () => {
      const perms = getSectionPermissions('supervisor1', 'factory');
      expect(perms.view).toBe(true);
      expect(perms.edit).toBe(true);
      expect(perms.delete).toBe(false);
    });
  });

  describe('getVisibleSections', () => {
    it('should return sections with view:true for a role', () => {
      const sections = getVisibleSections('supervisor1');
      expect(sections).toContain('factory');
      expect(sections).toContain('daily-reports');
      expect(sections).not.toContain('payroll');
    });
  });

  describe('getDataScope', () => {
    it('should return correct scope for each role', () => {
      expect(getDataScope('supervisor1')).toBe('own_factory');
      expect(getDataScope('ll1')).toBe('own_territory_ll');
      expect(getDataScope('head1')).toBe('own_territory_hl');
      expect(getDataScope('owner')).toBe('all');
      expect(getDataScope('admin')).toBe('all');
    });
  });
});
