import { create } from "zustand";

export interface ActionDrawerState {
  dataId: string | null;
  showActionDrawer:
    | "USER-ADD"
    | "USER-EDIT"
    | "USER-DETAIL"
    | "ROLE-ADD"
    | "ROLE-EDIT"
    | "ROLE-DETAIL"
    | null;
  setDataId: (id: string | null) => void;
  setShowActionDrawer: (state: ActionDrawerState["showActionDrawer"]) => void;
}

export const useActionDrawerStore = create<ActionDrawerState>((set) => ({
  showActionDrawer: null,
  dataId: null,
  setShowActionDrawer: (state) => set({ showActionDrawer: state }),
  setDataId: (id) => set({ dataId: id }),
}));
