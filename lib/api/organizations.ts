import { useSyncQueueStore } from '@/stores/sync-queue-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, isConnectionError } from './client';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDTO {
  name: string;
  description?: string;
}

export interface UpdateOrganizationDTO {
  id: string;
  name?: string;
  description?: string;
}

// Get all organizations
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiClient.get<Organization[]>('/organizations');
      return response.data;
    },
  });
}

// Get single organization
export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const response = await apiClient.get<Organization>(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create organization with offline support
export function useCreateOrganization() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: CreateOrganizationDTO) => {
      const response = await apiClient.post<Organization>('/organizations', data);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'create',
          endpoint: '/organizations',
          data: variables,
        });
      }
    },
  });
}

// Update organization with offline support
export function useUpdateOrganization() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: UpdateOrganizationDTO) => {
      const { id, ...rest } = data;
      const response = await apiClient.put<Organization>(`/organizations/${id}`, rest);
      return response.data;
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'update',
          endpoint: `/organizations/${variables.id}`,
          data: variables,
        });
      }
    },
  });
}

// Delete organization with offline support
export function useDeleteOrganization() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/organizations/${id}`);
      return response.data;
    },
    onError: (error, id) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: 'delete',
          endpoint: `/organizations/${id}`,
          data: null,
        });
      }
    },
  });
}
