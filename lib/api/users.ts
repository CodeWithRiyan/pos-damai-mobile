import { useSyncQueueStore } from '@/stores/sync-queue-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, isConnectionError } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  roleId: string;
  organizationId: string;
}

export interface UpdateUserDTO {
  id: string;
  email?: string;
  name?: string;
  roleId?: string;
  organizationId?: string;
}

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/users');
      return response.data;
    },
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await apiClient.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create user with offline support
export function useCreateUser() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: CreateUserDTO) => {
      const response = await apiClient.post<User>('/users', data);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'create',
          endpoint: '/users',
          data: variables,
        });
      }
    },
  });
}

// Update user with offline support
export function useUpdateUser() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: UpdateUserDTO) => {
      const { id, ...rest } = data;
      const response = await apiClient.put<User>(`/users/${id}`, rest);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'update',
          endpoint: `/users/${variables.id}`,
          data: variables,
        });
      }
    },
  });
}

// Delete user with offline support
export function useDeleteUser() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    },
    onError: (error, id) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'delete',
          endpoint: `/users/${id}`,
          data: null,
        });
      }
    },
  });
}
