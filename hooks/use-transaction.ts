import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/system/auth';
import { and, desc, eq, isNull, like, sql } from 'drizzle-orm';
import {
  DateFilterType,
  InventoryTxType,
  ProductType,
  Status,
  DEFAULT_PAYMENT_TYPE,
} from '@/constants';
import { calculateEarnedPoints, updateCustomerStats } from '@/utils/points';
import { fetchProduct } from '@/hooks/use-product';

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
  paymentTypeName?: string;
  paymentTypeCommission?: number;
  paymentTypeCommissionType?: string;
  paymentTypeMinimalAmount?: number;
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
  customerName?: string;
  customerCode?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCategory?: string;
  employeeId?: string;
  employeeName?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  paymentTypeName?: string;
  paymentTypeCommission?: number;
  paymentTypeCommissionType?: string;
  paymentTypeMinimalAmount?: number;
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
      categoryId?: string;
      categoryName?: string;
      barcode?: string;
      brandId?: string;
      brandName?: string;
      unit?: string;
    };
    variant?: { id: string; name: string; code?: string; netto?: number | null };
    quantity: number;
    tempSellPrice: number;
    isManualPrice?: boolean;
    note?: string;
    productName?: string;
    itemNote?: string;
  }[];
}

export interface TransactionFilterParams {
  customerId?: string;
  userId?: string;
  paymentTypeNames?: string[];
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

  if (params?.paymentTypeNames && params.paymentTypeNames.length > 0) {
    transactionResult = transactionResult.filter((t) =>
      params.paymentTypeNames!.includes(t.paymentTypeName || ''),
    );
  }

  const transactionsWithDetails = await Promise.all(
    transactionResult.map(async (transaction) => {
      let customerName = transaction.customerName || 'Walk-in Customer';
      let employeeName: string | undefined = transaction.employeeName || undefined;

      if (transaction.employeeId && !transaction.employeeName) {
        const employee = await db
          .select({ name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, transaction.employeeId))
          .limit(1);
        employeeName = employee[0]?.name;
        customerName = employeeName ? `Karyawan: ${employeeName}` : 'Karyawan';
      } else if (transaction.employeeName) {
        customerName = `Karyawan: ${transaction.employeeName}`;
      } else if (transaction.customerId && !transaction.customerName) {
        const customer = await db
          .select({ name: schema.customers.name })
          .from(schema.customers)
          .where(eq(schema.customers.id, transaction.customerId))
          .limit(1);
        customerName = customer[0]?.name || 'Unknown';
      }

      const transactionItems = await db
        .select()
        .from(schema.transactionItems)
        .where(eq(schema.transactionItems.transactionId, transaction.id));

      return {
        ...transaction,
        customerName,
        employeeName,
        items: transactionItems as TransactionItem[],
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

  let customerName = transaction.customerName || 'Walk-in Customer';
  let employeeName: string | undefined = transaction.employeeName || undefined;

  if (transaction.employeeId && !transaction.employeeName) {
    const employee = await db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, transaction.employeeId))
      .limit(1);
    employeeName = employee[0]?.name;
  }

  if (transaction.employeeName && !transaction.customerName) {
    customerName = `Karyawan: ${transaction.employeeName}`;
  } else if (transaction.customerId && !transaction.customerName) {
    const customer = await db
      .select({ name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, transaction.customerId))
      .limit(1);
    customerName = customer[0]?.name || 'Unknown';
  }

  const items = await db
    .select()
    .from(schema.transactionItems)
    .where(eq(schema.transactionItems.transactionId, id));

  return {
    ...transaction,
    customerName,
    employeeName,
    items: items as TransactionItem[],
  } as Transaction;
}

export async function fetchTransactionByReturnId(returnId: string): Promise<Transaction | null> {
  const result = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.returnId, returnId))
    .limit(1);

  if (result.length === 0) return null;

  return fetchTransaction(result[0].id);
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
      customerCode: data.customerCode || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerAddress: data.customerAddress || null,
      employeeId: data.employeeId || null,
      employeeName: data.employeeName || null,
      totalAmount: data.totalAmount,
      totalPaid: Number(data.totalPaid) || 0,
      commission: data.commission || 0,
      totalDiscount: 0,
      totalProfit: 0,
      paymentTypeName: data.paymentTypeName || DEFAULT_PAYMENT_TYPE,
      paymentTypeCommission: data.paymentTypeCommission || 0,
      paymentTypeCommissionType: data.paymentTypeCommissionType || 'PERCENTAGE',
      paymentTypeMinimalAmount: data.paymentTypeMinimalAmount || 0,
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
      const netto = item.variant?.netto;
      const adjustedPurchasePrice = netto ? purchasePrice * netto : purchasePrice;
      let sellPrice = item.tempSellPrice;

      if (!item.isManualPrice && product.discount) {
        sellPrice = await getDiscountedPrice(item.tempSellPrice, product.discount);
      }

      const itemDiscount = item.isManualPrice ? 0 : item.tempSellPrice - sellPrice;
      const itemProfit = (sellPrice - adjustedPurchasePrice) * item.quantity;

      totalDiscount += itemDiscount;
      totalProfit += itemProfit;

      await tx.insert(schema.transactionItems).values({
        id: `ti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: data.id || transactionId,
        productId: item.product.id,
        productName: item.productName || null,
        productBarcode: item.product.barcode || null,
        productCategory: item.product.categoryName || null,
        productBrand: item.product.brandName || null,
        productUnit: item.product.unit || null,
        variantId: item.variant?.id || null,
        variantName: item.variant?.name || null,
        variantCode: item.variant?.code || null,
        variantNetto: item.variant?.netto || null,
        quantity: item.quantity,
        sellPrice,
        discountAmount: itemDiscount,
        purchasePrice,
        profit: itemProfit,
        itemNote: item.itemNote || null,
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
        const stockQuantity = netto ? absQuantity * netto : absQuantity;

        await tx.insert(schema.inventoryTransactions).values({
          id: `invtx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          local_ref_id: `${finalLocalRefId}_${item.variant?.id ? `${productId}_${item.variant.id}` : product.id}`,
          productId,
          productName: item.productName || null,
          productBarcode: item.product.barcode || null,
          productCategory: item.product.categoryName || null,
          productBrand: item.product.brandName || null,
          productUnit: item.product.unit || null,
          variantId: item.variant?.id || null,
          variantName: item.variant?.name || null,
          variantCode: item.variant?.code || null,
          variantNetto: item.variant?.netto || null,
          type: item.quantity > 0 ? InventoryTxType.SALE : InventoryTxType.RETURN_SALE,
          quantity: item.quantity > 0 ? -stockQuantity : stockQuantity,
          contextName: data.customerName || null,
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

    if (data.status === Status.COMPLETED && data.customerId) {
      const pointsResult = await calculateEarnedPoints(
        data.items.map((item) => ({
          productId: item.product.id,
          quantity: item.variant?.netto ? item.quantity * item.variant.netto : item.quantity,
          categoryId: item.product.categoryId,
        })),
        data.customerCategory || 'RETAIL',
      );

      if (pointsResult.totalPoints > 0) {
        await updateCustomerStats(
          data.customerId,
          data.totalAmount,
          totalProfit,
          pointsResult.totalPoints,
        );
      } else {
        await tx
          .update(schema.customers)
          .set({
            totalTransactions: sql`${schema.customers.totalTransactions} + 1`,
            totalRevenue: sql`${schema.customers.totalRevenue} + ${data.totalAmount}`,
            totalProfit: sql`${schema.customers.totalProfit} + ${totalProfit}`,
            _dirty: true,
          })
          .where(eq(schema.customers.id, data.customerId));
      }
    }
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
  const orgId = useAuthStore.getState().getOrganizationId();

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

      if (productMap.has(productId)) continue;

      // 1. Try to find real product by ID
      let realProduct = await db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.id, productId), isNull(schema.products.deletedAt)))
        .limit(1);

      // 2. If not found by ID, try by name
      if (!realProduct[0] && item.productName && orgId) {
        realProduct = await db
          .select()
          .from(schema.products)
          .where(
            and(
              eq(schema.products.name, item.productName),
              eq(schema.products.organizationId, orgId),
              isNull(schema.products.deletedAt),
            ),
          )
          .limit(1);
      }

      if (realProduct[0]) {
        const resolvedId = realProduct[0].id;

        const sellPrices = await db
          .select()
          .from(schema.productPrices)
          .where(eq(schema.productPrices.productId, resolvedId));

        const variants = await db
          .select()
          .from(schema.productVariants)
          .where(
            and(
              eq(schema.productVariants.productId, resolvedId),
              isNull(schema.productVariants.deletedAt),
            ),
          );

        const invTxs = await db
          .select()
          .from(schema.inventoryTransactions)
          .where(
            and(
              eq(schema.inventoryTransactions.productId, resolvedId),
              eq(schema.inventoryTransactions.status, Status.COMPLETED),
            ),
          );
        const stock = invTxs.reduce((sum, t) => sum + t.quantity, 0);

        productMap.set(productId, {
          ...realProduct[0],
          code: realProduct[0].barcode,
          sellPrices,
          variants,
          stock,
        });
      } else {
        // 3. Not found — use transaction item data, mark as _notFound
        productMap.set(productId, {
          id: productId,
          name: item.productName || 'Unknown',
          barcode: item.productBarcode,
          code: item.productBarcode,
          type: 'DEFAULT',
          purchasePrice: item.purchasePrice || 0,
          unit: item.productUnit,
          categoryId: null,
          brandId: null,
          sellPrices: [
            {
              id: `temp_${productId}`,
              label: 'Default',
              price: item.sellPrice || 0,
              minimumPurchase: 0,
              type: 'RETAIL',
            },
          ],
          variants: [],
          stock: 0,
          lastSellPrice: item.sellPrice,
          _notFound: true,
        });
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
    params?.paymentTypeNames?.join(','),
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

export function useTransactionByReturnId(returnId: string) {
  const [data, setData] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!returnId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactionByReturnId(returnId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

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

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await fetchProduct(item.productId);
            return {
              ...item,
              product,
              variant: item.variantId
                ? {
                    id: item.variantId,
                    name: item.variantName || '',
                    code: item.variantCode || '',
                    netto: item.variantNetto,
                  }
                : undefined,
            };
          }),
        );

        const resultData = {
          transactionId: transaction[0].id,
          items: itemsWithProducts,
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
