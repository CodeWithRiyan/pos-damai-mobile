import { create } from 'zustand';
import { UserProfile } from '@/lib/api/auth';
import { storageAdapter, authStorageAdapter } from '@/lib/storage';
import { apiClient } from '@/lib/api/client';

interface AuthState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setProfile: (profile: UserProfile | null) => void;
  getOrganizationId: () => string;
  rehydrate: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Helper to get profile from storage
const getProfileFromStorage = (): UserProfile | null => {
  const data = storageAdapter.getItem('userProfile');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  setProfile: (profile) => {
    set({ profile, isAuthenticated: !!profile });
    if (profile) {
      storageAdapter.setItem('userProfile', JSON.stringify(profile));
    } else {
      storageAdapter.removeItem('userProfile');
    }
  },
  getOrganizationId: () => {
    const profile = get().profile;
    return profile?.selectedOrganizationId || profile?.selectedOrganization?.id || '';
  },
  rehydrate: () => {
    const profile = getProfileFromStorage();
    if (profile) {
      set({ profile, isAuthenticated: true });
    }
  },
  login: async (_username: string, _password: string) => {
    const response = await apiClient.post('/auth/login', {
      username: _username,
      password: _password,
    });

    const loginData = response.data?.data || {};

    // Store JWT token so the request interceptor can attach it
    const token = loginData.accessToken || loginData.token;
    if (token) {
      authStorageAdapter.setToken(token);
    }
    if (loginData.refreshToken) {
      authStorageAdapter.setRefreshToken(loginData.refreshToken);
    }

    // Fetch full profile from /auth/profile (same as SyncEngine does)
    const profileResponse = await apiClient.get('/auth/profile');
    const currentUser = profileResponse?.data?.data?.user;

    if (!currentUser) {
      throw new Error('User object missing from profile response');
    }

    set({ profile: currentUser, isAuthenticated: true });
    storageAdapter.setItem('userProfile', JSON.stringify(currentUser));
  },
  logout: () => {
    set({ profile: null, isAuthenticated: false });
    storageAdapter.removeItem('userProfile');
    authStorageAdapter.clearAll();
  },
}));
