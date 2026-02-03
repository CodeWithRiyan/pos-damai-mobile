import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { User } from './users';

export interface ReceivableRealization {
  id: string;
  receivableId: string;
  nominal: number;
  realizationDate: Date;
  paymentMethodId: string;
  note: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Receivable {
  id: string;
  userId: string;
  nominal: number;
  dueDate: Date | null;
  note: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  user?: User;
  realizations: ReceivableRealization[];
  totalRealization: number;
}

export interface ReceivableByUser {
  userId: string;
  userName: string;
  totalReceivable: number;
  totalRealization: number;
  nearestDueDate: Date | null;
  organizationId: string;
}

export interface CreateReceivableDTO {
  userId: string;
  nominal: number;
  dueDate?: string;
  note?: string;
}

export interface CreateReceivableRealizationDTO {
  receivableId: string;
  nominal: number;
  realizationDate: string;
  paymentMethodId: string;
  note?: string;
}

export function useReceivableList() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['receivables', 'list', orgId],
    queryFn: async () => {
      const allReceivables = await db
        .select({
          receivable: schema.receivables,
          user: schema.users,
        })
        .from(schema.receivables)
        .leftJoin(schema.users, eq(schema.receivables.userId, schema.users.id))
        .where(
          and(
            eq(schema.receivables.organizationId, orgId),
            isNull(schema.receivables.deletedAt)
          )
        );

      const groupedByUser: Record<string, ReceivableByUser> = {};

      for (const item of allReceivables) {
        const { receivable, user } = item;
        const realizations = await db
          .select()
          .from(schema.receivableRealizations)
          .where(
            and(
              eq(schema.receivableRealizations.receivableId, receivable.id),
              isNull(schema.receivableRealizations.deletedAt)
            )
          );
        
        const totalRealization = realizations.reduce((sum, r) => sum + r.nominal, 0);

        if (!groupedByUser[receivable.userId]) {
          groupedByUser[receivable.userId] = {
            userId: receivable.userId,
            userName: user?.name || 'Unknown',
            totalReceivable: 0,
            totalRealization: 0,
            nearestDueDate: receivable.dueDate,
            organizationId: receivable.organizationId,
          };
        }

        const group = groupedByUser[receivable.userId];
        group.totalReceivable += receivable.nominal;
        group.totalRealization += totalRealization;
        
        if (receivable.dueDate && (!group.nearestDueDate || receivable.dueDate < group.nearestDueDate)) {
          group.nearestDueDate = receivable.dueDate;
        }
      }

      return Object.values(groupedByUser);
    },
    enabled: !!orgId,
  });
}

export function useReceivableByUser(userId: string) {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['receivables', 'user', userId, orgId],
    queryFn: async () => {
      const receivablesWithUser = await db
        .select({
          receivable: schema.receivables,
          user: schema.users,
        })
        .from(schema.receivables)
        .leftJoin(schema.users, eq(schema.receivables.userId, schema.users.id))
        .where(
          and(
            eq(schema.receivables.userId, userId),
            eq(schema.receivables.organizationId, orgId),
            isNull(schema.receivables.deletedAt)
          )
        );

      const detailedReceivables = await Promise.all(
        receivablesWithUser.map(async (row) => {
          const { receivable, user } = row;
          const realizations = await db
            .select()
            .from(schema.receivableRealizations)
            .where(
              and(
                eq(schema.receivableRealizations.receivableId, receivable.id),
                isNull(schema.receivableRealizations.deletedAt)
              )
            );
          
          const totalRealization = realizations.reduce((sum, rl) => sum + rl.nominal, 0);

          return {
            ...receivable,
            user,
            realizations,
            totalRealization,
          };
        })
      );

      return detailedReceivables as unknown as Receivable[];
    },
    enabled: !!userId && !!orgId,
  });
}

export function useReceivableDetail(id: string) {
    const orgId = useAuthStore(state => state.getOrganizationId());
    return useQuery({
      queryKey: ['receivables', 'detail', id],
      queryFn: async () => {
        const result = await db
          .select({
            receivable: schema.receivables,
            user: schema.users,
          })
          .from(schema.receivables)
          .leftJoin(schema.users, eq(schema.receivables.userId, schema.users.id))
          .where(eq(schema.receivables.id, id))
          .limit(1);
  
        if (result.length === 0) return undefined;
  
        const { receivable, user } = result[0];
        const realizations = await db
          .select()
          .from(schema.receivableRealizations)
          .where(
            and(
              eq(schema.receivableRealizations.receivableId, id),
              isNull(schema.receivableRealizations.deletedAt)
            )
          );
  
        const totalRealization = realizations.reduce((sum, r) => sum + r.nominal, 0);
  
        return {
          ...receivable,
          user,
          realizations,
          totalRealization,
        } as unknown as Receivable;
      },
      enabled: !!id,
    });
  }

export function useCreateReceivable() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore.getState().getOrganizationId();

  return useMutation({
    mutationFn: async (data: CreateReceivableDTO) => {
      const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      await db.insert(schema.receivables).values({
        id,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useCreateReceivableRealization() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore.getState().getOrganizationId();

  return useMutation({
    mutationFn: async (data: CreateReceivableRealizationDTO) => {
      const id = `recrel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      await db.insert(schema.receivableRealizations).values({
        id,
        ...data,
        realizationDate: new Date(data.realizationDate),
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useDeleteReceivable() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await db
          .update(schema.receivables)
          .set({ deletedAt: new Date(), _dirty: true })
          .where(eq(schema.receivables.id, id));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receivables'] });
      },
    });
  }
  
  export function useBulkDeleteReceivableByUser() {
    const queryClient = useQueryClient();
    const orgId = useAuthStore.getState().getOrganizationId();
    return useMutation({
      mutationFn: async (userIds: string[]) => {
        const now = new Date();
        for (const userId of userIds) {
            await db
            .update(schema.receivables)
            .set({ deletedAt: now, _dirty: true })
            .where(
              and(
                eq(schema.receivables.userId, userId),
                eq(schema.receivables.organizationId, orgId)
              )
            );
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receivables'] });
      },
    });
}
