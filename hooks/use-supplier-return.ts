import {
  purchaseReturns,
  purchaseReturnItems,
  suppliers,
  products,
  categories,
  brands,
  productVariants,
} from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/auth';
import { eq, and, isNull, like, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface SupplierReturn {
  id: string;
  local_ref_id?: string;
  supplierId: string;
  supplierName: string;
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
    quantity: number;
    purchasePrice: number;
    totalPrice: number;
    productName?: string;
    note?: string;
  }>;
}

export async function fetchSupplierReturns(params?: {
  search?: string;
  status?: string;
  supplierId?: string;
}): Promise<SupplierReturn[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [eq(purchaseReturns.organizationId, orgId), isNull(purchaseReturns.deletedAt)];

  if (params?.search) {
    conditions.push(like(purchaseReturns.supplierName, `%${params.search}%`));
  }

  if (params?.status) {
    conditions.push(eq(purchaseReturns.status, params.status as any));
  }

  if (params?.supplierId) {
    conditions.push(eq(purchaseReturns.supplierId, params.supplierId));
  }

  const result = await db
    .select()
    .from(purchaseReturns)
    .where(and(...conditions))
    .orderBy(desc(purchaseReturns.createdAt));

  const returnsWithItems: SupplierReturn[] = await Promise.all(
    result.map(async (r) => {
      const items = await db
        .select()
        .from(purchaseReturnItems)
        .where(eq(purchaseReturnItems.purchaseReturnId, r.id));

      return {
        ...r,
        supplierName: r.supplierName || '',
        totalAmount: r.totalAmount || 0,
        returnType: r.returnType || 'CASH',
        note: r.note || '',
        status: r.status || 'PENDING',
        items: items.map((item) => ({
          ...item,
          purchasePrice: item.purchasePrice ?? 0,
          totalPrice: item.quantity * (item.purchasePrice ?? 0),
        })),
      } as SupplierReturn;
    }),
  );

  return returnsWithItems;
}

export async function fetchSupplierReturn(id: string): Promise<SupplierReturn | null> {
  const result = await db.select().from(purchaseReturns).where(eq(purchaseReturns.id, id)).limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  const items = await db
    .select()
    .from(purchaseReturnItems)
    .where(eq(purchaseReturnItems.purchaseReturnId, r.id));

  return {
    ...r,
    supplierName: r.supplierName || '',
    totalAmount: r.totalAmount || 0,
    returnType: r.returnType || 'CASH',
    note: r.note || '',
    status: r.status || 'PENDING',
    items: items.map((item) => ({
      ...item,
      purchasePrice: item.purchasePrice ?? 0,
      totalPrice: item.quantity * (item.purchasePrice ?? 0),
    })),
  } as SupplierReturn;
}

export async function createSupplierReturn(data: {
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    purchasePrice: number;
    productName?: string;
    note?: string;
  }>;
  returnType: string;
  note: string;
}): Promise<SupplierReturn> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const supplier = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, data.supplierId))
    .limit(1);

  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);

  const newReturn = {
    id,
    local_ref_id: `SR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    supplierId: data.supplierId,
    supplierName: supplier[0]?.name || '',
    supplierPhone: supplier[0]?.phone || null,
    supplierAddress: supplier[0]?.address || null,
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

  await db.insert(purchaseReturns).values(newReturn as any);

  for (const item of data.items) {
    const itemId = `sri_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let productName = item.productName;
    let productBarcode: string | undefined;
    let productCategory: string | undefined;
    let productBrand: string | undefined;
    let productUnit: string | undefined;
    let variantId: string | undefined;
    let variantName: string | undefined;
    let variantCode: string | undefined;
    let variantNetto: number | undefined;

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

    await db.insert(purchaseReturnItems).values({
      id: itemId,
      purchaseReturnId: id,
      productId: item.productId,
      productName: productName || null,
      productBarcode: productBarcode || null,
      productCategory: productCategory || null,
      productBrand: productBrand || null,
      productUnit: productUnit || null,
      variantId: variantId || null,
      variantName: variantName || null,
      variantCode: variantCode || null,
      variantNetto: variantNetto || null,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      note: item.note || null,
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

  return newReturn as unknown as SupplierReturn;
}

export function useSupplierReturns(params?: {
  search?: string;
  status?: string;
  supplierId?: string;
}) {
  const [data, setData] = useState<SupplierReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSupplierReturns(params);
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

export function useSupplierReturn(id: string) {
  const [data, setData] = useState<SupplierReturn | null>(null);
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
      const result = await fetchSupplierReturn(id);
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

export function useCreateSupplierReturn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        supplierId: string;
        items: Array<{
          productId: string;
          quantity: number;
          purchasePrice: number;
          productName?: string;
          note?: string;
        }>;
        returnType: string;
        note: string;
      },
      options?: { onSuccess?: (data: SupplierReturn) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createSupplierReturn(data);
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

export const usePurchaseReturns = useSupplierReturns;
export const usePurchaseReturn = useSupplierReturn;
export const useCreatePurchaseReturn = useCreateSupplierReturn;
