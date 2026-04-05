import { create } from 'zustand';

interface PayableState {
  version: number;
  incrementVersion: () => void;
}

export const usePayableStore = create<PayableState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
