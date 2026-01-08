import { create } from "zustand";

interface SidebarState {
  showDrawer: boolean;
  setShowDrawer: (state: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  showDrawer: false,
  setShowDrawer: (state: boolean) => set({ showDrawer: state }),
}));
