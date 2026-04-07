import { receivables, receivableRealizations, customers, users, paymentTypes, transactions, transactionItems as transactionItemsTable } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/system/auth';
import { eq, and, isNull, like, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface TransactionItemData {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receivable {
  id: string;
  userId: string;
  userName?: string;
  customerId?: string;
  customerName: string;
  nominal: number;
  totalRealization: number;
  totalReceivable: number;
  status: string;
  createdAt: Date | null;
  dueDate: Date | null;
  nearestDueDate?: Date | null;
  note?: string;
  transactionId?: string;
  user?: { id: string; name: string; firstName?: string };
  realizations?: Array<{
    id: string;
    nominal: number;
    createdAt: Date;
    realizationDate?: Date;
    note?: string;
  }>;
  transactionItems?: TransactionItemData[];
}

export interface ReceivableByUser {
  userId: string;
  userName: string;
  totalNominal: number;
  receivables: Receivable[];
}

export async function fetchReceivables(params?: {
  search?: string;
  status?: string;
}): Promise<Receivable[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [eq(receivables.organizationId, orgId), isNull(receivables.deletedAt)];

  if (params?.search) {
    conditions.push(like(receivables.customerName, `%${params.search}%`));
  }

  if (params?.status) {
    conditions.push(eq(receivables.status, params.status as any));
  }

  const result = await db
    .select()
    .from(receivables)
    .where(and(...conditions))
    .orderBy(desc(receivables.createdAt));

  const receivablesWithRealizations: Receivable[] = await Promise.all(
    result.map(async (r) => {
      const realizations = await db
        .select()
        .from(receivableRealizations)
        .where(eq(receivableRealizations.receivableId, r.id));

      const totalRealization = realizations.reduce((sum, rlz) => sum + (rlz.nominal || 0), 0);

      let transactionItemsData: TransactionItemData[] = [];
      if (r.transactionId) {
        const items = await db
          .select()
          .from(transactionItemsTable)
          .where(eq(transactionItemsTable.transactionId, r.transactionId));
        transactionItemsData = items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || '',
          quantity: item.quantity,
          unitPrice: item.sellPrice,
          totalPrice: item.quantity * item.sellPrice,
        }));
      }

      return {
        ...r,
        customerName: r.customerName || '',
        totalRealization,
        totalReceivable: (r.nominal || 0) - totalRealization,
        status: r.status || 'PENDING',
        transactionId: r.transactionId || undefined,
        user: r.userName
          ? {
              id: r.userId,
              name: r.userName,
              firstName: r.userName.split(' ')[0],
            }
          : undefined,
        realizations: realizations.map((rlz) => ({
          id: rlz.id,
          nominal: rlz.nominal,
          createdAt: rlz.createdAt,
          realizationDate: rlz.realizationDate,
          note: rlz.note,
        })),
        transactionItems: transactionItemsData,
      } as Receivable;
    }),
  );

  return receivablesWithRealizations;
}

export async function fetchReceivableByUser(): Promise<ReceivableByUser[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const allReceivables = await fetchReceivables();

  const grouped = new Map<string, Receivable[]>();
  for (const receivable of allReceivables) {
    const existing = grouped.get(receivable.userId) || [];
    existing.push(receivable);
    grouped.set(receivable.userId, existing);
  }

  const result: ReceivableByUser[] = [];
  for (const [userId, receivablesList] of grouped) {
    const totalNominal = receivablesList.reduce((sum, r) => sum + (r.nominal || 0), 0);
    const userName = receivablesList[0]?.user?.name || 'Unknown';
    result.push({
      userId,
      userName,
      totalNominal,
      receivables: receivablesList,
    });
  }

  return result;
}

export async function fetchReceivableDetail(id: string): Promise<Receivable | null> {
  const result = await db.select().from(receivables).where(eq(receivables.id, id)).limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  const realizations = await db
    .select()
    .from(receivableRealizations)
    .where(eq(receivableRealizations.receivableId, r.id));

  const totalRealization = realizations.reduce((sum, rlz) => sum + (rlz.nominal || 0), 0);

  let transactionItemsData: TransactionItemData[] = [];
  if (r.transactionId) {
    const items = await db
      .select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transactionId, r.transactionId));
    transactionItemsData = items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || '',
      quantity: item.quantity,
      unitPrice: item.sellPrice,
      totalPrice: item.quantity * item.sellPrice,
    }));
  }

  return {
    ...r,
    customerName: r.customerName || '',
    totalRealization,
    totalReceivable: (r.nominal || 0) - totalRealization,
    status: r.status || 'PENDING',
    transactionId: r.transactionId || undefined,
    user: r.userName
      ? {
          id: r.userId,
          name: r.userName,
          firstName: r.userName.split(' ')[0],
        }
      : undefined,
    realizations: realizations.map((rlz) => ({
      id: rlz.id,
      nominal: rlz.nominal,
      createdAt: rlz.createdAt,
      realizationDate: rlz.realizationDate,
      note: rlz.note,
    })),
    transactionItems: transactionItemsData,
  } as Receivable;
}

export async function createReceivable(data: {
  userId: string;
  customerId?: string;
  nominal: number;
  dueDate?: Date | string | null;
  note?: string;
  transactionId?: string;
}): Promise<Receivable> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  let customerName = '';
  let customerPhone: string | null = null;
  let customerAddress: string | null = null;
  if (data.customerId) {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1);
    customerName = customer[0]?.name || '';
    customerPhone = customer[0]?.phone || null;
    customerAddress = customer[0]?.address || null;
  }

  const userResult = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);
  const userName = userResult[0]?.name || null;

  const newReceivable = {
    id,
    local_ref_id: `REC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    nominal: data.nominal,
    dueDate: data.dueDate
      ? typeof data.dueDate === 'string'
        ? new Date(data.dueDate)
        : data.dueDate
      : null,
    note: data.note || null,
    userId: data.userId,
    userName,
    customerId: data.customerId || null,
    customerName,
    customerPhone,
    customerAddress,
    status: 'PENDING',
    transactionId: data.transactionId || null,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(receivables).values(newReceivable as any);

  return {
    ...newReceivable,
    totalRealization: 0,
    totalReceivable: data.nominal,
  } as Receivable;
}

export async function createReceivableRealization(data: {
  receivableId: string;
  nominal: number;
  realizationDate: Date;
  paymentMethodId: string;
  paymentMethodName?: string;
  note?: string;
}): Promise<void> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  let paymentMethodName = data.paymentMethodName;
  if (!paymentMethodName) {
    const pmResult = await db
      .select({ name: paymentTypes.name })
      .from(paymentTypes)
      .where(eq(paymentTypes.id, data.paymentMethodId))
      .limit(1);
    paymentMethodName = pmResult[0]?.name;
  }

  await db.insert(receivableRealizations).values({
    id,
    local_ref_id: `RR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    receivableId: data.receivableId,
    nominal: data.nominal,
    realizationDate: data.realizationDate,
    paymentMethodId: data.paymentMethodId,
    paymentMethodName,
    note: data.note || null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  } as any);
}

export function useReceivables(params?: { search?: string; status?: string }) {
  const [data, setData] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchReceivables(params);
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

export function useReceivableDetail(id: string) {
  const [data, setData] = useState<Receivable | null>(null);
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
      const result = await fetchReceivableDetail(id);
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

export function useReceivableByUser(userId?: string) {
  const [data, setData] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchReceivables({ search: undefined });
      const filtered = userId ? result.filter((r) => r.userId === userId) : result;
      setData(filtered);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useCreateReceivable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        userId: string;
        customerId?: string;
        nominal: number;
        dueDate?: Date;
        note?: string;
        transactionId?: string;
      },
      options?: { onSuccess?: (data: Receivable) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createReceivable(data);
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

export function useUpdateReceivable() {
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

        await db.update(receivables).set(updateFields).where(eq(receivables.id, id));
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

export function useDeleteReceivable() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        await db
          .update(receivables)
          .set({
            deletedAt: now,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(receivables.id, id));
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

export function useCreateReceivableRealization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        receivableId: string;
        nominal: number;
        realizationDate: Date;
        paymentMethodId: string;
        paymentMethodName?: string;
        note?: string;
      },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        await createReceivableRealization(data);
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

export function useReceivableList() {
  return useReceivables();
}

export function useBulkDeleteReceivableByUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      userId: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        const allReceivables = await db
          .select()
          .from(receivables)
          .where(and(eq(receivables.userId, userId), isNull(receivables.deletedAt)));

        for (const r of allReceivables) {
          await db
            .update(receivables)
            .set({
              deletedAt: now,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(receivables.id, r.id));
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

export function useBulkDeleteReceivable() {
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
              .update(receivables)
              .set({
                deletedAt: now,
                updatedAt: now,
                _dirty: true,
              })
              .where(eq(receivables.id, id));
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
