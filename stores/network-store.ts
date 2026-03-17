import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect } from "react";
import { create } from "zustand";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  wasOffline: boolean;
  setNetworkState: (state: NetInfoState) => void;
  markAsOnline: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isInternetReachable: null,
  wasOffline: false,
  setNetworkState: (state: NetInfoState) =>
    set((prev) => ({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      wasOffline: prev.isConnected === false && state.isConnected === true,
    })),
  markAsOnline: () => set({ wasOffline: false }),
}));

// Hook to initialize network monitoring
export function useNetworkMonitoring() {
  const setNetworkState = useNetworkStore((state) => state.setNetworkState);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch()
      .then(setNetworkState)
      .catch(() => {});

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(setNetworkState);

    return () => unsubscribe();
  }, [setNetworkState]);
}
