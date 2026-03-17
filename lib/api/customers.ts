import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { useAuthStore } from "@/stores/auth";

export type CustomerCategory = "RETAIL" | "WHOLESALE";

export interface Customer {
  id: string;
  name: string;
  category: CustomerCategory;
  code: string | null;
  phone: string | null;
  address: string | null;
  points: number;
  totalTransactions: number;
  totalRevenue: number;
  totalProfit: number;
  organizationId: string | null;

  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type CustomerWithStats = Customer;

export interface CreateCustomerDTO {
  name: string;
  category?: CustomerCategory;
  code?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDTO {
  id: string;
  name?: string;
  category?: CustomerCategory;
  code?: string;
  phone?: string;
  address?: string;
}

// Get all customers from local SQLite (excluding soft-deleted)
export function useCustomers(params: { category?: CustomerCategory } | void) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["customers", orgId, params?.category],
    queryFn: async () => {
      const conditions = [
        eq(schema.customers.organizationId, orgId),
        isNull(schema.customers.deletedAt),
      ];

      if (params?.category) {
        conditions.push(eq(schema.customers.category, params.category));
      }

      const result = await db
        .select()
        .from(schema.customers)
        .where(and(...conditions));

      return result as CustomerWithStats[];
    },
    enabled: !!orgId,
  });
}

// Get single customer
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, id))
        .limit(1);

      if (result.length === 0) return undefined;

      return result[0] as CustomerWithStats;
    },
    enabled: !!id,
  });
}

// Create customer (saved to local SQLite, synced via SyncEngine)
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      const newCustomer = {
        id,
        name: data.name,
        category: data.category ?? "RETAIL",
        code: data.code ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        points: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalProfit: 0,
        organizationId: orgId,

        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.customers).values(newCustomer);

      return newCustomer as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["customers", data.organizationId],
      });
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCustomerDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.customers)
        .set({
          ...rest,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.customers.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      // Invalidate both list and single customer queries
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["customers", data.id] });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.customers)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.customers.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
    },
  });
}

// Reset customer points
export function useResetCustomerPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.customers)
        .set({
          points: 0,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.customers.id, id));

      return { id };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["customers", data.id] });
    },
  });
}

// Bulk reset customer points
export function useBulkResetCustomerPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        await db
          .update(schema.customers)
          .set({
            points: 0,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.customers.id, id));
      }

      return data;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
    },
  });
}

// Bulk delete customers
export function useBulkDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        await db
          .update(schema.customers)
          .set({
            deletedAt: now,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.customers.id, id));
      }

      return data;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
    },
  });
}
