import { Brand } from '@/hooks/use-brand';
import { create } from 'zustand';

interface BrandState {
  open: boolean;
  data: Brand | null;
  onSuccess?: (brand: Brand) => void;
  setOpen: (state: boolean, onSuccess?: (brand: Brand) => void) => void;
  setData: (data: Brand | null) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  open: false,
  data: null,
  onSuccess: undefined,
  setOpen: (state, onSuccess) => set({ open: state, onSuccess }),
  setData: (data) => set({ data }),
}));
