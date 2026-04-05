import { Category } from '@/hooks/use-category';
import { create } from 'zustand';

interface CategoryState {
  open: boolean;
  data: Category | null;
  version: number;
  onSuccess?: (category: Category) => void;
  setOpen: (state: boolean, onSuccess?: (category: Category) => void) => void;
  setData: (data: Category | null) => void;
  incrementVersion: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  open: false,
  data: null,
  version: 0,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
