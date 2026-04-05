import { Discount } from '@/hooks/use-discount';
import { create } from 'zustand';

interface DiscountState {
  open: boolean;
  data: Discount | null;
  version: number;
  onSuccess?: (discount: Discount) => void;
  setOpen: (state: boolean, onSuccess?: (discount: Discount) => void) => void;
  setData: (data: Discount | null) => void;
  incrementVersion: () => void;
}

export const useDiscountStore = create<DiscountState>((set) => ({
  open: false,
  data: null,
  version: 0,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
