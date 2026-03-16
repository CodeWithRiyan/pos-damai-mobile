import { create } from "zustand";
import { storage } from "../lib/storage";

export interface QueuedOperation {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data: unknown;
  timestamp: number;
}

interface SyncQueueState {
  queue: QueuedOperation[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  addToQueue: (operation: Omit<QueuedOperation, "id" | "timestamp">) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  loadQueue: () => void;
}

const QUEUE_STORAGE_KEY = "sync_queue";
const LAST_SYNC_AT_KEY = "lastSyncAt_ts";

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  queue: [],
  isSyncing: false,
  lastSyncAt: (() => {
    const stored = storage.getString(LAST_SYNC_AT_KEY);
    return stored ? Number(stored) : null;
  })(),

  addToQueue: (operation) => {
    const newOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => {
      const updatedQueue = [...state.queue, newOperation];
      // Persist to storage
      storage.set(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
      return { queue: updatedQueue };
    });
  },

  removeFromQueue: (id) => {
    set((state) => {
      const updatedQueue = state.queue.filter((op) => op.id !== id);
      // Persist to storage
      storage.set(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
      return { queue: updatedQueue };
    });
  },

  clearQueue: () => {
    storage.remove(QUEUE_STORAGE_KEY);
    set({ queue: [] });
  },

  setIsSyncing: (syncing) => set({ isSyncing: syncing }),

  setLastSyncAt: (timestamp) => {
    storage.set(LAST_SYNC_AT_KEY, String(timestamp));
    set({ lastSyncAt: timestamp });
  },

  loadQueue: () => {
    const stored = storage.getString(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as QueuedOperation[];
        set({ queue: parsed });
      } catch (error) {
        console.error("Failed to parse sync queue:", error);
        storage.remove(QUEUE_STORAGE_KEY);
      }
    }
  },
}));
