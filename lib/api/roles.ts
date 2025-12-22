import { useSyncQueueStore } from '@/stores/sync-queue-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, isConnectionError } from './client';

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDTO {
  name: string;
  permissions: string[];
}

export interface UpdateRoleDTO {
  id: string;
  name?: string;
  permissions?: string[];
}

// Get all roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/roles');
      return response.data;
    },
  });
}

// Get single role
export function useRole(id: string) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: async () => {
      const response = await apiClient.get<Role>(`/roles/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create role with offline support
export function useCreateRole() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: CreateRoleDTO) => {
      const response = await apiClient.post<Role>('/roles', data);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'create',
          endpoint: '/roles',
          data: variables,
        });
      }
    },
  });
}

// Update role with offline support
export function useUpdateRole() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: UpdateRoleDTO) => {
      const { id, ...rest } = data;
      const response = await apiClient.put<Role>(`/roles/${id}`, rest);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'update',
          endpoint: `/roles/${variables.id}`,
          data: variables,
        });
      }
    },
  });
}

// Delete role with offline support
export function useDeleteRole() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/roles/${id}`);
      return response.data;
    },
    onError: (error, id) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'delete',
          endpoint: `/roles/${id}`,
          data: null,
        });
      }
    },
  });
}
