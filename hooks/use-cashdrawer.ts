import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, like, desc } from 'drizzle-orm';

export interface CashDrawer {
  id: string;
  name: string;
  isActive: boolean;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function fetchCashDrawers(): Promise<CashDrawer[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.cashDrawers)
    .where(and(eq(schema.cashDrawers.organizationId, orgId), isNull(schema.cashDrawers.deletedAt)))
    .orderBy(desc(schema.cashDrawers.createdAt));

  return result as unknown as CashDrawer[];
}

export async function fetchCashDrawer(id: string): Promise<CashDrawer | null> {
  const result = await db
    .select()
    .from(schema.cashDrawers)
    .where(eq(schema.cashDrawers.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as CashDrawer;
}

export async function refetchCashDrawerById(id: string): Promise<CashDrawer | null> {
  return fetchCashDrawer(id);
}

export async function createCashDrawer(data: {
  name: string;
  isActive?: boolean;
}): Promise<CashDrawer> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `cd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newCashDrawer = {
    id,
    name: data.name,
    isActive: data.isActive ?? true,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(schema.cashDrawers).values(newCashDrawer as any);

  return newCashDrawer as unknown as CashDrawer;
}

export async function updateCashDrawer(data: {
  id: string;
  name?: string;
  isActive?: boolean;
}): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.cashDrawers)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.cashDrawers.id, data.id));
}

export function useCashDrawers() {
  const [data, setData] = useState<CashDrawer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCashDrawers();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useCashDrawer(id: string) {
  const [data, setData] = useState<CashDrawer | null>(null);
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
      const result = await fetchCashDrawer(id);
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

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useCreateCashDrawer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: { name: string; isActive?: boolean },
      options?: { onSuccess?: (data: CashDrawer) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createCashDrawer(data);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export function useUpdateCashDrawer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: { id: string; name?: string; isActive?: boolean },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateCashDrawer(data);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export function useDeleteCashDrawer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const userId = useAuthStore.getState().profile?.id;
        await db
          .update(schema.cashDrawers)
          .set({
            deletedAt: now,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.cashDrawers.id, id));
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}
