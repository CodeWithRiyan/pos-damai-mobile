import { create } from 'zustand';

interface ShiftState {
  tabActive: 'current' | 'history';
  version: number;
  setTabActive: (state: 'current' | 'history') => void;
  incrementVersion: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  tabActive: 'current',
  setTabActive: (state) => set({ tabActive: state }),
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
