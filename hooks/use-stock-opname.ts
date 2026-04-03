import { stockOpnames, stockOpnameItems } from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface StockOpname {
  id: string;
  local_ref_id: string;
  date: Date;
  note: string | null;
  status: string;
  totalGain: number;
  totalLoss: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy?: string | null;
  items?: Array<{
    id: string;
    productId: string;
    systemQuantity: number;
    quantitySystem: number;
    physicalQuantity: number;
    quantityPhysical: number;
    difference: number;
    note: string | null;
    productUnit?: string;
    purchasePrice: number;
    financialImpact: number;
    productName?: string;
  }>;
}

export async function fetchStockOpnames(): Promise<StockOpname[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(stockOpnames)
    .where(and(eq(stockOpnames.organizationId, orgId), isNull(stockOpnames.deletedAt)))
    .orderBy(desc(stockOpnames.createdAt));

  return result as unknown as StockOpname[];
}

export async function fetchStockOpname(id: string): Promise<StockOpname | null> {
  const result = await db.select().from(stockOpnames).where(eq(stockOpnames.id, id)).limit(1);

  if (result.length === 0) return null;

  const items = await db
    .select()
    .from(stockOpnameItems)
    .where(eq(stockOpnameItems.stockOpnameId, result[0].id));

  return {
    ...result[0],
    items: items.map((item) => ({
      ...item,
      quantitySystem: item.quantitySystem || 0,
      quantityPhysical: item.quantityPhysical || 0,
      difference: (item.quantityPhysical || 0) - (item.quantitySystem || 0),
    })),
  } as unknown as StockOpname;
}

export async function createStockOpname(data: {
  date: Date;
  note?: string;
  items: Array<{
    productId: string;
    systemQuantity: number;
    physicalQuantity: number;
    note?: string;
  }>;
}): Promise<StockOpname> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `so_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newOpname = {
    id,
    local_ref_id: `SO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    date: data.date,
    note: data.note || null,
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

  await db.insert(stockOpnames).values(newOpname as any);

  for (const item of data.items) {
    const itemId = `soi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(stockOpnameItems).values({
      id: itemId,
      stockOpnameId: id,
      productId: item.productId,
      systemQuantity: item.systemQuantity,
      physicalQuantity: item.physicalQuantity,
      difference: item.physicalQuantity - item.systemQuantity,
      note: item.note || null,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      _dirty: true,
      _syncedAt: null,
    } as any);
  }

  return newOpname as unknown as StockOpname;
}

export function useStockOpnames() {
  const [data, setData] = useState<StockOpname[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchStockOpnames();
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

export function useStockOpname(id: string) {
  const [data, setData] = useState<StockOpname | null>(null);
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
      const result = await fetchStockOpname(id);
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

export function useCreateStockOpname() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: {
        date: Date;
        note?: string;
        items: Array<{
          productId: string;
          systemQuantity: number;
          physicalQuantity: number;
          note?: string;
        }>;
      },
      options?: { onSuccess?: (data: StockOpname) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createStockOpname(data);
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
