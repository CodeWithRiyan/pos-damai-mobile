import { Brand } from "@/lib/api/brands";
import { create } from "zustand";

interface BrandState {
  open: boolean;
  data?: Brand | null;
  setOpen: (state: boolean) => void;
  setData: (data?: Brand | null) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  open: false,
  data: null,
  setOpen: (state) => set({ open: state }),
  setData: (data) => set({ data }),
}));
