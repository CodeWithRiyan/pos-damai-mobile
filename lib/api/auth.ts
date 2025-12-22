import { useSyncQueueStore } from '@/stores/sync-queue-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authStorageAdapter } from '../storage';
import { apiClient, isConnectionError } from './client';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Login mutation
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('useLogin mutationFn called', credentials);
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials
      );
      console.log('useLogin mutationFn response', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('useLogin onSuccess called');
      // Store tokens
      authStorageAdapter.setToken(data.token);
      authStorageAdapter.setRefreshToken(data.refreshToken);
    },
    onError: (error) => {
      // Login errors are always shown immediately, never queued
      console.error('Login failed:', error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Clear auth tokens
      authStorageAdapter.clearAll();
    },
    onError: (error) => {
      // If connection error, queue for later
      if (isConnectionError(error)) {
        addToQueue({
          type: 'create',
          endpoint: '/auth/logout',
          data: {},
        });
      }
      
      // Always clear tokens locally
      authStorageAdapter.clearAll();
    },
  });
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
    enabled: !!authStorageAdapter.getToken(),
  });
}
