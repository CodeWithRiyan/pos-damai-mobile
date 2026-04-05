import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, inArray } from 'drizzle-orm';

export interface PaymentType {
  id: string;
  name: string;
  commission: number;
  commissionType: 'FLAT' | 'PERCENTAGE';
  isDefault: boolean;
  minimalAmount: number;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreatePaymentTypeDTO {
  name: string;
  commission?: number;
  commissionType?: 'FLAT' | 'PERCENTAGE';
  isDefault?: boolean;
  minimalAmount?: number;
}

export interface UpdatePaymentTypeDTO extends Partial<CreatePaymentTypeDTO> {
  id: string;
}

export async function fetchPaymentTypes(): Promise<PaymentType[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.paymentTypes)
    .where(
      and(eq(schema.paymentTypes.organizationId, orgId), isNull(schema.paymentTypes.deletedAt)),
    );
  return result as PaymentType[];
}

export async function fetchPaymentType(id: string): Promise<PaymentType | null> {
  const result = await db
    .select()
    .from(schema.paymentTypes)
    .where(eq(schema.paymentTypes.id, id))
    .limit(1);
  return (result[0] as PaymentType) || null;
}

export async function refetchPaymentTypeById(id: string): Promise<PaymentType | null> {
  return fetchPaymentType(id);
}

export async function createPaymentType(data: CreatePaymentTypeDTO): Promise<PaymentType> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) {
    throw new Error('Organization ID not found');
  }

  const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  const newPaymentType: PaymentType = {
    id,
    name: data.name,
    commission: data.commission ?? 0,
    commissionType: data.commissionType ?? 'PERCENTAGE',
    isDefault: data.isDefault ?? false,
    minimalAmount: data.minimalAmount ?? 0,
    organizationId: orgId,
    createdBy: userId ?? null,
    updatedBy: userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.paymentTypes).values({
    ...newPaymentType,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  });

  return newPaymentType;
}

export async function updatePaymentType(data: UpdatePaymentTypeDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();

  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.paymentTypes)
    .set({
      ...rest,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.paymentTypes.id, id));
}

export async function deletePaymentType(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.paymentTypes)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.paymentTypes.id, id));
}

export async function bulkDeletePaymentTypes(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.paymentTypes)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(inArray(schema.paymentTypes.id, ids));
}

export async function setDefaultPaymentType(id: string): Promise<void> {
  const orgId = useAuthStore.getState().getOrganizationId();
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.paymentTypes)
      .set({ isDefault: false, updatedAt: now, _dirty: true })
      .where(
        and(eq(schema.paymentTypes.organizationId, orgId), isNull(schema.paymentTypes.deletedAt)),
      );

    await tx
      .update(schema.paymentTypes)
      .set({ isDefault: true, updatedBy: userId ?? null, updatedAt: now, _dirty: true })
      .where(eq(schema.paymentTypes.id, id));
  });
}

export function usePaymentTypes() {
  const [data, setData] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPaymentTypes();
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

export function usePaymentType(id: string) {
  const [data, setData] = useState<PaymentType | null>(null);
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

    fetchPaymentType(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, isLoading: loading, loading, error, refetch };
}

export function useCreatePaymentType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreatePaymentTypeDTO,
      options?: { onSuccess?: (data: PaymentType) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createPaymentType(data);
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

export function useUpdatePaymentType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdatePaymentTypeDTO,
      options?: {
        onSuccess?: (data: UpdatePaymentTypeDTO) => void;
        onError?: (error: Error) => void;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updatePaymentType(data);
        options?.onSuccess?.(data);
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

export function useDeletePaymentType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deletePaymentType(id);
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

export function useSetDefaultPaymentType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await setDefaultPaymentType(id);
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

export function useBulkDeletePaymentType() {
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
        await bulkDeletePaymentTypes(ids);
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
