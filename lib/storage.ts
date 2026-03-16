import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory cache to provide synchronous access like MMKV
const cache: Record<string, string> = {};
const AUTH_CACHE: Record<string, string> = {};

const STORAGE_ID = "pos-damai-storage";
const AUTH_STORAGE_ID = "pos-damai-auth-storage";

/**
 * Initializes the storage by loading data from AsyncStorage into memory.
 * This MUST be called at app startup before any storage access.
 */
export const initializeStorage = async () => {
  try {
    const [generalData, authData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_ID),
      AsyncStorage.getItem(AUTH_STORAGE_ID),
    ]);

    if (generalData) {
      const parsed = JSON.parse(generalData);
      Object.assign(cache, parsed);
    }

    if (authData) {
      const parsed = JSON.parse(authData);
      Object.assign(AUTH_CACHE, parsed);
    }

    console.log("[Storage] Initialized successfully");
  } catch (error) {
    console.error("[Storage] Failed to initialize:", error);
  }
};

// Persist general cache to disk
const persistGeneral = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_ID, JSON.stringify(cache));
  } catch (error) {
    console.error("[Storage] Failed to persist general data:", error);
  }
};

// Persist auth cache to disk
const persistAuth = async () => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_ID, JSON.stringify(AUTH_CACHE));
  } catch (error) {
    console.error("[Storage] Failed to persist auth data:", error);
  }
};

// Mock MMKV instance for general storage
export const storage = {
  getString: (key: string): string | undefined => {
    return cache[key];
  },
  set: (key: string, value: string): void => {
    cache[key] = value;
    persistGeneral();
  },
  remove: (key: string): void => {
    delete cache[key];
    persistGeneral();
  },
  clearAll: (): void => {
    Object.keys(cache).forEach((key) => delete cache[key]);
    persistGeneral();
  },
};

// Mock MMKV instance for auth storage
export const authStorage = {
  getString: (key: string): string | undefined => {
    return AUTH_CACHE[key];
  },
  set: (key: string, value: string): void => {
    AUTH_CACHE[key] = value;
    persistAuth();
  },
  remove: (key: string): void => {
    delete AUTH_CACHE[key];
    persistAuth();
  },
  clearAll: (): void => {
    Object.keys(AUTH_CACHE).forEach((key) => delete AUTH_CACHE[key]);
    persistAuth();
  },
};

// Type-safe storage wrapper (Maintains original API)
export const storageAdapter = {
  getItem: (key: string): string | null => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

// Auth-specific storage helpers (Maintains original API)
export const authStorageAdapter = {
  getToken: (): string | null => {
    return authStorage.getString("jwt_token") ?? null;
  },
  setToken: (token: string): void => {
    authStorage.set("jwt_token", token);
  },
  removeToken: (): void => {
    authStorage.remove("jwt_token");
  },
  getRefreshToken: (): string | null => {
    return authStorage.getString("refresh_token") ?? null;
  },
  setRefreshToken: (token: string): void => {
    authStorage.set("refresh_token", token);
  },
  removeRefreshToken: (): void => {
    authStorage.remove("refresh_token");
  },
  clearAll: (): void => {
    authStorage.clearAll();
  },
};
