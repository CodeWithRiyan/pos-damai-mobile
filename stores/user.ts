import { create } from 'zustand';

interface UserState {
  version: number;
  incrementVersion: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
