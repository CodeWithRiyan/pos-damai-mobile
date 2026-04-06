import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/system/auth';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { ShiftStatus } from '@/constants';

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
  status: string;
  note: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  transactionHistory?: ShiftTransactionHistory[];
}

export interface ShiftTransactionHistory {
  id: string;
  transactionId: string | null;
  ref: string | null;
  transactionDate: Date;
  type:
    | 'INITIAL'
    | 'SALES'
    | 'INCOME'
    | 'PURCHASES'
    | 'PAYABLE_REALIZATION'
    | 'SUPPLIES'
    | 'EQUIPMENT'
    | 'CASH_DEPOSIT'
    | 'OTHER_EXPENSES';
  nominal: number;
  note: string;
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

export async function fetchShifts(): Promise<Shift[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const shiftsResult = await db
    .select()
    .from(schema.shifts)
    .where(and(eq(schema.shifts.organizationId, orgId), isNull(schema.shifts.deletedAt)))
    .orderBy(desc(schema.shifts.startTime));

  const shiftsWithDetails = await Promise.all(
    shiftsResult.map(async (shift) => {
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      const user = await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      return {
        ...shift,
        cashDrawerName: cashDrawer[0]?.name || 'Unknown',
        userName: user[0]?.name || 'Unknown',
      };
    }),
  );

  return shiftsWithDetails as unknown as Shift[];
}

export async function fetchActiveShift(cashDrawerId?: string): Promise<Shift | null> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!cashDrawerId || !orgId) return null;

  const result = await db
    .select()
    .from(schema.shifts)
    .where(
      and(
        eq(schema.shifts.cashDrawerId, cashDrawerId),
        eq(schema.shifts.status, ShiftStatus.ACTIVE),
        eq(schema.shifts.organizationId, orgId),
        isNull(schema.shifts.deletedAt),
      ),
    )
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Shift;
}

export async function fetchCurrentShift(): Promise<Shift | null> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return null;

  const result = await db
    .select()
    .from(schema.shifts)
    .where(
      and(
        eq(schema.shifts.organizationId, orgId),
        eq(schema.shifts.status, ShiftStatus.ACTIVE),
        isNull(schema.shifts.deletedAt),
      ),
    )
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Shift;
}

export async function fetchShift(id: string): Promise<Shift | null> {
  const result = await db.select().from(schema.shifts).where(eq(schema.shifts.id, id)).limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Shift;
}

export async function createShift(data: StartShiftDTO): Promise<Shift> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const cashDrawer = await db
    .select({ name: schema.cashDrawers.name })
    .from(schema.cashDrawers)
    .where(eq(schema.cashDrawers.id, data.cashDrawerId))
    .limit(1);

  const newShift = {
    id,
    local_ref_id: null,
    cashDrawerId: data.cashDrawerId,
    cashDrawerName: cashDrawer[0]?.name || null,
    userId: userId || '',
    userName: useAuthStore.getState().profile?.name || null,
    startTime: now,
    endTime: null,
    initialBalance: data.initialBalance,
    finalBalance: null,
    expectedBalance: null,
    difference: null,
    status: ShiftStatus.ACTIVE,
    note: data.note || null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(schema.shifts).values(newShift as any);

  return newShift as unknown as Shift;
}

export async function endShift(id: string, finalBalance: number, note?: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(schema.shifts)
    .set({
      endTime: now,
      finalBalance,
      status: ShiftStatus.CLOSED,
      note: note || null,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(schema.shifts.id, id));
}

export function useShifts() {
  const [data, setData] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShifts();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useCurrentShift() {
  const [data, setData] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentShift();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useActiveShift(cashDrawerId?: string) {
  const [data, setData] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!cashDrawerId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchActiveShift(cashDrawerId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cashDrawerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useShift(id: string) {
  const [data, setData] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchShift(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useStartShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: StartShiftDTO,
      options?: { onSuccess?: (data: Shift) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createShift(data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useEndShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      params: { id: string; finalBalance: number; note?: string },
      options?: { onSuccess?: (data: any) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await endShift(params.id, params.finalBalance, params.note);
        options?.onSuccess?.(params);
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useLastShift() {
  const [data, setData] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = useAuthStore.getState().getOrganizationId();
      if (!orgId) {
        setData(null);
        setLoading(false);
        return;
      }

      const result = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.organizationId, orgId),
            eq(schema.shifts.status, ShiftStatus.CLOSED),
            isNull(schema.shifts.deletedAt),
          ),
        )
        .orderBy(desc(schema.shifts.endTime))
        .limit(1);

      if (result.length === 0) {
        setData(null);
      } else {
        setData(result[0] as unknown as Shift);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export const useShiftDetail = (id: string) => useShift(id);
