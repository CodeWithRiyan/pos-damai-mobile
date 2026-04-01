import { create } from 'zustand';

interface ShiftState {
  tabActive: 'current' | 'history';
  setTabActive: (state: 'current' | 'history') => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  tabActive: 'current',
  setTabActive: (state) => set({ tabActive: state }),
}));
