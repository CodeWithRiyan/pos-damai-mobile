import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { Supplier } from './suppliers';

export interface PayableRealization {
  id: string;
  payableId: string;
  nominal: number;
  realizationDate: Date;
  paymentMethodId: string;
  note: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Payable {
  id: string;
  supplierId: string;
  nominal: number;
  dueDate: Date | null;
  note: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  supplier?: Supplier;
  realizations: PayableRealization[];
  totalRealization: number;
}

export interface PayableBySupplier {
  supplierId: string;
  supplierName: string;
  totalPayable: number;
  totalRealization: number;
  nearestDueDate: Date | null;
  organizationId: string;
  address: string | null;
  phone: string | null;
}

export interface CreatePayableDTO {
  supplierId: string;
  nominal: number;
  dueDate?: string;
  note?: string;
}

export interface CreatePayableRealizationDTO {
  payableId: string;
  nominal: number;
  realizationDate: string;
  paymentMethodId: string;
  note?: string;
}

export interface UpdatePayableDTO {
  id: string;
  nominal?: number;
  supplierId?: string;
  dueDate?: string;
  note?: string;
}

export function usePayableList() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['payables', 'list', orgId],
    queryFn: async () => {
      const allPayables = await db
        .select({
          payable: schema.payables,
          supplier: schema.suppliers,
        })
        .from(schema.payables)
        .leftJoin(schema.suppliers, eq(schema.payables.supplierId, schema.suppliers.id))
        .where(
          and(
            eq(schema.payables.organizationId, orgId),
            isNull(schema.payables.deletedAt)
          )
        );

      const groupedBySupplier: Record<string, PayableBySupplier> = {};

      for (const item of allPayables) {
        const { payable, supplier } = item;
        const realizations = await db
          .select()
          .from(schema.payableRealizations)
          .where(
            and(
              eq(schema.payableRealizations.payableId, payable.id),
              isNull(schema.payableRealizations.deletedAt)
            )
          );
        
        const totalRealization = realizations.reduce((sum, r) => sum + r.nominal, 0);

        if (!groupedBySupplier[payable.supplierId]) {
          groupedBySupplier[payable.supplierId] = {
            supplierId: payable.supplierId,
            supplierName: supplier?.name || 'Unknown',
            totalPayable: 0,
            totalRealization: 0,
            nearestDueDate: payable.dueDate,
            organizationId: payable.organizationId,
            address: supplier?.address || null,
            phone: supplier?.phone || null,
          };
        }

        const group = groupedBySupplier[payable.supplierId];
        group.totalPayable += payable.nominal;
        group.totalRealization += totalRealization;
        
        if (payable.dueDate && (!group.nearestDueDate || payable.dueDate < group.nearestDueDate)) {
          group.nearestDueDate = payable.dueDate;
        }
      }

      return Object.values(groupedBySupplier);
    },
    enabled: !!orgId,
  });
}

export function usePayableBySupplier(supplierId: string) {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['payables', 'supplier', supplierId, orgId],
    queryFn: async () => {
      const payablesWithSupplier = await db
        .select({
          payable: schema.payables,
          supplier: schema.suppliers,
        })
        .from(schema.payables)
        .leftJoin(schema.suppliers, eq(schema.payables.supplierId, schema.suppliers.id))
        .where(
          and(
            eq(schema.payables.supplierId, supplierId),
            eq(schema.payables.organizationId, orgId),
            isNull(schema.payables.deletedAt)
          )
        );

      const detailedPayables = await Promise.all(
        payablesWithSupplier.map(async (row) => {
          const { payable, supplier } = row;
          const realizations = await db
            .select()
            .from(schema.payableRealizations)
            .where(
              and(
                eq(schema.payableRealizations.payableId, payable.id),
                isNull(schema.payableRealizations.deletedAt)
              )
            );
          
          const totalRealization = realizations.reduce((sum, r) => sum + r.nominal, 0);

          return {
            ...payable,
            supplier,
            realizations,
            totalRealization,
          };
        })
      );

      return detailedPayables as unknown as Payable[];
    },
    enabled: !!supplierId && !!orgId,
  });
}

export function usePayableDetail(id: string) {
  return useQuery({
    queryKey: ['payables', 'detail', id],
    queryFn: async () => {
      const result = await db
        .select({
          payable: schema.payables,
          supplier: schema.suppliers,
        })
        .from(schema.payables)
        .leftJoin(schema.suppliers, eq(schema.payables.supplierId, schema.suppliers.id))
        .where(eq(schema.payables.id, id))
        .limit(1);

      if (result.length === 0) return undefined;

      const { payable, supplier } = result[0];
      const realizations = await db
        .select()
        .from(schema.payableRealizations)
        .where(
          and(
            eq(schema.payableRealizations.payableId, id),
            isNull(schema.payableRealizations.deletedAt)
          )
        );

      const totalRealization = realizations.reduce((sum, r) => sum + r.nominal, 0);

      return {
        ...payable,
        supplier,
        realizations,
        totalRealization,
      } as unknown as Payable;
    },
    enabled: !!id,
  });
}

export function useCreatePayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePayableDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const local_ref_id = `L-PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(schema.payables).values({
        id,
        local_ref_id,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, local_ref_id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
    },
  });
}

export function useCreatePayableRealization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePayableRealizationDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `payrel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const local_ref_id = `L-PAY-REL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(schema.payableRealizations).values({
        id,
        local_ref_id,
        ...data,
        realizationDate: new Date(data.realizationDate),
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, local_ref_id, ...data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
    },
  });
}

export function useDeletePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db
        .update(schema.payables)
        .set({ deletedAt: new Date(), _dirty: true })
        .where(eq(schema.payables.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
    },
  });
}

export function useBulkDeletePayableBySupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplierIds: string[]) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();
      for (const supplierId of supplierIds) {
        await db
          .update(schema.payables)
          .set({ deletedAt: now, _dirty: true })
          .where(
            and(
              eq(schema.payables.supplierId, supplierId),
              eq(schema.payables.organizationId, orgId)
            )
          );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
    },
  });
}

export function useUpdatePayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePayableDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const { id, ...updateData } = data;
      const now = new Date();

      await db
        .update(schema.payables)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedAt: now,
          _dirty: true,
        })
        .where(
          and(
            eq(schema.payables.id, id),
            eq(schema.payables.organizationId, orgId)
          )
        );

      return { id, ...updateData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
    },
  });
}
