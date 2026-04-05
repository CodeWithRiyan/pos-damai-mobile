import { create } from 'zustand';

interface RoleState {
  version: number;
  incrementVersion: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  version: 0,
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
