import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, desc } from 'drizzle-orm';

export type PaymentMethodType = 'CASH' | 'DEBT';

export interface Finance {
  id: string;
  local_ref_id: string | null;
  nominal: number;
  type: 'INCOME' | 'EXPENSES';
  expensesType: string | null;
  transactionDate: Date;
  status: 'DRAFT' | 'COMPLETED';
  note: string | null;
  inputToCashdrawer: boolean;
  userId: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateFinanceDTO {
  id?: string;
  type: 'INCOME' | 'EXPENSES';
  nominal: number;
  expensesType?: string;
  transactionDate: Date;
  status?: 'DRAFT' | 'COMPLETED';
  note?: string;
  inputToCashdrawer?: boolean;
}

export interface UpdateFinanceDTO extends Partial<CreateFinanceDTO> {
  id: string;
}

export async function fetchFinances(): Promise<Finance[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.finances)
    .where(and(eq(schema.finances.organizationId, orgId), isNull(schema.finances.deletedAt)))
    .orderBy(desc(schema.finances.transactionDate));

  return result as unknown as Finance[];
}

export async function fetchFinance(id: string): Promise<Finance | null> {
  const result = await db.select().from(schema.finances).where(eq(schema.finances.id, id)).limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Finance;
}

export async function createFinance(data: CreateFinanceDTO): Promise<Finance> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newFinance = {
    id,
    local_ref_id: null,
    nominal: data.nominal,
    type: data.type,
    expensesType: data.expensesType || null,
    transactionDate: data.transactionDate,
    status: data.status || 'COMPLETED',
    note: data.note || null,
    inputToCashdrawer: data.inputToCashdrawer || false,
    userId,
    userName: useAuthStore.getState().profile?.name || null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(schema.finances).values(newFinance as any);

  return newFinance as unknown as Finance;
}

export async function deleteFinance(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.finances)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.finances.id, id));
}

export function useFinances() {
  const [data, setData] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFinances();
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

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useFinance(id: string) {
  const [data, setData] = useState<Finance | null>(null);
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
      const result = await fetchFinance(id);
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

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useCreateFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateFinanceDTO,
      options?: { onSuccess?: (data: Finance) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createFinance(data);
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

export function useDeleteFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteFinance(id);
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
