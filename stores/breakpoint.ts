import { create } from 'zustand';

interface BreakpointState {
  deviceWidth: number;
  setDeviceWidth: (deviceWidth: number) => void;
}

export const useBreakpointStore = create<BreakpointState>((set) => ({
  deviceWidth: 0,
  setDeviceWidth: (deviceWidth: number) => set({ deviceWidth }),
}));
