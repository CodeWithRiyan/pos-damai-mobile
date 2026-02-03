import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

export interface PaymentType {
  id: string;
  name: string;
  commission: number;
  minimalAmount: number;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreatePaymentTypeDTO {
  name: string;
  commission?: number;
  minimalAmount?: number;
}

export interface UpdatePaymentTypeDTO extends Partial<CreatePaymentTypeDTO> {
  id: string;
}

// Get all payment types from local SQLite (excluding soft-deleted)
export function usePaymentTypes() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['paymentTypes', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const result = await db
        .select()
        .from(schema.paymentTypes)
        .where(and(
          eq(schema.paymentTypes.organizationId, orgId),
          isNull(schema.paymentTypes.deletedAt)
        ));
      return result as PaymentType[];
    },
    enabled: !!orgId,
  });
}

// Get single payment type
export function usePaymentType(id: string) {
  return useQuery({
    queryKey: ['paymentTypes', id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.paymentTypes)
        .where(eq(schema.paymentTypes.id, id))
        .limit(1);
      return result[0] as PaymentType | undefined;
    },
    enabled: !!id,
  });
}

// Create payment type (saved to local SQLite, synced via SyncEngine)
export function useCreatePaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentTypeDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      
      if (!orgId) {
        throw new Error('Gagal menambahkan jenis pembayaran: ID Organisasi tidak ditemukan.');
      }

      const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newPaymentType = {
        id,
        name: data.name,
        commission: data.commission ?? 0,
        minimalAmount: data.minimalAmount ?? 0,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.paymentTypes).values(newPaymentType);
      return newPaymentType as PaymentType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', data.organizationId] });
    },
  });
}

// Update payment type
export function useUpdatePaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePaymentTypeDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      await db
        .update(schema.paymentTypes)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.paymentTypes.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', orgId] });
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', data.id] });
    },
  });
}

// Delete payment type
export function useDeletePaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      // Soft delete locally
      await db
        .update(schema.paymentTypes)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.paymentTypes.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', orgId] });
    },
  });
}

// Bulk delete payment types
export function useBulkDeletePaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      for (const id of data.ids) {
        await db
          .update(schema.paymentTypes)
          .set({ deletedAt: now, _dirty: true })
          .where(eq(schema.paymentTypes.id, id));
      }

      return data;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', orgId] });
    },
  });
}
