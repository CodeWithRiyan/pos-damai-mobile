import { CashDrawer } from "@/lib/api/cashdrawers";
import { create } from "zustand";

interface CashDrawerState {
  open: boolean;
  data: CashDrawer | null;
  onSuccess?: (cashDrawer: CashDrawer) => void;
  setOpen: (state: boolean, onSuccess?: (cashDrawer: CashDrawer) => void) => void;
  setData: (data: CashDrawer | null) => void;
}

export const useCashDrawerStore = create<CashDrawerState>((set) => ({
  open: false,
  data: null,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
}));
