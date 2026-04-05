import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull } from 'drizzle-orm';

export interface Discount {
  id: string;
  name: string;
  nominal: number;
  type: 'FLAT' | 'PERCENTAGE';
  startDate: Date;
  endDate: Date;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateDiscountDTO {
  name: string;
  nominal: number;
  type: 'FLAT' | 'PERCENTAGE';
  startDate: Date;
  endDate: Date;
}

export interface UpdateDiscountDTO extends Partial<CreateDiscountDTO> {
  id: string;
}

export async function fetchDiscounts(): Promise<Discount[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.discounts)
    .where(and(eq(schema.discounts.organizationId, orgId), isNull(schema.discounts.deletedAt)));
  return result as Discount[];
}

export async function fetchDiscount(id: string): Promise<Discount | null> {
  if (!id) return null;
  const result = await db
    .select()
    .from(schema.discounts)
    .where(eq(schema.discounts.id, id))
    .limit(1);
  return (result[0] as Discount) || null;
}

export async function refetchDiscountById(id: string): Promise<Discount | null> {
  return fetchDiscount(id);
}

export async function createDiscount(data: CreateDiscountDTO): Promise<Discount> {
  const orgId = useAuthStore.getState().getOrganizationId();
  const id = `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  const newDiscount: Discount = {
    id,
    name: data.name,
    nominal: data.nominal,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    organizationId: orgId,
    createdBy: userId ?? null,
    updatedBy: userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.discounts).values({
    ...newDiscount,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  });

  return newDiscount;
}

export async function updateDiscount(data: UpdateDiscountDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.discounts)
    .set({
      ...rest,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.discounts.id, id));
}

export async function deleteDiscount(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.discounts)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.discounts.id, id));
}

export function useDiscounts() {
  const [data, setData] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDiscounts();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, isLoading: loading, error, refetch };
}

export function useDiscount(id: string) {
  const [data, setData] = useState<Discount | null>(null);
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

    fetchDiscount(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, isLoading: loading, loading, error, refetch };
}

export function useCreateDiscount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateDiscountDTO,
      options?: { onSuccess?: (data: Discount) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createDiscount(data);
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

export function useUpdateDiscount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateDiscountDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateDiscount(data);
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

export function useDeleteDiscount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteDiscount(id);
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
