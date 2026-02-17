import { useSyncQueueStore } from "@/stores/sync-queue-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse, isConnectionError } from "./client";

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
  isSystem: boolean;
  permissions?: Permission[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDTO {
  id: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
}

// Helper to unwrap API responses safely
function unwrapResponse<T>(response: any): T {
  // Axios response.data is the root
  let data = response.data;

  // If we have data.data, use it (common for wrapped responses)
  if (data && data.data !== undefined) {
    data = data.data;
  }

  // Some endpoints wrap again: { data: { data: [...] } }
  // OR the inner data object itself has a data field
  if (data && data.data !== undefined && !Array.isArray(data)) {
    data = data.data;
  }

  return data;
}

// Get all roles
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Role[]> | Role[]>(
        "/roles"
      );
      const data = unwrapResponse<Role[]>(response);
      return Array.isArray(data) ? data : [];
    },
  });
}

// Get all permissions
export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<Permission[]> | Permission[]
      >("/roles/permissions");
      const data = unwrapResponse<Permission[]>(response);
      return Array.isArray(data) ? data : [];
    },
  });
}

// Get single role
export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Role> | Role>(
        `/roles/${id}`
      );
      return unwrapResponse<Role>(response);
    },
    enabled: !!id,
  });
}

// Create role with offline support
export function useCreateRole() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: CreateRoleDTO) => {
      const response = await apiClient.post<ApiResponse<Role> | Role>(
        "/roles",
        data
      );
      return unwrapResponse<Role>(response);
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "create",
          endpoint: "/roles",
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
      const response = await apiClient.put<ApiResponse<Role> | Role>(
        `/roles/${id}`,
        rest
      );
      return unwrapResponse<Role>(response);
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "update",
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
      const response = await apiClient.delete<ApiResponse<any> | any>(
        `/roles/${id}`
      );
      return unwrapResponse<any>(response);
    },
    onError: (error, id) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "delete",
          endpoint: `/roles/${id}`,
          data: null,
        });
      }
    },
  });
}

export function useBulkDeleteRole() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      // Fix: Pass data inside config object
      const response = await apiClient.delete<ApiResponse<any> | any>(
        "/roles/bulk",
        { data }
      );
      return unwrapResponse<any>(response);
    },
    onError: (error, data) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "delete",
          endpoint: `/roles/bulk`,
          data,
        });
      }
    },
  });
}
