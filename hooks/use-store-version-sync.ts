import { useEffect } from 'react';
import { type StoreApi, useStore } from 'zustand';

interface VersionedState {
  version: number;
}

export function useStoreVersionSync<T extends VersionedState>(
  store: StoreApi<T>,
  onVersionChange: () => void,
) {
  const version = useStore(store, (state) => state.version);

  useEffect(() => {
    onVersionChange();
  }, [version, onVersionChange]);
}
