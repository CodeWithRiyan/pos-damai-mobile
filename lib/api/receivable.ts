import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { User } from './users';
import { apiClient, ApiResponse } from './client';

export interface ReceivableRealization {
  id: string;
  receivableId: string;
  nominal: number;
  realizationDate: Date;
  paymentMethodId: string;
  note: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
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
  createdBy: string | null;
  updatedBy: string | null;
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

export interface UpdateReceivableDTO {
  id: string;
  nominal?: number;
  userId?: string;
  dueDate?: string;
  note?: string;
}

// Helper function to unwrap API responses
function unwrapResponse<T>(response: any): T {
  if (response.data && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
}

export function useReceivableList() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['receivables', 'list', orgId],
    queryFn: async () => {
      const allReceivables = await db
        .select()
        .from(schema.receivables)
        .where(
          and(
            eq(schema.receivables.organizationId, orgId),
            isNull(schema.receivables.deletedAt)
          )
        );

      const groupedByUser: Record<string, ReceivableByUser> = {};

      for (const receivable of allReceivables) {
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
            userName: 'Loading...', // Will be updated below
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

      // Fetch user names from API
      const uniqueUserIds = Object.keys(groupedByUser);
      if (uniqueUserIds.length > 0) {
        try {
          const usersResponse = await apiClient.get<ApiResponse<User[]> | User[]>('/users');
          const users = unwrapResponse<User[]>(usersResponse);
          const userMap = new Map(users.map(u => [u.id, u]));
          
          for (const userId of uniqueUserIds) {
            const user = userMap.get(userId);
            if (user) {
              groupedByUser[userId].userName = user.firstName || user.username;
            } else {
              groupedByUser[userId].userName = 'Unknown User';
            }
          }
        } catch (error) {
          console.error('Failed to fetch user names:', error);
          // Keep 'Loading...' or set to 'Unknown'
          for (const userId of uniqueUserIds) {
            groupedByUser[userId].userName = 'Unknown User';
          }
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
      const receivables = await db
        .select()
        .from(schema.receivables)
        .where(
          and(
            eq(schema.receivables.userId, userId),
            eq(schema.receivables.organizationId, orgId),
            isNull(schema.receivables.deletedAt)
          )
        );

      // Fetch user from API
      let user = null;
      try {
        const usersResponse = await apiClient.get<ApiResponse<User[]> | User[]>('/users');
        const users = unwrapResponse<User[]>(usersResponse);
        console.log('[useReceivableByUser] Fetched users:', users.length, 'Looking for userId:', userId);
        user = users.find(u => u.id === userId);
        console.log('[useReceivableByUser] Found user:', user ? `${user.firstName} (${user.id})` : 'NOT FOUND');
      } catch (error) {
        console.error('Failed to fetch user for receivables:', error);
      }

      const detailedReceivables = await Promise.all(
        receivables.map(async (receivable) => {
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
    return useQuery({
      queryKey: ['receivables', 'detail', id],
      queryFn: async () => {
        const result = await db
          .select()
          .from(schema.receivables)
          .where(eq(schema.receivables.id, id))
          .limit(1);
  
        if (result.length === 0) return undefined;
  
        const receivable = result[0];
        
        // Fetch user from API
        let user = null;
        try {
          const usersResponse = await apiClient.get<ApiResponse<User[]> | User[]>('/users');
          const users = unwrapResponse<User[]>(usersResponse);
          console.log('[useReceivableDetail] Fetched users:', users.length, 'Looking for userId:', receivable.userId);
          user = users.find(u => u.id === receivable.userId);
          console.log('[useReceivableDetail] Found user:', user ? `${user.firstName} (${user.id})` : 'NOT FOUND');
        } catch (error) {
          console.error('Failed to fetch user for receivable detail:', error);
        }
        
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

  return useMutation({
    mutationFn: async (data: CreateReceivableDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const local_ref_id = `L-REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userId = useAuthStore.getState().profile?.id;

      await db.insert(schema.receivables).values({
        id,
        local_ref_id,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, local_ref_id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

export function useCreateReceivableRealization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReceivableRealizationDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `recrel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const local_ref_id = `L-REC-REL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userId = useAuthStore.getState().profile?.id;

      await db.insert(schema.receivableRealizations).values({
        id,
        local_ref_id,
        ...data,
        realizationDate: new Date(data.realizationDate),
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      });

      return { id, local_ref_id, ...data };
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
          .set({
            deletedAt: new Date(),
            updatedBy: useAuthStore.getState().profile?.id,
            updatedAt: new Date(),
            _dirty: true,
          })
          .where(eq(schema.receivables.id, id));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receivables'] });
      },
    });
  }
  
  export function useBulkDeleteReceivableByUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();
      for (const userId of userIds) {
        await db
          .update(schema.receivables)
          .set({
            deletedAt: now,
            updatedBy: useAuthStore.getState().profile?.id,
            updatedAt: now,
            _dirty: true,
          })
          .where(
            and(
              eq(schema.receivables.userId, userId),
              eq(schema.receivables.organizationId, orgId)
            )
          );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
    },
  });
}

export function useUpdateReceivable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateReceivableDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const { id, ...updateData } = data;
      const now = new Date();

      await db
        .update(schema.receivables)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedBy: useAuthStore.getState().profile?.id,
          updatedAt: now,
          _dirty: true,
        })
        .where(
          and(
            eq(schema.receivables.id, id),
            eq(schema.receivables.organizationId, orgId)
          )
        );

      return { id, ...updateData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
    },
  });
}
