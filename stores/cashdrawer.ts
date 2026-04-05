import { CashDrawer } from '@/hooks/use-cashdrawer';
import { create } from 'zustand';

interface CashDrawerState {
  open: boolean;
  data: CashDrawer | null;
  version: number;
  onSuccess?: (cashDrawer: CashDrawer) => void;
  setOpen: (state: boolean, onSuccess?: (cashDrawer: CashDrawer) => void) => void;
  setData: (data: CashDrawer | null) => void;
  incrementVersion: () => void;
}

export const useCashDrawerStore = create<CashDrawerState>((set) => ({
  open: false,
  data: null,
  version: 0,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
