import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageAdapter } from '../storage';

export interface Discount {
  id: string;
  name: string;
  nominal: number;
  type: 'FLAT' | 'PERCENTAGE';
  startDate: Date;
  endDate: Date;
  organizationId: string;
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

// Get all discounts
export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const orgId = getOrganizationId();
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
  });
}

// Create discount
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDiscountDTO) => {
      const orgId = getOrganizationId();
      const id = `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newDiscount = {
        id,
        name: data.name,
        nominal: data.nominal,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.discounts).values(newDiscount);
      return newDiscount as Discount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
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

      await db
        .update(schema.discounts)
        .set({ ...rest, updatedAt: now, _dirty: true })
        .where(eq(schema.discounts.id, id));

      return { id, ...rest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

// Delete discount
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      await db
        .update(schema.discounts)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.discounts.id, id));
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}
