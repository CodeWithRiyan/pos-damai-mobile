import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

// Only use encryption on native platforms, as Web doesn't support it
const isWeb = Platform.OS === 'web';

// Create MMKV instance for general storage
export const storage = createMMKV({
  id: 'pos-damai-storage',
  ...(isWeb ? {} : { encryptionKey: 'pos-damai-secure-key-2024' }),
});

// Create separate MMKV instance for auth tokens (more secure)
export const authStorage = createMMKV({
  id: 'pos-damai-auth-storage',
  ...(isWeb ? {} : { encryptionKey: 'pos-damai-auth-secure-key-2024' }),
});

// Type-safe storage wrapper
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

// Auth-specific storage helpers
export const authStorageAdapter = {
  getToken: (): string | null => {
    return authStorage.getString('jwt_token') ?? null;
  },
  setToken: (token: string): void => {
    authStorage.set('jwt_token', token);
  },
  removeToken: (): void => {
    authStorage.remove('jwt_token');
  },
  getRefreshToken: (): string | null => {
    return authStorage.getString('refresh_token') ?? null;
  },
  setRefreshToken: (token: string): void => {
    authStorage.set('refresh_token', token);
  },
  removeRefreshToken: (): void => {
    authStorage.remove('refresh_token');
  },
  clearAll: (): void => {
    authStorage.clearAll();
  },
};
