import { create } from 'zustand';

interface CustomerState {
  version: number;
  incrementVersion: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
