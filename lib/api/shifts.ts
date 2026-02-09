import { db } from '../db';
import * as schema from '../db/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';

export interface Shift {
  id: string;
  local_ref_id: string | null;
  cashDrawerId: string;
  cashDrawerName?: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime: Date | null;
  initialBalance: number;
  finalBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  status: string; // 'ACTIVE' | 'CLOSED'
  note: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StartShiftDTO {
  cashDrawerId: string;
  initialBalance: number;
  note?: string;
}

export interface EndShiftDTO {
  id: string;
  finalBalance: number;
  note?: string;
}

// Get all shifts from local SQLite
export function useShifts() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['shifts', orgId],
    queryFn: async () => {
      const shiftsResult = await db
        .select()
        .from(schema.shifts)
        .where(and(
          eq(schema.shifts.organizationId, orgId),
          isNull(schema.shifts.deletedAt)
        ))
        .orderBy(desc(schema.shifts.startTime));

      // Join with cashdrawer and user names
      const shiftsWithDetails = await Promise.all(
        shiftsResult.map(async (shift) => {
          const cashDrawer = await db
            .select({ name: schema.cashDrawers.name })
            .from(schema.cashDrawers)
            .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
            .limit(1);

          const user = await db
            .select({ name: schema.users.name })
            .from(schema.users)
            .where(eq(schema.users.id, shift.userId))
            .limit(1);

          return {
            ...shift,
            cashDrawerName: cashDrawer[0]?.name || 'Unknown',
            userName: user[0]?.name || 'Unknown',
          };
        })
      );

      return shiftsWithDetails as Shift[];
    },
    enabled: !!orgId,
  });
}

// Get active shift for a cashdrawer
export function useActiveShift(cashDrawerId?: string) {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['shifts', 'active', cashDrawerId, orgId],
    queryFn: async () => {
      if (!cashDrawerId || !orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(and(
          eq(schema.shifts.cashDrawerId, cashDrawerId),
          eq(schema.shifts.status, 'ACTIVE'),
          eq(schema.shifts.organizationId, orgId),
          isNull(schema.shifts.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) return null;

      const shift = result[0];

      // Get cashdrawer and user names
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      const user = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      return {
        ...shift,
        cashDrawerName: cashDrawer[0]?.name || 'Unknown',
        userName: user[0]?.name || 'Unknown',
      } as Shift;
    },
    enabled: !!cashDrawerId && !!orgId,
  });
}

// Get current active shift (any cashdrawer) for the logged-in user's organization
export function useCurrentShift() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['shifts', 'current', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(and(
          eq(schema.shifts.status, 'ACTIVE'),
          eq(schema.shifts.organizationId, orgId),
          isNull(schema.shifts.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) return null;

      const shift = result[0];

      // Get cashdrawer and user names
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      const user = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      return {
        ...shift,
        cashDrawerName: cashDrawer[0]?.name || 'Unknown',
        userName: user[0]?.name || 'Unknown',
      } as Shift;
    },
    enabled: !!orgId,
  });
}

// Get last closed shift for a cashdrawer
export function useLastShift(cashDrawerId?: string) {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['shifts', 'last', cashDrawerId, orgId],
    queryFn: async () => {
      if (!cashDrawerId || !orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(and(
          eq(schema.shifts.cashDrawerId, cashDrawerId),
          eq(schema.shifts.status, 'CLOSED'),
          eq(schema.shifts.organizationId, orgId),
          isNull(schema.shifts.deletedAt)
        ))
        .orderBy(desc(schema.shifts.endTime))
        .limit(1);

      if (result.length === 0) return null;

      return result[0] as Shift;
    },
    enabled: !!cashDrawerId && !!orgId,
  });
}

// Start new shift
export function useStartShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StartShiftDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const userId = useAuthStore.getState().profile?.id;
      
      if (!orgId) {
        throw new Error('ID Organisasi tidak ditemukan');
      }

      if (!userId) {
        throw new Error('User tidak ditemukan');
      }

      // Check if there's already an active shift for this cashdrawer
      const activeShift = await db
        .select()
        .from(schema.shifts)
        .where(and(
          eq(schema.shifts.cashDrawerId, data.cashDrawerId),
          eq(schema.shifts.status, 'ACTIVE'),
          eq(schema.shifts.organizationId, orgId)
        ))
        .limit(1);

      if (activeShift.length > 0) {
        throw new Error('Shift sudah aktif untuk cashdrawer ini. Silakan tutup shift yang aktif terlebih dahulu.');
      }

      const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localRefId = `ref_shift_${Date.now()}`;
      const now = new Date();

      const newShift = {
        id: shiftId,
        local_ref_id: localRefId,
        cashDrawerId: data.cashDrawerId,
        userId: userId,
        startTime: now,
        endTime: null,
        initialBalance: data.initialBalance,
        finalBalance: null,
        expectedBalance: null,
        difference: null,
        status: 'ACTIVE',
        note: data.note || null,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.shifts).values(newShift);
      return { id: shiftId, ...data };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['shifts', orgId] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'current', orgId] });
    },
  });
}

// End shift
export function useEndShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndShiftDTO) => {
      const now = new Date();

      // Get the shift to calculate expected balance
      const shift = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, data.id))
        .limit(1);

      if (shift.length === 0) {
        throw new Error('Shift tidak ditemukan');
      }

      const expectedBalance = shift[0].initialBalance; // You may want to add logic to calculate expected based on transactions
      const difference = data.finalBalance - expectedBalance;

      await db
        .update(schema.shifts)
        .set({
          endTime: now,
          finalBalance: data.finalBalance,
          expectedBalance: expectedBalance,
          difference: difference,
          status: 'CLOSED',
          note: data.note || shift[0].note,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.shifts.id, data.id));

      return { ...data };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['shifts', orgId] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'current', orgId] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'last'] });
    },
  });
}
