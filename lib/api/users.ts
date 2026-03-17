import { useSyncQueueStore } from "@/stores/sync-queue-store";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  apiClient,
  ApiResponse,
  isConnectionError,
  unwrapResponse,
} from "./client";
import { Role } from "./roles";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
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
    },
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

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User[]> | User[]>(
        "/users",
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
        `/users/${id}`,
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
        data,
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
        rest,
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
      const response = await apiClient.delete<ApiResponse<void>>(
        `/users/${id}`,
      );
      return unwrapResponse<void>(response);
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
      const response = await apiClient.delete<ApiResponse<void>>(
        "/users/bulk",
        { data },
      );
      return unwrapResponse<void>(response);
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

// Get all users from local SQLite (offline-first)
export function useLocalUsers() {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["local-users", orgId],
    queryFn: async () => {
      return db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.organizationId, orgId),
            isNull(schema.users.deletedAt),
          ),
        );
    },
    enabled: !!orgId,
  });
}

export interface IUserLog {
  id: string;
  date: Date | string | null;
  activity: string;
  type: string;
}

// Get user activity logs from SQLite
export function useUserLog(userId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["userLogs", orgId, userId],
    queryFn: async () => {
      const logs: IUserLog[] = [];

      // Fetch Shifts
      const shifts = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.userId, userId),
            eq(schema.shifts.organizationId, orgId),
          ),
        );

      shifts.forEach((s) => {
        if (s.startTime) {
          logs.push({
            id: `${s.id}_start`,
            date: s.startTime,
            activity: "Buka Shift",
            type: "SHIFT",
          });
        }
        if (s.endTime) {
          logs.push({
            id: `${s.id}_end`,
            date: s.endTime,
            activity: "Tutup Shift",
            type: "SHIFT",
          });
        }
      });

      // Fetch Sales Transactions
      const transactions = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.createdBy, userId),
            eq(schema.transactions.organizationId, orgId),
          ),
        );

      transactions.forEach((t) => {
        logs.push({
          id: t.id,
          date: t.transactionDate || t.createdAt,
          activity: "Transaksi Penjualan",
          type: "SALES",
        });
      });

      // Fetch Purchases
      const purchases = await db
        .select()
        .from(schema.purchases)
        .where(
          and(
            eq(schema.purchases.createdBy, userId),
            eq(schema.purchases.organizationId, orgId),
          ),
        );

      purchases.forEach((p) => {
        logs.push({
          id: p.id,
          date: p.createdAt,
          activity: "Transaksi Pembelian",
          type: "PURCHASE",
        });
      });

      // Fetch Finances
      const finances = await db
        .select()
        .from(schema.finances)
        .where(
          and(
            eq(schema.finances.createdBy, userId),
            eq(schema.finances.organizationId, orgId),
          ),
        );

      finances.forEach((f) => {
        logs.push({
          id: f.id,
          date: f.transactionDate || f.createdAt,
          activity: f.type === "INCOME" ? "Pemasukan Kas" : "Pengeluaran Kas",
          type: "FINANCE",
        });
      });

      // Sort logs by date descending
      return logs.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: !!orgId && !!userId,
  });
}
