import { create } from 'zustand';

interface SupplierState {
  version: number;
  incrementVersion: () => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
