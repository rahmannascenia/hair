import { create } from 'zustand';

export interface ErpUser {
  username: string;
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
}

export const useErpStore = create<ErpStore>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
  user: null,
  setUser: (user) => set({ user }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
}));