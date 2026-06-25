import { describe, it, expect } from 'vitest';
import {
  getChangedFields,
  canViewAuditEntry,
  getActorFromRequest,
  checkPermission,
} from '../audit';

describe('audit.ts', () => {
  // ─────────────────────────────────────────────
  // getChangedFields
  // ─────────────────────────────────────────────
  describe('getChangedFields', () => {
    it('returns empty objects when values are identical', () => {
      const old = { name: 'John', age: 30 };
      const newVal = { name: 'John', age: 30 };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({});
      expect(result.newValues).toEqual({});
    });

    it('detects single field change', () => {
      const old = { name: 'John', age: 30 };
      const newVal = { name: 'Jane', age: 30 };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ name: 'John' });
      expect(result.newValues).toEqual({ name: 'Jane' });
    });

    it('detects multiple field changes', () => {
      const old = { name: 'John', age: 30, city: 'NYC' };
      const newVal = { name: 'Jane', age: 31, city: 'LA' };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ name: 'John', age: 30, city: 'NYC' });
      expect(result.newValues).toEqual({ name: 'Jane', age: 31, city: 'LA' });
    });

    it('handles new fields added in newValues', () => {
      const old = { name: 'John' };
      const newVal = { name: 'John', email: 'john@test.com' };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ email: undefined });
      expect(result.newValues).toEqual({ email: 'john@test.com' });
    });

    it('ignores fields in oldValues not present in newValues', () => {
      const old = { name: 'John', deleted: true };
      const newVal = { name: 'John' };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({});
      expect(result.newValues).toEqual({});
    });

    it('handles numeric value changes', () => {
      const old = { price: 100, qty: 5 };
      const newVal = { price: 150, qty: 5 };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ price: 100 });
      expect(result.newValues).toEqual({ price: 150 });
    });

    it('handles null/undefined changes', () => {
      const old = { notes: null };
      const newVal = { notes: 'some note' };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ notes: null });
      expect(result.newValues).toEqual({ notes: 'some note' });
    });

    it('handles array value changes', () => {
      const old = { tags: ['a', 'b'] };
      const newVal = { tags: ['a', 'c'] };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ tags: ['a', 'b'] });
      expect(result.newValues).toEqual({ tags: ['a', 'c'] });
    });

    it('handles empty objects', () => {
      const result = getChangedFields({}, {});
      expect(result.oldValues).toEqual({});
      expect(result.newValues).toEqual({});
    });

    it('handles deeply nested objects with JSON comparison', () => {
      const old = { config: { nested: true, value: 1 } };
      const newVal = { config: { nested: true, value: 2 } };
      const result = getChangedFields(old, newVal);
      expect(result.oldValues).toEqual({ config: { nested: true, value: 1 } });
      expect(result.newValues).toEqual({ config: { nested: true, value: 2 } });
    });
  });

  // ─────────────────────────────────────────────
  // canViewAuditEntry
  // ─────────────────────────────────────────────
  describe('canViewAuditEntry', () => {
    it('owner can view any audit entry', () => {
      expect(canViewAuditEntry('owner', 'some_user', 'owner_user')).toBe(true);
    });

    it('admin can view any audit entry', () => {
      expect(canViewAuditEntry('admin', 'some_user', 'admin_user')).toBe(true);
    });

    it('accountant can view any audit entry', () => {
      expect(canViewAuditEntry('accountant', 'some_user', 'accountant_user')).toBe(true);
    });

    it('pm can only view their own entries', () => {
      expect(canViewAuditEntry('pm', 'pm_user', 'pm_user')).toBe(true);
      expect(canViewAuditEntry('pm', 'other_user', 'pm_user')).toBe(false);
    });

    it('supervisor can only view their own entries', () => {
      expect(canViewAuditEntry('supervisor1', 'sup_user', 'sup_user')).toBe(true);
      expect(canViewAuditEntry('supervisor1', 'other_user', 'sup_user')).toBe(false);
    });

    it('returns true when performedBy matches requestUsername', () => {
      expect(canViewAuditEntry('viewer', 'user1', 'user1')).toBe(true);
    });

    it('returns false when performedBy does not match', () => {
      expect(canViewAuditEntry('viewer', 'user1', 'user2')).toBe(false);
    });

    it('handles undefined performedBy for non-privileged role', () => {
      expect(canViewAuditEntry('viewer', undefined, 'user1')).toBe(false);
    });

    it('owner can view even undefined performedBy', () => {
      expect(canViewAuditEntry('owner', undefined, 'owner_user')).toBe(true);
    });

    it('ll1 can only view own entries', () => {
      expect(canViewAuditEntry('ll1', 'll_user', 'll_user')).toBe(true);
      expect(canViewAuditEntry('ll1', 'other', 'll_user')).toBe(false);
    });

    it('head1 can only view own entries', () => {
      expect(canViewAuditEntry('head1', 'hl_user', 'hl_user')).toBe(true);
      expect(canViewAuditEntry('head1', 'other', 'hl_user')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // getActorFromRequest
  // ─────────────────────────────────────────────
  describe('getActorFromRequest', () => {
    it('extracts username from x-erp-user header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-erp-user': 'testuser' },
      });
      expect(getActorFromRequest(request)).toBe('testuser');
    });

    it('returns "anonymous" when no x-erp-user header', () => {
      const request = new Request('http://localhost');
      expect(getActorFromRequest(request)).toBe('anonymous');
    });

    it('returns "anonymous" for empty string header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-erp-user': '' },
      });
      expect(getActorFromRequest(request)).toBe('anonymous');
    });
  });

  // ─────────────────────────────────────────────
  // checkPermission
  // ─────────────────────────────────────────────
  describe('checkPermission', () => {
    it('returns allowed:true for valid permission', () => {
      const result = checkPermission('owner', 'dashboard', 'view');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns allowed:false for missing role', () => {
      const result = checkPermission('', 'dashboard', 'view');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('returns allowed:false for anonymous role', () => {
      const result = checkPermission('anonymous', 'dashboard', 'view');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('returns allowed:false with descriptive error for insufficient permission', () => {
      const result = checkPermission('viewer', 'payroll', 'create');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("'viewer'");
      expect(result.error).toContain("'create'");
      expect(result.error).toContain("'payroll'");
    });

    it('allows pm to view factory', () => {
      const result = checkPermission('pm', 'factory', 'view');
      expect(result.allowed).toBe(true);
    });

    it('blocks pm from viewing payroll', () => {
      const result = checkPermission('pm', 'payroll', 'view');
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('blocks supervisor from creating procurement', () => {
      const result = checkPermission('supervisor1', 'procurement', 'create');
      expect(result.allowed).toBe(false);
    });

    it('allows accountant to edit sales', () => {
      const result = checkPermission('accountant', 'sales', 'edit');
      expect(result.allowed).toBe(true);
    });

    it('blocks accountant from editing factory', () => {
      const result = checkPermission('accountant', 'factory', 'edit');
      expect(result.allowed).toBe(false);
    });

    it('error message includes all three details', () => {
      const result = checkPermission('qc1', 'payroll', 'delete');
      expect(result.error).toMatch(/Role.*qc1.*does not have.*delete.*permission.*payroll/i);
    });
  });
});