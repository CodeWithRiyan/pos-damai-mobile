import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageAdapter } from '../storage';

export interface Category {
  id: string;
  name: string;
  point: number;
  description: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCategoryDTO {
  name: string;
  point?: number;
  description?: string;
}

export interface UpdateCategoryDTO {
  id: string;
  name?: string;
  point?: number;
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

// Get all categories from local SQLite (excluding soft-deleted)
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const orgId = getOrganizationId();
      console.log('[Categories] Fetching for orgId:', orgId);
      const result = await db
        .select()
        .from(schema.categories)
        .where(and(
          eq(schema.categories.organizationId, orgId),
          isNull(schema.categories.deletedAt)
        ));
      console.log('[Categories] Found:', result.length);
      return result as Category[];
    },
  });
}

// Get single category
export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, id))
        .limit(1);
      return result[0] as Category | undefined;
    },
    enabled: !!id,
  });
}

// Create category (saved to local SQLite, synced via SyncEngine)
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryDTO) => {
      const orgId = getOrganizationId();
      const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newCategory = {
        id,
        name: data.name,
        point: data.point ?? 0,
        description: data.description ?? null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.categories).values(newCategory);

      return newCategory as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCategoryDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      await db
        .update(schema.categories)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.categories.id, id));

      return { id, ...rest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      // Soft delete locally
      await db
        .update(schema.categories)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.categories.id, id));

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Bulk delete categories
export function useBulkDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      for (const id of data.ids) {
        await db
          .update(schema.categories)
          .set({ deletedAt: now, _dirty: true })
          .where(eq(schema.categories.id, id));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
