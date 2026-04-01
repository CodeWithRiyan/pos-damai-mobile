import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

export interface PaymentType {
  id: string;
  name: string;
  commission: number;
  commissionType: 'FLAT' | 'PERCENTAGE';
  isDefault: boolean;
  minimalAmount: number;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreatePaymentTypeDTO {
  name: string;
  commission?: number;
  commissionType?: 'FLAT' | 'PERCENTAGE';
  isDefault?: boolean;
  minimalAmount?: number;
}

export interface UpdatePaymentTypeDTO extends Partial<CreatePaymentTypeDTO> {
  id: string;
}

// Get all payment types from local SQLite (excluding soft-deleted)
export function usePaymentTypes() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['paymentTypes', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const result = await db
        .select()
        .from(schema.paymentTypes)
        .where(
          and(eq(schema.paymentTypes.organizationId, orgId), isNull(schema.paymentTypes.deletedAt)),
        );
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

      const userId = useAuthStore.getState().profile?.id;

      const newPaymentType = {
        id,
        name: data.name,
        commission: data.commission ?? 0,
        commissionType: data.commissionType ?? 'PERCENTAGE',
        isDefault: data.isDefault ?? false,
        minimalAmount: data.minimalAmount ?? 0,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
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
      queryClient.invalidateQueries({
        queryKey: ['paymentTypes', data.organizationId],
      });
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

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.paymentTypes)
        .set({
          ...rest,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
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

      const userId = useAuthStore.getState().profile?.id;

      // Soft delete locally
      await db
        .update(schema.paymentTypes)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
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

      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        await db
          .update(schema.paymentTypes)
          .set({
            deletedAt: now,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
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

// Set payment type as default (and unset others)
export function useSetDefaultPaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const userId = useAuthStore.getState().profile?.id;
      if (!orgId) {
        throw new Error('Gagal mengatur pembayaran default: ID Organisasi tidak ditemukan.');
      }

      const now = new Date();

      // First, unset all other defaults in this organization
      const allPaymentTypes = await db
        .select()
        .from(schema.paymentTypes)
        .where(
          and(eq(schema.paymentTypes.organizationId, orgId), isNull(schema.paymentTypes.deletedAt)),
        );

      for (const pt of allPaymentTypes) {
        if (pt.isDefault) {
          await db
            .update(schema.paymentTypes)
            .set({
              isDefault: false,
              updatedBy: userId,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.paymentTypes.id, pt.id));
        }
      }

      // Then set this one as default
      await db
        .update(schema.paymentTypes)
        .set({
          isDefault: true,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.paymentTypes.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['paymentTypes', orgId] });
    },
  });
}
