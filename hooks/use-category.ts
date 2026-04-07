import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/system/auth';
import { and, eq, isNull, like, desc, inArray } from 'drizzle-orm';

export interface Category {
  id: string;
  name: string;
  point: number;
  retailPoint: number;
  wholesalePoint: number;
  description: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCategoryDTO {
  name: string;
  point?: number;
  retailPoint?: number;
  wholesalePoint?: number;
  description?: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
  id: string;
}

export async function fetchCategories(params?: { search?: string }): Promise<Category[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(schema.categories.organizationId, orgId),
    isNull(schema.categories.deletedAt),
  ];

  if (params?.search) {
    conditions.push(like(schema.categories.name, `%${params.search}%`));
  }

  const result = await db
    .select()
    .from(schema.categories)
    .where(and(...conditions))
    .orderBy(desc(schema.categories.createdAt));

  return result as unknown as Category[];
}

export async function fetchCategory(id: string): Promise<Category | null> {
  const result = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Category;
}

export async function refetchCategoryById(id: string): Promise<Category | null> {
  return fetchCategory(id);
}

export async function createCategory(data: CreateCategoryDTO): Promise<Category> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newCategory = {
    id,
    name: data.name,
    point: data.point ?? 0,
    retailPoint: data.retailPoint ?? 0,
    wholesalePoint: data.wholesalePoint ?? 0,
    description: data.description ?? null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(schema.categories).values(newCategory as any);

  return newCategory as unknown as Category;
}

export async function updateCategory(data: UpdateCategoryDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.categories)
    .set({
      ...rest,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.categories.id, id));
}

export async function deleteCategory(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.categories)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.categories.id, id));
}

export async function bulkDeleteCategory(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.categories)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(inArray(schema.categories.id, ids));
}

export interface UseCategoriesResult {
  data: Category[];
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCategories();
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

export interface UseCategoryResult {
  data: Category | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategory(id: string): UseCategoryResult {
  const [data, setData] = useState<Category | null>(null);
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

    fetchCategory(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, isLoading: loading, loading, error, refetch };
}

export interface UseCreateCategoryResult {
  mutate: (
    data: CreateCategoryDTO,
    options?: { onSuccess?: (data: Category) => void; onError?: (error: Error) => void },
  ) => Promise<Category | undefined>;
  mutateAsync: (data: CreateCategoryDTO) => Promise<Category>;
  loading: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useCreateCategory(): UseCreateCategoryResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateCategoryDTO,
      options?: { onSuccess?: (data: Category) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createCategory(data);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export interface UseUpdateCategoryResult {
  mutate: (
    data: UpdateCategoryDTO,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => Promise<void>;
  mutateAsync: (data: UpdateCategoryDTO) => Promise<void>;
  loading: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useUpdateCategory(): UseUpdateCategoryResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateCategoryDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateCategory(data);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export interface UseDeleteCategoryResult {
  mutate: (
    id: string,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => Promise<void>;
  mutateAsync: (id: string) => Promise<void>;
  loading: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useDeleteCategory(): UseDeleteCategoryResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteCategory(id);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export interface UseBulkDeleteCategoryResult {
  mutate: (
    ids: string[],
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => Promise<void>;
  mutateAsync: (ids: string[]) => Promise<void>;
  loading: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useBulkDeleteCategory(): UseBulkDeleteCategoryResult {
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
        await bulkDeleteCategory(ids);
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

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    isPending: loading,
    error,
  };
}

export function useProductCountsByCategory() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const orgId = useAuthStore.getState().getOrganizationId();
    if (!orgId) return;

    setLoading(true);
    setError(null);

    db.select({ categoryId: schema.products.categoryId })
      .from(schema.products)
      .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)))
      .then((products) => {
        const result: Record<string, number> = {};
        for (const product of products) {
          result[product.categoryId] = (result[product.categoryId] || 0) + 1;
        }
        setCounts(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        setLoading(false);
      });
  }, [refreshKey]);

  return { data: counts, loading, error, refetch };
}

export function useCapitalValueByCategory() {
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const orgId = useAuthStore.getState().getOrganizationId();
    if (!orgId) return;

    setLoading(true);
    setError(null);

    db.select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      purchasePrice: schema.products.purchasePrice,
    })
      .from(schema.products)
      .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)))
      .then(async (products) => {
        const result: Record<string, number> = {};

        for (const product of products) {
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
          result[product.categoryId] = (result[product.categoryId] || 0) + value;
        }

        setValues(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        setLoading(false);
      });
  }, [refreshKey]);

  return { data: values, loading, error, refetch };
}
