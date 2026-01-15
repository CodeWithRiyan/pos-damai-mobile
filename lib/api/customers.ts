import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { storageAdapter } from '../storage';

export type CustomerCategory = 'RETAIL' | 'WHOLESALE';

export interface Customer {
  id: string;
  name: string;
  category: CustomerCategory;
  code: string | null;
  phone: string | null;
  address: string | null;
  organizationId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

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

// Get user's organization ID
function getOrganizationId(): string {
  const profile = storageAdapter.getItem('userProfile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.selectedOrganizationId || '';
    } catch {
      return '';
    }
  }
  return '';
}

// Get all customers from local SQLite (excluding soft-deleted)
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const result = await db
        .select()
        .from(schema.customers)
        .where(and(
          eq(schema.customers.organizationId, orgId),
          isNull(schema.customers.deletedAt)
        ));
      return result as Customer[];
    },
  });
}

// Get single customer
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, id))
        .limit(1);
      return result[0] as Customer | undefined;
    },
    enabled: !!id,
  });
}

// Create customer (saved to local SQLite, synced via SyncEngine)
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerDTO) => {
      const orgId = getOrganizationId();
      const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newCustomer = {
        id,
        name: data.name,
        category: data.category ?? 'RETAIL',
        code: data.code ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.customers).values(newCustomer);

      return newCustomer as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

      await db
        .update(schema.customers)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.customers.id, id));

      return { id, ...rest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      await db
        .update(schema.customers)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.customers.id, id));

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Bulk delete customers
export function useBulkDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      for (const id of data.ids) {
        await db
          .update(schema.customers)
          .set({ deletedAt: now, _dirty: true })
          .where(eq(schema.customers.id, id));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
