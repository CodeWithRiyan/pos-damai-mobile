import { Discount } from "@/lib/api/discounts";
import { create } from "zustand";

interface DiscountState {
  open: boolean;
  data?: Discount | null;
  onSuccess?: (discount: Discount) => void;
  setOpen: (state: boolean, onSuccess?: (discount: Discount) => void) => void;
  setData: (data?: Discount | null) => void;
}

export const useDiscountStore = create<DiscountState>((set) => ({
  open: false,
  data: null,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
}));
