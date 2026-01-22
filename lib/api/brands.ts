import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
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
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['brands', orgId],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.brands)
        .where(and(
          eq(schema.brands.organizationId, orgId),
          isNull(schema.brands.deletedAt)
        ));
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
      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, id))
        .limit(1);
      return result[0] as Brand | undefined;
    },
    enabled: !!id,
  });
}

// Get product counts by brand
export function useProductCountsByBrand() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['productCountsByBrand', orgId],
    queryFn: async () => {
      const products = await db
        .select({ brandId: schema.products.brandId })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            isNull(schema.products.deletedAt)
          )
        );

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

// Create brand (saved to local SQLite, synced via SyncEngine)
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBrandDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      console.log('[CreateBrand] creating for orgId:', orgId, data);
      const id = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newBrand = {
        id,
        name: data.name,
        description: data.description ?? null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.brands).values(newBrand);
      console.log('[CreateBrand] inserted:', newBrand);

      return newBrand as Brand;
    },
    onSuccess: (newBrand) => {
      console.log('[CreateBrand] success, invalidating brands query');
      queryClient.invalidateQueries({ queryKey: ['brands', newBrand.organizationId] });
    },
  });
}

// Update brand
export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBrandDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      await db
        .update(schema.brands)
        .set({ ...rest, updatedAt: now, _dirty: true })
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

      await db
        .update(schema.brands)
        .set({ deletedAt: now, _dirty: true })
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

      for (const id of data.ids) {
        await db
          .update(schema.brands)
          .set({ deletedAt: now, _dirty: true })
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
