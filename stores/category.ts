import { Category } from "@/lib/api/categories";
import { create } from "zustand";

interface CategoryState {
  open: boolean;
  data?: Category | null;
  setOpen: (state: boolean) => void;
  setData: (data?: Category | null) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  open: false,
  data: null,
  setOpen: (state) => set({ open: state }),
  setData: (data) => set({ data }),
}));
