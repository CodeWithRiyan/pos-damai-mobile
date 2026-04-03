import { payables, payableRealizations, suppliers, users } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/auth';
import { eq, and, isNull, like, desc, sql, sum } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface Payable {
  id: string;
  supplierId: string;
  supplierName: string;
  nominal: number;
  totalRealization: number;
  totalPayable: number;
  status: string;
  createdAt: Date | null;
  dueDate: Date | null;
  nearestDueDate?: Date | null;
  note?: string;
  supplier?: { name: string; phone?: string | null; address?: string | null };
  realizations?: Array<{
    id: string;
    nominal: number;
    createdAt: Date;
    realizationDate?: Date;
    note?: string;
  }>;
  local_ref_id?: string;
}

export interface PayableBySupplier {
  supplierId: string;
  supplierName: string;
  phone?: string | null;
  address?: string | null;
  totalNominal: number;
  totalRealization: number;
  totalPayable: number;
  nearestDueDate?: Date | null;
  payables: Payable[];
}

export async function fetchPayables(params?: {
  search?: string;
  status?: string;
}): Promise<Payable[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [eq(payables.organizationId, orgId), isNull(payables.deletedAt)];

  if (params?.search) {
    conditions.push(like(payables.supplierName, `%${params.search}%`));
  }

  if (params?.status) {
    conditions.push(eq(payables.status, params.status as any));
  }

  const result = await db
    .select()
    .from(payables)
    .where(and(...conditions))
    .orderBy(desc(payables.createdAt));

  const payablesWithRealizations: Payable[] = await Promise.all(
    result.map(async (p) => {
      const realizations = await db
        .select()
        .from(payableRealizations)
        .where(eq(payableRealizations.payableId, p.id));

      const totalRealization = realizations.reduce((sum, r) => sum + (r.nominal || 0), 0);

      return {
        ...p,
        supplierName: p.supplierName || '',
        totalRealization,
        totalPayable: (p.nominal || 0) - totalRealization,
        status: p.status || 'PENDING',
        realizations: realizations.map((r) => ({
          id: r.id,
          nominal: r.nominal,
          createdAt: r.createdAt,
          realizationDate: r.realizationDate,
          note: r.note,
        })),
      } as Payable;
    }),
  );

  return payablesWithRealizations;
}

export async function fetchPayableBySupplier(): Promise<PayableBySupplier[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const allPayables = await fetchPayables();

  const grouped = new Map<string, Payable[]>();
  for (const payable of allPayables) {
    const existing = grouped.get(payable.supplierId) || [];
    existing.push(payable);
    grouped.set(payable.supplierId, existing);
  }

  const result: PayableBySupplier[] = [];
  for (const [supplierId, payablesList] of grouped) {
    const totalNominal = payablesList.reduce((sum, p) => sum + (p.nominal || 0), 0);
    const totalRealization = payablesList.reduce((sum, p) => sum + (p.totalRealization || 0), 0);
    const totalPayable = totalNominal - totalRealization;
    const supplierName = payablesList[0]?.supplierName || 'Unknown';
    const nearestDueDate = payablesList.reduce(
      (nearest, p) => {
        if (!p.dueDate) return nearest;
        if (!nearest || p.dueDate < nearest) return p.dueDate;
        return nearest;
      },
      null as Date | null,
    );
    result.push({
      supplierId,
      supplierName,
      phone: payablesList[0]?.supplier?.phone || null,
      address: payablesList[0]?.supplier?.address || null,
      totalNominal,
      totalRealization,
      totalPayable,
      nearestDueDate,
      payables: payablesList,
    });
  }

  return result;
}

export async function fetchPayableDetail(id: string): Promise<Payable | null> {
  const result = await db.select().from(payables).where(eq(payables.id, id)).limit(1);

  if (result.length === 0) return null;

  const p = result[0];
  const realizations = await db
    .select()
    .from(payableRealizations)
    .where(eq(payableRealizations.payableId, p.id));

  const totalRealization = realizations.reduce((sum, r) => sum + (r.nominal || 0), 0);

  return {
    ...p,
    supplierName: p.supplierName || '',
    totalRealization,
    totalPayable: (p.nominal || 0) - totalRealization,
    status: p.status || 'PENDING',
    realizations: realizations.map((r) => ({
      id: r.id,
      nominal: r.nominal,
      createdAt: r.createdAt,
      realizationDate: r.realizationDate,
      note: r.note,
    })),
  } as Payable;
}

export async function createPayable(data: {
  supplierId: string;
  nominal: number;
  dueDate?: Date | string | null;
  note?: string;
}): Promise<Payable> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const supplier = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, data.supplierId))
    .limit(1);

  const newPayable = {
    id,
    local_ref_id: `PAY-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    nominal: data.nominal,
    dueDate: data.dueDate
      ? typeof data.dueDate === 'string'
        ? new Date(data.dueDate)
        : data.dueDate
      : null,
    note: data.note || null,
    supplierId: data.supplierId,
    supplierName: supplier[0]?.name || '',
    status: 'PENDING',
    createdBy: userId,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(payables).values(newPayable as any);

  return {
    ...newPayable,
    totalRealization: 0,
    totalPayable: data.nominal,
  } as Payable;
}

export async function createPayableRealization(data: {
  payableId: string;
  nominal: number;
  realizationDate: Date;
  paymentMethodId: string;
  note?: string;
}): Promise<void> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  await db.insert(payableRealizations).values({
    id,
    local_ref_id: `PR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    payableId: data.payableId,
    nominal: data.nominal,
    realizationDate: data.realizationDate,
    paymentMethodId: data.paymentMethodId,
    note: data.note || null,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  } as any);
}

export function usePayables(params?: { search?: string; status?: string }) {
  const [data, setData] = useState<Payable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPayables(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function usePayableList() {
  const [data, setData] = useState<PayableBySupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPayableBySupplier();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function usePayableBySupplier(supplierId?: string) {
  const [data, setData] = useState<Payable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPayables({ search: supplierId ? undefined : undefined });
      const filtered = supplierId ? result.filter((p) => p.supplierId === supplierId) : result;
      setData(filtered);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function usePayableDetail(id: string) {
  const [data, setData] = useState<Payable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPayableDetail(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useCreatePayable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: { supplierId: string; nominal: number; dueDate?: Date; note?: string },
      options?: { onSuccess?: (data: Payable) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createPayable(data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}

export function useUpdatePayable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        id: string;
        nominal?: number;
        dueDate?: Date | string | null;
        note?: string;
        status?: string;
      },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        const { id, nominal, dueDate, note, status } = data;
        const updateFields: any = {
          updatedAt: now,
          _dirty: true,
        };
        if (nominal !== undefined) updateFields.nominal = nominal;
        if (dueDate !== undefined)
          updateFields.dueDate = dueDate
            ? typeof dueDate === 'string'
              ? new Date(dueDate)
              : dueDate
            : null;
        if (note !== undefined) updateFields.note = note;
        if (status !== undefined) updateFields.status = status;

        await db.update(payables).set(updateFields).where(eq(payables.id, id));
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}

export function useDeletePayable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        await db
          .update(payables)
          .set({
            deletedAt: now,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(payables.id, id));
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}

export function useBulkDeletePayable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        await Promise.all(
          ids.map(async (id) => {
            await db
              .update(payables)
              .set({
                deletedAt: now,
                updatedAt: now,
                _dirty: true,
              })
              .where(eq(payables.id, id));
          }),
        );
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}

export function useCreatePayableRealization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        payableId: string;
        nominal: number;
        realizationDate: Date;
        paymentMethodId: string;
        note?: string;
      },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        await createPayableRealization(data);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}

export function useBulkDeletePayableBySupplier() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      supplierId: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        const allPayables = await db
          .select()
          .from(payables)
          .where(and(eq(payables.supplierId, supplierId), isNull(payables.deletedAt)));

        for (const p of allPayables) {
          await db
            .update(payables)
            .set({
              deletedAt: now,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(payables.id, p.id));
        }
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}
