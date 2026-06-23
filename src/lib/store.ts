import { create } from 'zustand';

interface ErpStore {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const useErpStore = create<ErpStore>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
}));