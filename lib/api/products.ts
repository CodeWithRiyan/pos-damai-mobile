import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageAdapter } from '../storage';

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  purchasePrice: number;
  description: string | null;
  isFavorite: boolean;
  categoryId: string;
  brandId: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProductDTO {
  name: string;
  barcode?: string;
  purchasePrice?: number;
  description?: string;
  isFavorite?: boolean;
  categoryId: string;
  brandId?: string;
}

export interface UpdateProductDTO {
  id: string;
  name?: string;
  barcode?: string;
  purchasePrice?: number;
  description?: string;
  isFavorite?: boolean;
  categoryId?: string;
  brandId?: string;
}

// Get user's organization ID
function getOrganizationId(): string {
  const profile = storageAdapter.getItem('userProfile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.selectedOrganizationId || '';
    } catch {
      return '';
    }
  }
  return '';
}

// Get all products from local SQLite (excluding soft-deleted)
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const result = await db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.organizationId, orgId),
          isNull(schema.products.deletedAt)
        ));
      return result as Product[];
    },
  });
}

// Get single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, id))
        .limit(1);
      return result[0] as Product | undefined;
    },
    enabled: !!id,
  });
}

// Create product (saved to local SQLite, synced via SyncEngine)
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {
      const orgId = getOrganizationId();
      const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newProduct = {
        id,
        name: data.name,
        barcode: data.barcode ?? null,
        purchasePrice: data.purchasePrice ?? 0,
        description: data.description ?? null,
        isFavorite: data.isFavorite ?? false,
        categoryId: data.categoryId,
        brandId: data.brandId ?? null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.products).values(newProduct);

      return newProduct as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      await db
        .update(schema.products)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.products.id, id));

      return { id, ...rest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      await db
        .update(schema.products)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.products.id, id));

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Bulk delete products
export function useBulkDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      for (const id of data.ids) {
        await db
          .update(schema.products)
          .set({ deletedAt: now, _dirty: true })
          .where(eq(schema.products.id, id));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
