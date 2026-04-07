import {
  transactionReturns,
  transactionReturnItems,
  customers,
  transactions,
  products,
  productVariants,
  categories,
  brands,
} from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/system/auth';
import { eq, and, isNull, like, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';
import { deductCustomerStats } from '@/utils/points';

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
  originalTransactionLocalRefId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    sellPrice: number;
    profit: number;
    purchasePrice?: number;
    productName?: string;
    productBarcode?: string;
    productCategory?: string;
    productBrand?: string;
    productUnit?: string;
    variantName?: string;
    variantCode?: string;
    variantNetto?: number;
  }>;
  returnType: string;
  note: string;
  employeeId?: string;
  employeeName?: string;
}): Promise<TransactionReturn> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.sellPrice, 0);
  const totalProfit = data.items.reduce((sum, item) => sum + item.profit, 0);

  const newReturn = {
    id,
    local_ref_id: `TR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    customerId: data.customerId || null,
    customerName,
    customerPhone,
    customerAddress,
    employeeId: data.employeeId || null,
    employeeName: data.employeeName || null,
    originalTransactionLocalRefId: data.originalTransactionLocalRefId || null,
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

    let productName: string | undefined = item.productName;
    let productBarcode: string | undefined = item.productBarcode;
    let productCategory: string | undefined = item.productCategory;
    let productBrand: string | undefined = item.productBrand;
    let productUnit: string | undefined = item.productUnit;
    let variantName: string | undefined = item.variantName;
    let variantCode: string | undefined = item.variantCode;
    let variantNetto: number | undefined = item.variantNetto;
    let purchasePrice: number = item.purchasePrice ?? 0;

    if (!productName) {
      const productResult = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      const product = productResult[0];
      if (product) {
        productName = product.name;
        productBarcode = product.barcode ?? undefined;
        productUnit = product.unit ?? undefined;
        purchasePrice = product.purchasePrice ?? 0;

        if (product.categoryId) {
          const catResult = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, product.categoryId))
            .limit(1);
          productCategory = catResult[0]?.name;
        }

        if (product.brandId) {
          const brandResult = await db
            .select({ name: brands.name })
            .from(brands)
            .where(eq(brands.id, product.brandId))
            .limit(1);
          productBrand = brandResult[0]?.name;
        }
      }
    }

    if (item.variantId && !variantName) {
      const variantResult = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      const variant = variantResult[0];
      if (variant) {
        variantName = variant.name;
        variantCode = variant.code;
        variantNetto = variant.netto ?? undefined;
      }
    }

    await db.insert(transactionReturnItems).values({
      id: itemId,
      transactionReturnId: id,
      productId: item.productId,
      productName: productName || null,
      productBarcode: productBarcode || null,
      productCategory: productCategory || null,
      productBrand: productBrand || null,
      productUnit: productUnit || null,
      variantId: item.variantId || null,
      variantName: variantName || null,
      variantCode: variantCode || null,
      variantNetto: variantNetto || null,
      quantity: item.quantity,
      sellPrice: item.sellPrice,
      purchasePrice: purchasePrice ?? 0,
      profit: item.profit,
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

  if (data.customerId) {
    await deductCustomerStats(data.customerId, totalAmount, totalProfit, 0);
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
