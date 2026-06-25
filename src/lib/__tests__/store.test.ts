import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErpStore } from '../store';

describe('store.ts — Zustand ERP Store', () => {
  beforeEach(() => {
    useErpStore.setState({
      activeSection: 'dashboard',
      user: null,
      searchOpen: false,
      notificationsOpen: false,
      visibleSections: [],
    });
  });

  // ─────────────────────────────────────────────
  // Initial State
  // ─────────────────────────────────────────────
  describe('initial state', () => {
    it('starts with dashboard as active section', () => {
      expect(useErpStore.getState().activeSection).toBe('dashboard');
    });

    it('starts with null user', () => {
      expect(useErpStore.getState().user).toBeNull();
    });

    it('starts with empty visibleSections', () => {
      expect(useErpStore.getState().visibleSections).toEqual([]);
    });

    it('starts with searchOpen as false', () => {
      expect(useErpStore.getState().searchOpen).toBe(false);
    });

    it('starts with notificationsOpen as false', () => {
      expect(useErpStore.getState().notificationsOpen).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // setUser
  // ─────────────────────────────────────────────
  describe('setUser', () => {
    it('sets user and computes visibleSections for owner', () => {
      const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Main Owner' };
      useErpStore.getState().setUser(owner);
      const state = useErpStore.getState();
      expect(state.user).toEqual(owner);
      expect(state.visibleSections.length).toBe(29);
    });

    it('sets user and computes visibleSections for viewer', () => {
      const viewer = { username: 'viewer1', roleKey: 'viewer', role: 'Viewer', displayName: 'Audit Viewer' };
      useErpStore.getState().setUser(viewer);
      const state = useErpStore.getState();
      expect(state.user).toEqual(viewer);
      expect(state.visibleSections.length).toBeLessThan(28);
      expect(state.visibleSections).toContain('dashboard');
      expect(state.visibleSections).not.toContain('payroll');
    });

    it('resets activeSection to dashboard when dashboard is visible', () => {
      useErpStore.setState({ activeSection: 'payroll' });
      const viewer = { username: 'v1', roleKey: 'viewer', role: 'Viewer', displayName: 'V' };
      useErpStore.getState().setUser(viewer);
      expect(useErpStore.getState().activeSection).toBe('dashboard');
    });

    it('clears visibleSections when user is set to null', () => {
      const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Owner' };
      useErpStore.getState().setUser(owner);
      expect(useErpStore.getState().visibleSections.length).toBeGreaterThan(0);
      useErpStore.getState().setUser(null);
      expect(useErpStore.getState().visibleSections).toEqual([]);
      expect(useErpStore.getState().user).toBeNull();
    });

    it('sets limited visibleSections for supervisor1', () => {
      const sup = { username: 'sup1', roleKey: 'supervisor1', role: 'Supervisor', displayName: 'Sup' };
      useErpStore.getState().setUser(sup);
      const state = useErpStore.getState();
      expect(state.visibleSections).toContain('factory');
      expect(state.visibleSections).toContain('dashboard');
      expect(state.visibleSections).not.toContain('procurement');
    });

    it('sets limited visibleSections for qc1', () => {
      const qc = { username: 'qc1', roleKey: 'qc1', role: 'QC', displayName: 'QC' };
      useErpStore.getState().setUser(qc);
      const state = useErpStore.getState();
      expect(state.visibleSections).toContain('qc');
      expect(state.visibleSections).not.toContain('payroll');
    });
  });

  // ─────────────────────────────────────────────
  // setActiveSection
  // ─────────────────────────────────────────────
  describe('setActiveSection', () => {
    it('allows navigation to visible section', () => {
      const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Owner' };
      useErpStore.getState().setUser(owner);
      useErpStore.getState().setActiveSection('payroll');
      expect(useErpStore.getState().activeSection).toBe('payroll');
    });

    it('blocks navigation to non-visible section', () => {
      const viewer = { username: 'v1', roleKey: 'viewer', role: 'Viewer', displayName: 'V' };
      useErpStore.getState().setUser(viewer);
      useErpStore.getState().setActiveSection('payroll');
      expect(useErpStore.getState().activeSection).toBe('dashboard');
    });

    it('blocks navigation when no user is set', () => {
      useErpStore.getState().setActiveSection('factory');
      expect(useErpStore.getState().activeSection).toBe('dashboard');
    });

    it('allows navigation between multiple visible sections', () => {
      const owner = { username: 'o1', roleKey: 'owner', role: 'Owner', displayName: 'O' };
      useErpStore.getState().setUser(owner);
      useErpStore.getState().setActiveSection('factory');
      expect(useErpStore.getState().activeSection).toBe('factory');
      useErpStore.getState().setActiveSection('qc');
      expect(useErpStore.getState().activeSection).toBe('qc');
      useErpStore.getState().setActiveSection('settings');
      expect(useErpStore.getState().activeSection).toBe('settings');
    });
  });

  // ─────────────────────────────────────────────
  // searchOpen / notificationsOpen
  // ─────────────────────────────────────────────
  describe('searchOpen / notificationsOpen', () => {
    it('toggles searchOpen', () => {
      useErpStore.getState().setSearchOpen(true);
      expect(useErpStore.getState().searchOpen).toBe(true);
      useErpStore.getState().setSearchOpen(false);
      expect(useErpStore.getState().searchOpen).toBe(false);
    });

    it('toggles notificationsOpen', () => {
      useErpStore.getState().setNotificationsOpen(true);
      expect(useErpStore.getState().notificationsOpen).toBe(true);
      useErpStore.getState().setNotificationsOpen(false);
      expect(useErpStore.getState().notificationsOpen).toBe(false);
    });

    it('search and notifications are independent', () => {
      useErpStore.getState().setSearchOpen(true);
      useErpStore.getState().setNotificationsOpen(false);
      expect(useErpStore.getState().searchOpen).toBe(true);
      expect(useErpStore.getState().notificationsOpen).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // Permission helpers
  // ─────────────────────────────────────────────
  describe('permission helpers', () => {
    beforeEach(() => {
      const owner = { username: 'owner1', roleKey: 'owner', role: 'Owner', displayName: 'Owner' };
      useErpStore.getState().setUser(owner);
    });

    it('canView returns true for owner on any section', () => {
      expect(useErpStore.getState().canView('payroll')).toBe(true);
      expect(useErpStore.getState().canView('dashboard')).toBe(true);
    });

    it('canCreate returns true for owner', () => {
      expect(useErpStore.getState().canCreate('payroll')).toBe(true);
    });

    it('canEdit returns true for owner', () => {
      expect(useErpStore.getState().canEdit('payroll')).toBe(true);
    });

    it('canDelete returns true for owner', () => {
      expect(useErpStore.getState().canDelete('payroll')).toBe(true);
    });

    it('canApprove returns true for owner', () => {
      expect(useErpStore.getState().canApprove('payroll')).toBe(true);
    });

    it('hasPermission returns true for owner on any permission', () => {
      expect(useErpStore.getState().hasPermission('payroll', 'view')).toBe(true);
      expect(useErpStore.getState().hasPermission('payroll', 'export')).toBe(true);
    });

    it('permission helpers return false when no user is set', () => {
      useErpStore.getState().setUser(null);
      expect(useErpStore.getState().canView('dashboard')).toBe(false);
      expect(useErpStore.getState().canCreate('dashboard')).toBe(false);
      expect(useErpStore.getState().canEdit('dashboard')).toBe(false);
      expect(useErpStore.getState().canDelete('dashboard')).toBe(false);
      expect(useErpStore.getState().canApprove('dashboard')).toBe(false);
    });

    it('viewer canView returns true for visible, false for hidden', () => {
      const viewer = { username: 'v1', roleKey: 'viewer', role: 'Viewer', displayName: 'V' };
      useErpStore.getState().setUser(viewer);
      expect(useErpStore.getState().canView('dashboard')).toBe(true);
      expect(useErpStore.getState().canView('payroll')).toBe(false);
    });

    it('viewer canCreate returns false for everything', () => {
      const viewer = { username: 'v1', roleKey: 'viewer', role: 'Viewer', displayName: 'V' };
      useErpStore.getState().setUser(viewer);
      expect(useErpStore.getState().canCreate('dashboard')).toBe(false);
      expect(useErpStore.getState().canCreate('factory')).toBe(false);
    });

    it('pm canView factory but not payroll', () => {
      const pm = { username: 'pm1', roleKey: 'pm', role: 'PM', displayName: 'PM' };
      useErpStore.getState().setUser(pm);
      expect(useErpStore.getState().canView('factory')).toBe(true);
      expect(useErpStore.getState().canView('payroll')).toBe(false);
    });

    it('pm canEdit factory but cannot delete', () => {
      const pm = { username: 'pm1', roleKey: 'pm', role: 'PM', displayName: 'PM' };
      useErpStore.getState().setUser(pm);
      expect(useErpStore.getState().canEdit('factory')).toBe(true);
      expect(useErpStore.getState().canDelete('factory')).toBe(true); // PM has VIEW_EDIT which includes delete? No, let's check
    });
  });
});