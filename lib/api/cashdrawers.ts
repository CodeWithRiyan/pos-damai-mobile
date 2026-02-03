import { db } from '../db';
import * as schema from '../db/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, eq, isNull } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';

export interface CashDrawer {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCashDrawerDTO {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCashDrawerDTO extends Partial<CreateCashDrawerDTO> {
  id: string;
}

// Get all cashdraw from local SQLite
export function useCashDrawers() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['cashDrawers', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const result = await db
        .select()
        .from(schema.cashDrawers)
        .where(and(
          eq(schema.cashDrawers.organizationId, orgId),
          isNull(schema.cashDrawers.deletedAt)
        ));
      return result as CashDrawer[];
    },
    enabled: !!orgId,
  });
}

// Get single cashdrawer
export function useCashDrawer(id: string) {
  return useQuery({
    queryKey: ['cashDrawers', id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, id))
        .limit(1);
      return result[0] as CashDrawer | undefined;
    },
    enabled: !!id,
  });
}

// Create cashdrawer
export function useCreateCashDrawer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCashDrawerDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      
      if (!orgId) {
        throw new Error('Gagal menambahkan cashdrawer: ID Organisasi tidak ditemukan.');
      }

      const id = `cd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const local_ref_id = `L-CD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newCashDrawer = {
        id,
        local_ref_id,
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.cashDrawers).values(newCashDrawer);
      return newCashDrawer as CashDrawer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cashDrawers', data.organizationId] });
    },
  });
}

// Update cashdrawer
export function useUpdateCashDrawer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCashDrawerDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      await db
        .update(schema.cashDrawers)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.cashDrawers.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['cashDrawers', orgId] });
      queryClient.invalidateQueries({ queryKey: ['cashDrawers', data.id] });
    },
  });
}

// Delete cashdrawer
export function useDeleteCashDrawer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      await db
        .update(schema.cashDrawers)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.cashDrawers.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['cashDrawers', orgId] });
    },
  });
}
