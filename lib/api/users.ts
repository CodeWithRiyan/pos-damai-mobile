import { useSyncQueueStore } from "@/stores/sync-queue-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse, isConnectionError } from "./client";
import { Role } from "./roles";
export interface User {
  id: string;
  email: string | null;
  password: string;
  provider: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  isLocked: boolean;
  lockReason: string | null;
  selectedOrganizationId: string;
  createdById: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  username: string;
  roles: [
    {
      userId: string;
      roleId: string;
      assignedAt: string;
      assignedBy: string | null;
      createdBy: string | null;
      updatedBy: string | null;
      expiresAt: string | null;
      role: Role;
    }
  ];
}

export interface CreateUserDTO {
  username: string;
  name: string;
  password?: string;
  roleId: string;
}

export interface UpdateUserDTO {
  id: string;
  username?: string;
  password?: string;
  name?: string;
  roleId?: string;
  isActive?: boolean;
}

// Helper to unwrap API responses safely
function unwrapResponse<T>(response: any): T {
  let data = response.data;
  if (data && data.data !== undefined) {
    data = data.data;
  }
  if (data && data.data !== undefined && !Array.isArray(data)) {
    data = data.data;
  }
  return data;
}

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User[]> | User[]>(
        "/users"
      );
      const data = unwrapResponse<User[]>(response);
      return Array.isArray(data) ? data : [];
    },
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User> | User>(
        `/users/${id}`
      );
      return unwrapResponse<User>(response);
    },
    enabled: !!id,
  });
}

// Create user with offline support
export function useCreateUser() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: CreateUserDTO) => {
      const response = await apiClient.post<ApiResponse<User> | User>(
        "/users",
        data
      );
      return unwrapResponse<User>(response);
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "create",
          endpoint: "/users",
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
      const response = await apiClient.put<ApiResponse<User> | User>(
        `/users/${id}`,
        rest
      );
      return unwrapResponse<User>(response);
    },
    onError: (error, variables) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "update",
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
      const response = await apiClient.delete<ApiResponse<any> | any>(
        `/users/${id}`
      );
      return unwrapResponse<any>(response);
    },
    onError: (error, id) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "delete",
          endpoint: `/users/${id}`,
          data: null,
        });
      }
    },
  });
}

export function useBulkDeleteUser() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      // Fix: Pass data inside config object
      const response = await apiClient.delete<ApiResponse<any> | any>(
        "/users/bulk",
        { data }
      );
      return unwrapResponse<any>(response);
    },
    onError: (error, data) => {
      if (isConnectionError(error)) {
        addToQueue({
          type: "delete",
          endpoint: `/users/bulk`,
          data,
        });
      }
    },
  });
}