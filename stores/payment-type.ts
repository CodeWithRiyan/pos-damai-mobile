// import { PaymentType } from "@/lib/api/categories";
import { create } from "zustand";

export interface PaymentType {
  id: string;
  name: string;
  commission: number;
  minimalAmount: number;
}

interface PaymentTypeState {
  open: boolean;
  data?: PaymentType | null;
  onSuccess?: (category: PaymentType) => void;
  setOpen: (
    state: boolean,
    onSuccess?: (category: PaymentType) => void,
  ) => void;
  setData: (data?: PaymentType | null) => void;
}

export const usePaymentTypeStore = create<PaymentTypeState>((set) => ({
  open: false,
  data: null,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
}));
