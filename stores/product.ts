import { create } from 'zustand';

interface ProductState {
  version: number;
  incrementVersion: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
