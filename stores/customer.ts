import { Customer } from '@/hooks/use-customer';
import { create } from 'zustand';

interface CustomerState {
  open: boolean;
  data: Customer | null;
  version: number;
  onSuccess?: (customer: Customer) => void;
  setOpen: (state: boolean, onSuccess?: (customer: Customer) => void) => void;
  setData: (data: Customer | null) => void;
  incrementVersion: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  open: false,
  data: null,
  version: 0,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
