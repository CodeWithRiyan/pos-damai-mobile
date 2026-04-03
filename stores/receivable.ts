import { create } from 'zustand';

interface ReceivableState {
  version: number;
  incrementVersion: () => void;
}

export const useReceivableStore = create<ReceivableState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
