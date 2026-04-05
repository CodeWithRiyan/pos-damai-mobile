import { create } from 'zustand';

interface FinanceState {
  version: number;
  incrementVersion: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
