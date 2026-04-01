import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

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

// Get all brands from local SQLite (excluding soft-deleted)
export function useBrands() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['brands', orgId],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.brands)
        .where(and(eq(schema.brands.organizationId, orgId), isNull(schema.brands.deletedAt)));
      return result as Brand[];
    },
    enabled: !!orgId,
  });
}

// Get single brand
export function useBrand(id: string) {
  return useQuery({
    queryKey: ['brands', id],
    queryFn: async () => {
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, id)).limit(1);
      return result[0] as Brand | undefined;
    },
    enabled: !!id,
  });
}

// Get product counts by brand
export function useProductCountsByBrand() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['productCountsByBrand', orgId],
    queryFn: async () => {
      const products = await db
        .select({ brandId: schema.products.brandId })
        .from(schema.products)
        .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)));

      const counts: Record<string, number> = {};
      products.forEach((p) => {
        if (p.brandId) {
          counts[p.brandId] = (counts[p.brandId] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!orgId,
  });
}

// Get capital value (stock × purchase price) by brand
export function useCapitalValueByBrand() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['capitalValueByBrand', orgId],
    queryFn: async () => {
      // Get all products with their brand
      const products = await db
        .select({
          id: schema.products.id,
          brandId: schema.products.brandId,
          purchasePrice: schema.products.purchasePrice,
        })
        .from(schema.products)
        .where(and(eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)));

      const values: Record<string, number> = {};

      for (const product of products) {
        if (!product.brandId) continue;

        // Get stock from inventory transactions
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
        values[product.brandId] = (values[product.brandId] || 0) + value;
      }

      return values;
    },
    enabled: !!orgId,
  });
}

// Create brand (saved to local SQLite, synced via SyncEngine)
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBrandDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();

      if (!orgId) {
        throw new Error(
          'Gagal menambahkan brand: ID Organisasi tidak ditemukan. Silakan login kembali.',
        );
      }

      // Check for duplicate name
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

      const newBrand = {
        id,
        name: data.name,
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

      await db.insert(schema.brands).values(newBrand);

      return newBrand as Brand;
    },
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries({
        queryKey: ['brands', newBrand.organizationId],
      });
    },
  });
}

// Update brand
export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBrandDTO) => {
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
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.brands.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['brands', orgId] });
      queryClient.invalidateQueries({ queryKey: ['brands', data.id] });
    },
  });
}

// Delete brand
export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.brands)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.brands.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['brands', orgId] });
    },
  });
}

// Bulk delete brands
export function useBulkDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        await db
          .update(schema.brands)
          .set({
            deletedAt: now,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.brands.id, id));
      }

      return data;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['brands', orgId] });
    },
  });
}
