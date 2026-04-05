import { PaymentType } from '@/hooks/use-payment-type';
import { create } from 'zustand';

interface PaymentTypeState {
  open: boolean;
  data: PaymentType | null;
  version: number;
  onSuccess?: (paymentType: PaymentType) => void;
  setOpen: (state: boolean, onSuccess?: (paymentType: PaymentType) => void) => void;
  setData: (data: PaymentType | null) => void;
  incrementVersion: () => void;
}

export const usePaymentTypeStore = create<PaymentTypeState>((set) => ({
  open: false,
  data: null,
  version: 0,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
