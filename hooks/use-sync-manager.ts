import { useNetworkStore } from '@/stores/network';
import { useSyncQueueStore } from '@/stores/sync-queue';
import { useEffect, useState } from 'react';

export function useSyncManager() {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const wasOffline = useNetworkStore((state) => state.wasOffline);
  const markAsOnline = useNetworkStore((state) => state.markAsOnline);
  const queue = useSyncQueueStore((state) => state.queue);
  const loadQueue = useSyncQueueStore((state) => state.loadQueue);

  // Load queue from storage on mount
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Show sync modal when coming back online with pending operations
  useEffect(() => {
    if (wasOffline && queue.length > 0) {
      setShowSyncModal(true);
      markAsOnline();
    }
  }, [wasOffline, queue.length, markAsOnline]);

  const handleCloseSyncModal = () => {
    setShowSyncModal(false);
  };

  return {
    showSyncModal,
    handleCloseSyncModal,
  };
}
