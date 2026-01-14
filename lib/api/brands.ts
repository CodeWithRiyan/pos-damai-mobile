import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageAdapter } from '../storage';

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

// Get all brands from local SQLite (excluding soft-deleted)
export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const result = await db
        .select()
        .from(schema.brands)
        .where(and(
          eq(schema.brands.organizationId, orgId),
          isNull(schema.brands.deletedAt)
        ));
      return result as Brand[];
    },
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

// Create brand (saved to local SQLite, synced via SyncEngine)
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBrandDTO) => {
      const orgId = getOrganizationId();
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

      return newBrand as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
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
      queryClient.invalidateQueries({ queryKey: ['brands'] });
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
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
