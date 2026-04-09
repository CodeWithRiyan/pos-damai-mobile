import { storeSupplies, storeSupplyItems, inventoryTransactions } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/system/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';
import { InventoryTxType, Status } from '@/constants';

export interface StoreSupply {
  id: string;
  local_ref_id: string;
  date: Date;
  note: string | null;
  status: string;
  totalAmount: number;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    usage: number;
    quantitySystem: number;
    quantityPhysical: number;
    purchasePrice: number;
    productName?: string;
  }>;
}

export async function fetchStoreSupplies(): Promise<StoreSupply[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(storeSupplies)
    .where(and(eq(storeSupplies.organizationId, orgId), isNull(storeSupplies.deletedAt)))
    .orderBy(desc(storeSupplies.createdAt));

  return result as unknown as StoreSupply[];
}

export async function fetchStoreSupply(id: string): Promise<StoreSupply | null> {
  const result = await db.select().from(storeSupplies).where(eq(storeSupplies.id, id)).limit(1);

  if (result.length === 0) return null;

  const items = await db
    .select()
    .from(storeSupplyItems)
    .where(eq(storeSupplyItems.storeSupplyId, result[0].id));

  return {
    ...result[0],
    items: items.map((item) => ({
      ...item,
      quantity: item.quantitySystem || 0,
      unitPrice: item.purchasePrice || 0,
      totalPrice: (item.quantitySystem || 0) * (item.purchasePrice || 0),
    })),
  } as unknown as StoreSupply;
}

export async function createStoreSupply(data: {
  date: Date;
  note?: string;
  items: Array<{
    productId: string;
    productName?: string;
    productBarcode?: string;
    productCategory?: string;
    productBrand?: string;
    productUnit?: string;
    variantId?: string;
    variantName?: string;
    variantCode?: string;
    variantNetto?: number;
    quantity: number;
    purchasePrice: number;
  }>;
}): Promise<StoreSupply> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);

  const newSupply = {
    id,
    local_ref_id: `SS-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    date: data.date,
    note: data.note || null,
    status: 'PENDING',
    totalAmount,
    createdBy: userId,
    updatedBy: userId,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(storeSupplies).values(newSupply as any);

  for (const item of data.items) {
    const transactions = await db
      .select()
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.productId, item.productId),
          eq(inventoryTransactions.status, Status.COMPLETED),
        ),
      );
    const systemStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

    const itemId = `ssi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(storeSupplyItems).values({
      id: itemId,
      storeSupplyId: id,
      productId: item.productId,
      productName: item.productName || null,
      productBarcode: item.productBarcode || null,
      productCategory: item.productCategory || null,
      productBrand: item.productBrand || null,
      productUnit: item.productUnit || null,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      variantCode: item.variantCode || null,
      variantNetto: item.variantNetto || null,
      quantitySystem: systemStock,
      quantityPhysical: item.quantity,
      usage: item.quantity,
      purchasePrice: item.purchasePrice,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      _dirty: true,
      _syncedAt: null,
    } as any);

    await db.insert(inventoryTransactions).values({
      id: `invtx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      local_ref_id: `${id}_${item.productId}`,
      productId: item.productId,
      productName: item.productName || null,
      productBarcode: item.productBarcode || null,
      productCategory: item.productCategory || null,
      productBrand: item.productBrand || null,
      productUnit: item.productUnit || null,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      variantCode: item.variantCode || null,
      variantNetto: item.variantNetto || null,
      type: InventoryTxType.STORE_SUPPLY,
      quantity: -item.quantity,
      contextName: 'Store Supply',
      organizationId: orgId,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
      status: Status.COMPLETED,
      _dirty: true,
      _syncedAt: null,
    } as any);
  }

  return newSupply as unknown as StoreSupply;
}

export function useStoreSupplies() {
  const [data, setData] = useState<StoreSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchStoreSupplies();
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

export function useStoreSupply(id: string) {
  const [data, setData] = useState<StoreSupply | null>(null);
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
      const result = await fetchStoreSupply(id);
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

export function useCreateStoreSupply() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        date: Date;
        note?: string;
        items: Array<{
          productId: string;
          productName?: string;
          productBarcode?: string;
          productCategory?: string;
          productBrand?: string;
          productUnit?: string;
          variantId?: string;
          variantName?: string;
          variantCode?: string;
          variantNetto?: number;
          quantity: number;
          purchasePrice: number;
        }>;
      },
      options?: { onSuccess?: (data: StoreSupply) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createStoreSupply(data);
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
