import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, like, desc } from 'drizzle-orm';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface CreateSupplierDTO {
  name: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {
  id: string;
}

export async function fetchSuppliers(params?: { search?: string }): Promise<Supplier[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(schema.suppliers.organizationId, orgId),
    isNull(schema.suppliers.deletedAt),
  ] as any[];

  if (params?.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(like(schema.suppliers.name, searchTerm));
  }

  const result = await db
    .select()
    .from(schema.suppliers)
    .where(and(...conditions))
    .orderBy(desc(schema.suppliers.createdAt));

  return result as unknown as Supplier[];
}

export async function fetchSupplier(id: string): Promise<Supplier | null> {
  const result = await db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Supplier;
}

export async function createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newSupplier = {
    id,
    name: data.name,
    phone: data.phone || null,
    address: data.address || null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(schema.suppliers).values(newSupplier as any);

  return newSupplier as unknown as Supplier;
}

export async function updateSupplier(data: UpdateSupplierDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.suppliers)
    .set({
      ...rest,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.suppliers.id, id));
}

export async function deleteSupplier(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.suppliers)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.suppliers.id, id));
}

export function useSuppliers(params?: { search?: string }) {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSuppliers(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useSupplier(id: string) {
  const [data, setData] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchSupplier(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, error, refetch: fetch };
}

export function useCreateSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: CreateSupplierDTO, options?: { onSuccess?: (data: Supplier) => void; onError?: (error: Error) => void }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createSupplier(data);
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
  }, []);

  return { mutate, mutateAsync: mutate, isLoading: loading, loading: loading, isPending: loading, error };
}

export function useUpdateSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: UpdateSupplierDTO, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
    setLoading(true);
    setError(null);
    try {
      await updateSupplier(data);
      options?.onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, mutateAsync: mutate, isLoading: loading, loading: loading, isPending: loading, error };
}

export function useDeleteSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSupplier(id);
      options?.onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, mutateAsync: mutate, isLoading: loading, loading: loading, isPending: loading, error };
}

export function useBulkDeleteSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (ids: string[], options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all(ids.map(id => deleteSupplier(id)));
      options?.onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, mutateAsync: mutate, isLoading: loading, loading: loading, isPending: loading, error };
}