import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

export interface Discount {
  id: string;
  name: string;
  nominal: number;
  type: 'FLAT' | 'PERCENTAGE';
  startDate: Date;
  endDate: Date;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateDiscountDTO {
  name: string;
  nominal: number;
  type: 'FLAT' | 'PERCENTAGE';
  startDate: Date;
  endDate: Date;
}

export interface UpdateDiscountDTO extends Partial<CreateDiscountDTO> {
  id: string;
}


// Get all discounts
export function useDiscounts() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['discounts', orgId],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.discounts)
        .where(
          and(
            eq(schema.discounts.organizationId, orgId),
            isNull(schema.discounts.deletedAt)
          )
        );
      return result as unknown as Discount[];
    },
    enabled: !!orgId,
  });
}
// Get single discount
export function useDiscount(id: string) {
  return useQuery({
    queryKey: ['discount', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await db
        .select()
        .from(schema.discounts)
        .where(eq(schema.discounts.id, id))
        .limit(1);
      return (result[0] as unknown as Discount) || null;
    },
    enabled: !!id,
  });
}

// Create discount
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDiscountDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      const newDiscount = {
        id,
        name: data.name,
        nominal: data.nominal,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.discounts).values(newDiscount);
      return newDiscount as Discount;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discounts', data.organizationId] });
    },
  });
}

// Update discount
export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDiscountDTO) => {
      const { id, ...rest } = data;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.discounts)
        .set({
          ...rest,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.discounts.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['discounts', orgId] });
      queryClient.invalidateQueries({ queryKey: ['discount', data.id] });
    },
  });
}

// Delete discount
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.discounts)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.discounts.id, id));
      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['discounts', orgId] });
    },
  });
}
