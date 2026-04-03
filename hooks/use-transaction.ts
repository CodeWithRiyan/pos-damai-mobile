import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { DateFilterType, InventoryTxType, ProductType, Status } from '@/constants';

export type ProductTypeEnum = 'DEFAULT' | 'MULTIUNIT' | 'VARIANTS';

export interface SalesTransaction {
  id: string;
  local_ref_id: string | null;
  customerId: string | null;
  employeeId: string | null;
  customerName?: string;
  employeeName?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  totalDiscount?: number;
  totalProfit?: number;
  paymentTypeId: string;
  paymentTypeName?: string;
  transactionDate: Date;
  status: string;
  note: string | null;
  returnId?: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items?: TransactionItem[];
}

export type Transaction = SalesTransaction;

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName?: string;
  productType?: ProductTypeEnum;
  variantId?: string | null;
  variantName?: string;
  quantity: number;
  sellPrice: number;
  discountAmount: number;
  purchasePrice: number;
  profit: number;
  note?: string | null;
}

export interface CreateTransactionDTO {
  id?: string;
  customerId?: string;
  employeeId?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  paymentTypeId: string;
  transactionDate: Date;
  status: string;
  note: string;
  returnId?: string;
  items: {
    product: {
      id: string;
      discount?: {
        nominal: number;
        type: 'FLAT' | 'PERCENTAGE';
        startDate: Date;
        endDate: Date;
      };
    };
    variant?: { id: string; name: string; netto?: number | null };
    quantity: number;
    tempSellPrice: number;
    isManualPrice?: boolean;
    note?: string;
  }[];
}

export interface TransactionFilterParams {
  customerId?: string;
  userId?: string;
  paymentTypeIds?: string[];
  dateType?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';
  startDate?: Date;
  endDate?: Date;
  showReturnData?: boolean;
  search?: string;
}

async function generateLocalRefId(tx: any, table: any, prefix: string): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const result = await tx
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(
      and(
        eq(table.organizationId, useAuthStore.getState().getOrganizationId()),
        like(table.local_ref_id, `${prefix}%`),
      ),
    );

  const count = (result[0]?.count || 0) + 1;
  return `${prefix}${dateStr}${String(count).padStart(4, '0')}`;
}

async function getDiscountedPrice(
  price: number,
  discount:
    | { nominal: number; type: 'FLAT' | 'PERCENTAGE'; startDate: Date; endDate: Date }
    | undefined,
): Promise<number> {
  if (!discount || !isDiscountActive(discount.startDate, discount.endDate)) {
    return price;
  }
  if (discount.type === 'FLAT') {
    return Math.max(0, price - discount.nominal);
  }
  return price * (1 - discount.nominal / 100);
}

function isDiscountActive(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  return now >= startDate && now <= endDate;
}

export async function fetchTransactions(params?: TransactionFilterParams): Promise<Transaction[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(schema.transactions.organizationId, orgId),
    isNull(schema.transactions.deletedAt),
  ] as any[];

  if (params?.customerId) {
    conditions.push(eq(schema.transactions.customerId, params.customerId));
  }

  if (params?.userId) {
    conditions.push(eq(schema.transactions.createdBy, params.userId));
  }

  if (!params?.showReturnData) {
    conditions.push(isNull(schema.transactions.returnId));
  }

  let transactionResult = await db
    .select()
    .from(schema.transactions)
    .where(and(...conditions))
    .orderBy(desc(schema.transactions.createdAt));

  if (params?.dateType) {
    const now = new Date();
    let filterStart: Date | undefined;
    let filterEnd: Date | undefined;

    if (params.dateType === DateFilterType.TODAY) {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (params.dateType === DateFilterType.THIS_WEEK) {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      filterStart = new Date(now.getFullYear(), now.getMonth(), diff);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
    } else if (params.dateType === DateFilterType.THIS_MONTH) {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (params.dateType === DateFilterType.THIS_YEAR) {
      filterStart = new Date(now.getFullYear(), 0, 1);
      filterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (params.dateType === DateFilterType.CUSTOM && params.startDate && params.endDate) {
      filterStart = new Date(
        params.startDate.getFullYear(),
        params.startDate.getMonth(),
        params.startDate.getDate(),
      );
      filterEnd = new Date(
        params.endDate.getFullYear(),
        params.endDate.getMonth(),
        params.endDate.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    if (filterStart && filterEnd) {
      transactionResult = transactionResult.filter((t) => {
        const date = t.createdAt || t.transactionDate;
        return date && date >= filterStart! && date <= filterEnd!;
      });
    }
  }

  if (params?.paymentTypeIds && params.paymentTypeIds.length > 0) {
    transactionResult = transactionResult.filter((t) =>
      params.paymentTypeIds!.includes(t.paymentTypeId),
    );
  }

  const transactionsWithDetails = await Promise.all(
    transactionResult.map(async (transaction) => {
      let customerName = 'Walk-in Customer';
      if (transaction.customerId) {
        const customer = await db
          .select({ name: schema.customers.name })
          .from(schema.customers)
          .where(eq(schema.customers.id, transaction.customerId))
          .limit(1);
        customerName = customer[0]?.name || 'Unknown';
      }

      let employeeName: string | undefined;
      if (transaction.employeeId) {
        const employee = await db
          .select({ name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, transaction.employeeId))
          .limit(1);
        employeeName = employee[0]?.name;
        customerName = employeeName ? `Karyawan: ${employeeName}` : 'Karyawan';
      }

      let paymentTypeName: string | undefined;
      const paymentType = await db
        .select({ name: schema.paymentTypes.name })
        .from(schema.paymentTypes)
        .where(eq(schema.paymentTypes.id, transaction.paymentTypeId))
        .limit(1);
      paymentTypeName = paymentType[0]?.name;

      const items = await db
        .select()
        .from(schema.transactionItems)
        .where(eq(schema.transactionItems.transactionId, transaction.id));

      return {
        ...transaction,
        customerName,
        employeeName,
        paymentTypeName,
        items: items as TransactionItem[],
      };
    }),
  );

  return transactionsWithDetails as Transaction[];
}

export async function fetchTransaction(id: string): Promise<Transaction | null> {
  const result = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const transaction = result[0];

  let customerName = 'Walk-in Customer';
  if (transaction.customerId) {
    const customer = await db
      .select({ name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, transaction.customerId))
      .limit(1);
    customerName = customer[0]?.name || 'Unknown';
  }

  let employeeName: string | undefined;
  if (transaction.employeeId) {
    const employee = await db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, transaction.employeeId))
      .limit(1);
    employeeName = employee[0]?.name;
  }

  let paymentTypeName: string | undefined;
  const paymentType = await db
    .select({ name: schema.paymentTypes.name })
    .from(schema.paymentTypes)
    .where(eq(schema.paymentTypes.id, transaction.paymentTypeId))
    .limit(1);
  paymentTypeName = paymentType[0]?.name;

  const items = await db
    .select()
    .from(schema.transactionItems)
    .where(eq(schema.transactionItems.transactionId, id));

  return {
    ...transaction,
    customerName,
    employeeName,
    paymentTypeName,
    items: items as TransactionItem[],
  } as Transaction;
}

export async function createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('ID Organisasi tidak ditemukan');

  const transactionId = data.id || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db.transaction(async (tx) => {
    const localRefId = await generateLocalRefId(tx, schema.transactions, 'TRX');

    const transactionValues = {
      id: transactionId,
      local_ref_id: localRefId,
      customerId: data.customerId || null,
      employeeId: data.employeeId || null,
      totalAmount: data.totalAmount,
      totalPaid: Number(data.totalPaid) || 0,
      commission: data.commission || 0,
      totalDiscount: 0,
      totalProfit: 0,
      paymentTypeId: data.paymentTypeId,
      transactionDate: data.transactionDate,
      status: data.status,
      note: data.note || null,
      returnId: data.returnId || null,
      organizationId: orgId,
      createdBy: userId,
      updatedBy: userId,
      createdAt: data.transactionDate || now,
      updatedAt: now,
      _dirty: true,
      _syncedAt: null,
    };

    if (data.id) {
      const existing = await tx
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, data.id))
        .limit(1);
      const finalRefId = existing[0]?.local_ref_id || localRefId;

      await tx
        .update(schema.transactions)
        .set({ ...transactionValues, local_ref_id: finalRefId })
        .where(eq(schema.transactions.id, data.id));

      await tx
        .delete(schema.transactionItems)
        .where(eq(schema.transactionItems.transactionId, data.id));

      await tx
        .delete(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.organizationId, orgId),
            like(schema.inventoryTransactions.local_ref_id, `${finalRefId}_%`),
          ),
        );
    } else {
      await tx.insert(schema.transactions).values(transactionValues);
    }

    let finalLocalRefId = data.id
      ? (
          await tx
            .select({ r: schema.transactions.local_ref_id })
            .from(schema.transactions)
            .where(eq(schema.transactions.id, transactionId))
            .limit(1)
        )[0]?.r || localRefId
      : localRefId;

    let totalDiscount = 0;
    let totalProfit = 0;

    for (const item of data.items) {
      const product = item.product;
      const productId = product.id.includes('-var_')
        ? product.id.substring(0, product.id.indexOf('-var_'))
        : product.id;

      let productData: any;
      if (item.product.id.includes('-var_')) {
        const baseId = item.product.id.substring(0, item.product.id.indexOf('-var_'));
        productData = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, baseId))
          .limit(1);
      } else {
        productData = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.product.id))
          .limit(1);
      }

      const purchasePrice = productData[0]?.purchasePrice || 0;
      let sellPrice = item.tempSellPrice;

      if (!item.isManualPrice && product.discount) {
        sellPrice = await getDiscountedPrice(item.tempSellPrice, product.discount);
      }

      const itemDiscount = item.isManualPrice ? 0 : item.tempSellPrice - sellPrice;
      const itemProfit = (sellPrice - purchasePrice) * item.quantity;

      totalDiscount += itemDiscount;
      totalProfit += itemProfit;

      await tx.insert(schema.transactionItems).values({
        id: `ti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: data.id || transactionId,
        productId: item.product.id,
        variantId: item.variant?.id || null,
        quantity: item.quantity,
        sellPrice,
        discountAmount: itemDiscount,
        purchasePrice,
        profit: itemProfit,
        note: item.note || null,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        _dirty: true,
        _syncedAt: null,
      });

      if (data.status === Status.COMPLETED) {
        const absQuantity = Math.abs(item.quantity);

        await tx.insert(schema.inventoryTransactions).values({
          id: `invtx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          local_ref_id: `${finalLocalRefId}_${productId}`,
          productId,
          type: item.quantity > 0 ? InventoryTxType.SALE : InventoryTxType.RETURN_SALE,
          quantity: item.quantity > 0 ? -absQuantity : absQuantity,
          organizationId: orgId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
          status: Status.COMPLETED,
          _dirty: true,
          _syncedAt: null,
        });
      }
    }

    await tx
      .update(schema.transactions)
      .set({ totalDiscount, totalProfit })
      .where(eq(schema.transactions.id, data.id || transactionId));
  });

  const result = await fetchTransaction(transactionId);
  return result!;
}

export async function deleteTransaction(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.transactions)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.transactions.id, id));
}

export async function fetchCustomerIdsWithTransactions(): Promise<string[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select({ customerId: schema.transactions.customerId })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.organizationId, orgId),
        isNull(schema.transactions.deletedAt),
        isNull(schema.transactions.returnId),
      ),
    );

  const uniqueIds = [...new Set(result.map((r) => r.customerId).filter(Boolean))];
  return uniqueIds as string[];
}

export async function fetchPurchasedProducts(customerId: string): Promise<any[]> {
  const transactions = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.customerId, customerId),
        isNull(schema.transactions.deletedAt),
        isNull(schema.transactions.returnId),
      ),
    );

  const productMap = new Map();

  for (const tx of transactions) {
    const items = await db
      .select()
      .from(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, tx.id));

    for (const item of items) {
      const productId = item.productId.includes('-var_')
        ? item.productId.substring(0, item.productId.indexOf('-var_'))
        : item.productId;

      if (!productMap.has(productId)) {
        const product = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, productId))
          .limit(1);

        if (product[0]) {
          productMap.set(productId, {
            ...product[0],
            lastSellPrice: item.sellPrice,
          });
        }
      } else {
        const existing = productMap.get(productId);
        if (item.sellPrice > (existing.lastSellPrice || 0)) {
          existing.lastSellPrice = item.sellPrice;
        }
      }
    }
  }

  return Array.from(productMap.values());
}

export function useTransactions(params?: TransactionFilterParams) {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactions(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    params?.customerId,
    params?.userId,
    params?.dateType,
    params?.startDate,
    params?.endDate,
    params?.showReturnData,
    params?.paymentTypeIds?.join(','),
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useTransaction(id: string) {
  const [data, setData] = useState<Transaction | null>(null);
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
      const result = await fetchTransaction(id);
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

export function useCustomerIdsWithTransactions() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomerIdsWithTransactions();
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

export function usePurchasedProducts(customerId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!customerId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchPurchasedProducts(customerId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useCreateTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateTransactionDTO,
      options?: { onSuccess?: (data: Transaction) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createTransaction(data);
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

export function useDeleteTransaction(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, opts?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteTransaction(id);
        options?.onSuccess?.();
        opts?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        opts?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useContinueDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      id: string,
      options?: {
        onSuccess?: (data: {
          transactionId: string;
          items: any[];
          customerId?: string;
          employeeId?: string;
        }) => void;
        onError?: (error: Error) => void;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await db
          .update(schema.transactions)
          .set({
            status: 'DRAFT',
            _dirty: true,
          })
          .where(eq(schema.transactions.id, id));

        // Fetch the transaction with items
        const transaction = await db
          .select()
          .from(schema.transactions)
          .where(eq(schema.transactions.id, id))
          .limit(1);

        if (transaction.length === 0) {
          throw new Error('Transaction not found');
        }

        const items = await db
          .select()
          .from(schema.transactionItems)
          .where(eq(schema.transactionItems.transactionId, id));

        const resultData = {
          transactionId: transaction[0].id,
          items: items.map((item) => ({
            ...item,
            product: { id: item.productId },
          })),
          customerId: transaction[0].customerId || undefined,
          employeeId: transaction[0].employeeId || undefined,
        };

        options?.onSuccess?.(resultData);
        return resultData;
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
