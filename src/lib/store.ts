import { create } from 'zustand';
import { getVisibleSections, hasPermission, type SectionKey, type Permission } from './permissions';

export interface ErpUser {
  username: string;
  roleKey: string;
  role: string;
  displayName: string;
}

interface ErpStore {
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: ErpUser | null;
  setUser: (user: ErpUser | null) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  visibleSections: SectionKey[];
  canView: (section: SectionKey) => boolean;
  canCreate: (section: SectionKey) => boolean;
  canEdit: (section: SectionKey) => boolean;
  canDelete: (section: SectionKey) => boolean;
  canApprove: (section: SectionKey) => boolean;
  hasPermission: (section: SectionKey, permission: Permission) => boolean;
}

export const useErpStore = create<ErpStore>((set, get) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => {
    const { visibleSections } = get();
    if (visibleSections.includes(section as SectionKey)) {
      set({ activeSection: section });
    }
  },
  user: null,
  setUser: (user) => {
    const visibleSections = user ? getVisibleSections(user.roleKey) : [];
    const firstVisible = visibleSections.includes('dashboard') ? 'dashboard' : visibleSections[0] || 'dashboard';
    set({ user, visibleSections, activeSection: firstVisible });
  },
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  visibleSections: [],
  canView: (section) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, 'view') : false; },
  canCreate: (section) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, 'create') : false; },
  canEdit: (section) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, 'edit') : false; },
  canDelete: (section) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, 'delete') : false; },
  canApprove: (section) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, 'approve') : false; },
  hasPermission: (section, permission) => { const { user } = get(); return user ? hasPermission(user.roleKey, section, permission) : false; },
}));

