import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/system/auth';
import { and, eq, isNull, inArray } from 'drizzle-orm';

export type CustomerCategory = 'RETAIL' | 'WHOLESALE';

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

export async function fetchCustomers(params?: {
  category?: CustomerCategory;
}): Promise<CustomerWithStats[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(schema.customers.organizationId, orgId),
    isNull(schema.customers.deletedAt),
  ];

  if (params?.category) {
    conditions.push(eq(schema.customers.category, params.category) as any);
  }

  const result = await db
    .select()
    .from(schema.customers)
    .where(and(...conditions));

  return result as CustomerWithStats[];
}

export async function fetchCustomer(id: string): Promise<CustomerWithStats | null> {
  const result = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as CustomerWithStats;
}

export async function refetchCustomerById(id: string): Promise<CustomerWithStats | null> {
  return fetchCustomer(id);
}

export async function createCustomer(data: CreateCustomerDTO): Promise<Customer> {
  const orgId = useAuthStore.getState().getOrganizationId();
  const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  const newCustomer: Customer = {
    id,
    name: data.name,
    category: data.category ?? 'RETAIL',
    code: data.code ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    points: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0,
    organizationId: orgId,
    createdBy: userId ?? null,
    updatedBy: userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.customers).values({
    ...newCustomer,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  });

  return newCustomer;
}

export async function updateCustomer(data: UpdateCustomerDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.customers)
    .set({
      ...rest,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.customers.id, id));
}

export async function deleteCustomer(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.customers)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.customers.id, id));
}

export async function resetCustomerPoints(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.customers)
    .set({
      points: 0,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.customers.id, id));
}

export async function bulkResetCustomerPoints(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const id of ids) {
    await db
      .update(schema.customers)
      .set({
        points: 0,
        updatedBy: userId ?? null,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(schema.customers.id, id));
  }
}

export async function bulkDeleteCustomers(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.customers)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(inArray(schema.customers.id, ids));
}

export function useCustomers(params?: { category?: CustomerCategory }) {
  const [data, setData] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomers(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params?.category]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
}

export function useCustomer(id: string) {
  const [data, setData] = useState<CustomerWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchCustomer(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, isLoading: loading, loading, error, refetch };
}

export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateCustomerDTO,
      options?: { onSuccess?: (data: Customer) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createCustomer(data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useUpdateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateCustomerDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateCustomer(data);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteCustomer(id);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useResetCustomerPoints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await resetCustomerPoints(id);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useBulkResetCustomerPoints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await bulkResetCustomerPoints(ids);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useBulkDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await bulkDeleteCustomers(ids);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}
