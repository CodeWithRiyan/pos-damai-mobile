import { useSyncQueueStore } from "@/stores/sync-queue-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authStorageAdapter } from "../storage";
import { apiClient, isConnectionError } from "./client";

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
  success: boolean;
  message: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  level: number;
}

export interface UserProfile {
  id: string;
  email: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLoginAt: string;
  name: string;
  phone: string | null;
  provider: string;
  roles: UserRole[];
  selectedOrganizationId: string | null;
  selectedOrganization: {
    address: string;
    code: string;
    createdAt: string;
    currency: string;
    deletedAt: string | null;
    id: string;
    isActive: true;
    name: string;
    parentId: string | null;
    phone: string;
    settings: object;
    taxId: string | null;
    timezone: string;
    type: string;
    updatedAt: string;
  } | null;
}

export interface ProfileResponse {
  data: {
    user: UserProfile;
  };
  success: boolean;
  message: string;
}

// Login mutation
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("useLogin mutationFn called", credentials);
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      console.log("useLogin mutationFn response", response.data);
      return response.data;
    },
    onSuccess: (response) => {
      console.log("useLogin onSuccess called");
      if (response.success && response.data) {
        // Store tokens
        authStorageAdapter.setToken(response.data.accessToken);
        authStorageAdapter.setRefreshToken(response.data.refreshToken);
      }
    },
    onError: (error) => {
      // Login errors are always shown immediately, never queued
      console.error("Login failed:", error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const addToQueue = useSyncQueueStore((state) => state.addToQueue);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/auth/logout");
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
          type: "create",
          endpoint: "/auth/logout",
          data: {},
        });
      }

      // Always clear tokens locally
      authStorageAdapter.clearAll();
    },
  });
}

// Get current user profile
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const response = await apiClient.get<ProfileResponse>("/auth/profile");
      return response.data.data.user;
    },
    enabled: !!authStorageAdapter.getToken(),
  });
}
