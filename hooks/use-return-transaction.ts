import { transactionReturns, transactionReturnItems, customers } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/auth';
import { eq, and, isNull, like, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface TransactionReturn {
  id: string;
  local_ref_id?: string;
  customerId: string | null;
  customerName: string;
  totalAmount: number;
  returnType: string;
  note: string;
  status: string;
  createdByName?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  items?: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    sellPrice: number;
    totalPrice: number;
    productName?: string;
  }>;
}

export async function fetchTransactionReturns(params?: {
  search?: string;
  status?: string;
  customerId?: string;
}): Promise<TransactionReturn[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(transactionReturns.organizationId, orgId),
    isNull(transactionReturns.deletedAt),
  ];

  if (params?.search) {
    conditions.push(like(transactionReturns.customerName, `%${params.search}%`));
  }

  if (params?.status) {
    conditions.push(eq(transactionReturns.status, params.status as any));
  }

  if (params?.customerId) {
    conditions.push(eq(transactionReturns.customerId, params.customerId));
  }

  const result = await db
    .select()
    .from(transactionReturns)
    .where(and(...conditions))
    .orderBy(desc(transactionReturns.createdAt));

  const returnsWithItems: TransactionReturn[] = await Promise.all(
    result.map(async (r) => {
      const items = await db
        .select()
        .from(transactionReturnItems)
        .where(eq(transactionReturnItems.transactionReturnId, r.id));

      return {
        ...r,
        customerName: r.customerName || '',
        totalAmount: r.totalAmount || 0,
        returnType: r.returnType || 'CASH',
        note: r.note || '',
        status: r.status || 'PENDING',
        items: items.map((item) => ({
          ...item,
          sellPrice: item.sellPrice ?? 0,
          totalPrice: item.quantity * (item.sellPrice ?? 0),
        })),
      } as TransactionReturn;
    }),
  );

  return returnsWithItems;
}

export async function fetchTransactionReturn(id: string): Promise<TransactionReturn | null> {
  const result = await db
    .select()
    .from(transactionReturns)
    .where(eq(transactionReturns.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  const items = await db
    .select()
    .from(transactionReturnItems)
    .where(eq(transactionReturnItems.transactionReturnId, r.id));

  return {
    ...r,
    customerName: r.customerName || '',
    totalAmount: r.totalAmount || 0,
    returnType: r.returnType || 'CASH',
    note: r.note || '',
    status: r.status || 'PENDING',
    items: items.map((item) => ({
      ...item,
      sellPrice: item.sellPrice ?? 0,
      totalPrice: item.quantity * (item.sellPrice ?? 0),
    })),
  } as TransactionReturn;
}

export async function createTransactionReturn(data: {
  customerId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    sellPrice: number;
    profit: number;
  }>;
  returnType: string;
  note: string;
}): Promise<TransactionReturn> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  let customerName = '';
  if (data.customerId) {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1);
    customerName = customer[0]?.name || '';
  }

  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.sellPrice, 0);

  const newReturn = {
    id,
    local_ref_id: `TR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    customerId: data.customerId || null,
    customerName,
    totalAmount,
    returnType: data.returnType,
    note: data.note,
    status: 'PENDING',
    createdBy: userId,
    updatedBy: userId,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(transactionReturns).values(newReturn as any);

  for (const item of data.items) {
    const itemId = `tri_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(transactionReturnItems).values({
      id: itemId,
      transactionReturnId: id,
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      sellPrice: item.sellPrice,
      profit: item.profit,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      _dirty: true,
      _syncedAt: null,
    } as any);
  }

  return newReturn as unknown as TransactionReturn;
}

export function useTransactionReturns(params?: {
  search?: string;
  status?: string;
  customerId?: string;
}) {
  const [data, setData] = useState<TransactionReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchTransactionReturns(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.status, params?.customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useTransactionReturn(id: string) {
  const [data, setData] = useState<TransactionReturn | null>(null);
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
      const result = await fetchTransactionReturn(id);
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

export function useCreateTransactionReturn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        customerId?: string;
        items: Array<{
          productId: string;
          variantId?: string;
          quantity: number;
          sellPrice: number;
          profit: number;
        }>;
        returnType: string;
        note: string;
      },
      options?: { onSuccess?: (data: TransactionReturn) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createTransactionReturn(data);
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
