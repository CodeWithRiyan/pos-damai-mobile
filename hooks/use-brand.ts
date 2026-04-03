import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, ne } from 'drizzle-orm';

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateBrandDTO {
  name: string;
  description?: string;
}

export interface UpdateBrandDTO {
  id: string;
  name?: string;
  description?: string;
}

export async function fetchBrands(): Promise<Brand[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.brands)
    .where(and(eq(schema.brands.organizationId, orgId), isNull(schema.brands.deletedAt)));
  return result as Brand[];
}

export async function fetchBrand(id: string): Promise<Brand | null> {
  const result = await db.select().from(schema.brands).where(eq(schema.brands.id, id)).limit(1);
  return (result[0] as Brand) || null;
}

export async function refetchBrandById(id: string): Promise<Brand | null> {
  return fetchBrand(id);
}

export async function createBrand(data: CreateBrandDTO): Promise<Brand> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) {
    throw new Error('Organization ID not found');
  }

  const existing = await db
    .select()
    .from(schema.brands)
    .where(
      and(
        eq(schema.brands.name, data.name),
        eq(schema.brands.organizationId, orgId),
        isNull(schema.brands.deletedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Brand dengan nama "${data.name}" sudah ada.`);
  }

  const id = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newBrand: Brand = {
    id,
    name: data.name,
    description: data.description ?? null,
    organizationId: orgId,
    createdBy: userId ?? null,
    updatedBy: userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.brands).values({
    ...newBrand,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  });

  return newBrand;
}

export async function updateBrand(data: UpdateBrandDTO): Promise<void> {
  const { id, ...rest } = data;
  const orgId = useAuthStore.getState().getOrganizationId();
  const now = new Date();

  if (rest.name) {
    const existing = await db
      .select()
      .from(schema.brands)
      .where(
        and(
          eq(schema.brands.name, rest.name),
          eq(schema.brands.organizationId, orgId),
          ne(schema.brands.id, id),
          isNull(schema.brands.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Brand dengan nama "${rest.name}" sudah ada.`);
    }
  }

  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.brands)
    .set({
      ...rest,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.brands.id, id));
}

export async function deleteBrand(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.brands)
    .set({
      deletedAt: now,
      updatedBy: userId ?? null,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.brands.id, id));
}

export async function bulkDeleteBrands(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const id of ids) {
    await db
      .update(schema.brands)
      .set({
        deletedAt: now,
        updatedBy: userId ?? null,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(schema.brands.id, id));
  }
}

export function useBrands() {
  const [data, setData] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBrands();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, isLoading: loading, error, refetch };
}

export function useBrand(id: string) {
  const [data, setData] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchBrand(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, isLoading: loading, loading, error, refetch };
}

export function useCreateBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateBrandDTO,
      options?: { onSuccess?: (data: Brand) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createBrand(data);
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

export function useUpdateBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateBrandDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateBrand(data);
        options?.onSuccess?.();
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

export function useDeleteBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteBrand(id);
        options?.onSuccess?.();
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

export function useBulkDeleteBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await bulkDeleteBrands(ids);
        options?.onSuccess?.();
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

export function useProductCountsByBrand() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const orgId = useAuthStore.getState().getOrganizationId();
    if (!orgId) return;

    setLoading(true);
    setError(null);

    db.select({ brandId: schema.products.brandId })
      .from(schema.products)
      .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)))
      .then((products) => {
        const result: Record<string, number> = {};
        products.forEach((p) => {
          if (p.brandId) {
            result[p.brandId] = (result[p.brandId] || 0) + 1;
          }
        });
        setCounts(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        setLoading(false);
      });
  }, []);

  return { data: counts, isLoading: loading, loading, error, refetch: () => {} };
}

export function useCapitalValueByBrand() {
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const orgId = useAuthStore.getState().getOrganizationId();
    if (!orgId) return;

    setLoading(true);
    setError(null);

    db.select({
      id: schema.products.id,
      brandId: schema.products.brandId,
      purchasePrice: schema.products.purchasePrice,
    })
      .from(schema.products)
      .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)))
      .then(async (products) => {
        const result: Record<string, number> = {};

        for (const product of products) {
          if (!product.brandId) continue;

          const transactions = await db
            .select({ quantity: schema.inventoryTransactions.quantity })
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, 'COMPLETED'),
              ),
            );

          const stock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
          const value = stock * (product.purchasePrice ?? 0);
          result[product.brandId] = (result[product.brandId] || 0) + value;
        }

        setValues(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        setLoading(false);
      });
  }, []);

  return { data: values, loading, error };
}
