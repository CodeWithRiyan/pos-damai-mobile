import { create } from 'zustand';
import { UserProfile } from '@/lib/api/auth';
import { storageAdapter } from '@/lib/storage';

interface AuthState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  getOrganizationId: () => string;
  rehydrate: () => void;
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
  profile: null, // Start with null, rehydrate after storage init
  setProfile: (profile) => {
    set({ profile });
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
      set({ profile });
    }
  },
}));
