import { Discount } from "@/components/screens/product";
import { create } from "zustand";

interface DiscountState {
  open: boolean;
  data?: Discount | null;
  setOpen: (state: boolean) => void;
  setData: (data?: Discount | null) => void;
}

export const useDiscountStore = create<DiscountState>((set) => ({
  open: false,
  data: null,
  setOpen: (state) => set({ open: state }),
  setData: (data) => set({ data }),
}));
