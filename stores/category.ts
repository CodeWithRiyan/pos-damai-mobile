import { Category } from '@/hooks/use-category';
import { create } from 'zustand';

interface CategoryState {
  open: boolean;
  data: Category | null;
  onSuccess?: (category: Category) => void;
  setOpen: (state: boolean, onSuccess?: (category: Category) => void) => void;
  setData: (data: Category | null) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  open: false,
  data: null,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
}));
