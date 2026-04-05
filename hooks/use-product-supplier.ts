import { purchases, purchaseItems } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface ProductSupplierTransaction {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: Date;
  note: string | null;
}

export interface SupplierSummary {
  supplierId: string;
  supplierName: string;
  totalQuantity: number;
  totalValue: number;
  lastPurchaseDate: Date | null;
  transactionCount: number;
}

export async function fetchProductSuppliers(productId?: string): Promise<SupplierSummary[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const purchasesData = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.organizationId, orgId), isNull(purchases.deletedAt)))
    .orderBy(desc(purchases.createdAt));

  const supplierMap = new Map<string, SupplierSummary>();

  for (const purchase of purchasesData) {
    const items = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchase.id));

    const productItem = items.find((item: any) =>
      productId ? item.productId === productId : true,
    );

    if (!productItem && productId) continue;

    const existing = supplierMap.get(purchase.supplierId);
    if (existing) {
      existing.totalQuantity += productItem?.quantity || 0;
      existing.totalValue += productItem?.totalPrice || 0;
      existing.transactionCount += 1;
      if (
        purchase.createdAt &&
        (!existing.lastPurchaseDate || purchase.createdAt > existing.lastPurchaseDate)
      ) {
        existing.lastPurchaseDate = purchase.createdAt;
      }
    } else {
      supplierMap.set(purchase.supplierId, {
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName || 'Unknown',
        totalQuantity: productItem?.quantity || 0,
        totalValue: productItem?.totalPrice || 0,
        lastPurchaseDate: purchase.createdAt,
        transactionCount: 1,
      });
    }
  }

  return Array.from(supplierMap.values());
}

export async function fetchProductSupplierTransactions(
  productId: string,
  supplierId?: string,
): Promise<ProductSupplierTransaction[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const purchaseConditions = [eq(purchases.organizationId, orgId), isNull(purchases.deletedAt)];

  if (supplierId) {
    purchaseConditions.push(eq(purchases.supplierId, supplierId));
  }

  const purchasesData = await db
    .select()
    .from(purchases)
    .where(and(...purchaseConditions))
    .orderBy(desc(purchases.createdAt));

  const transactions: ProductSupplierTransaction[] = [];

  for (const purchase of purchasesData) {
    const items = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchase.id));

    const filteredItems = items.filter(
      (item: any) =>
        item.productId === productId && (!supplierId || purchase.supplierId === supplierId),
    );

    for (const item of filteredItems) {
      transactions.push({
        id: item.id,
        purchaseId: purchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        purchaseDate: purchase.createdAt || new Date(),
        note: purchase.note,
      });
    }
  }

  return transactions;
}

export function useProductSuppliers(productId?: string) {
  const [data, setData] = useState<SupplierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProductSuppliers(productId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useProductSupplierTransactions(productId: string, supplierId?: string) {
  const [data, setData] = useState<ProductSupplierTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProductSupplierTransactions(productId, supplierId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, supplierId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useAssignProductsToSupplier() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      supplierId: string,
      productIds: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
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

  return { mutate, mutateAsync: mutate, isLoading, loading: isLoading, error };
}
