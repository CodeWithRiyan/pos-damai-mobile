import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/system/auth';
import { and, eq, isNull, notLike } from 'drizzle-orm';
import { apiClient } from '@/db/client';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string | null;
  username: string;
  password?: string;
  organizationId: string | null;
  lastLoginAt: Date | string | null;
  isActive: boolean;
  roles?: Array<{
    id: string;
    name: string;
    permissions?: string[];
    role?: { id: string; name: string };
  }>;
  createdAt: Date | null;
  updatedAt: Date | null;
  avatar?: string | null;
  phone?: string | null;
  provider?: string;
  emailVerified?: boolean;
  isLocked?: boolean;
  lockReason?: string | null;
}

export interface CreateUserDTO {
  username: string;
  name: string;
  email?: string;
  password?: string;
  roleId?: string;
}

export interface UpdateUserDTO {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  password?: string;
}

export async function createUser(data: CreateUserDTO): Promise<User> {
  const response = await apiClient.post('/users', data);
  return response.data.data;
}

export async function updateUser(data: UpdateUserDTO): Promise<User> {
  const { id, ...rest } = data;
  const response = await apiClient.put(`/users/${id}`, rest);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function bulkDeleteUser(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.delete(`/users/${id}`)));
}

export interface IUserLog {
  id: string;
  date: Date | string | null;
  activity: string;
  type: string;
}

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get('/users');
  return response.data.data;
}

export async function fetchUser(id: string): Promise<User | null> {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data ?? null;
}

export async function refetchUserById(id: string): Promise<User | null> {
  return fetchUser(id);
}

export async function fetchUserLog(userId: string): Promise<IUserLog[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const logs: IUserLog[] = [];

  const shifts = await db
    .select()
    .from(schema.shifts)
    .where(and(eq(schema.shifts.userId, userId), eq(schema.shifts.organizationId, orgId)));

  shifts.forEach((s) => {
    if (s.startTime) {
      logs.push({
        id: `${s.id}_start`,
        date: s.startTime,
        activity: 'Buka Shift',
        type: 'SHIFT',
      });
    }
    if (s.endTime) {
      logs.push({
        id: `${s.id}_end`,
        date: s.endTime,
        activity: 'Tutup Shift',
        type: 'SHIFT',
      });
    }
  });

  const transactions = await db
    .select()
    .from(schema.transactions)
    .where(
      and(eq(schema.transactions.createdBy, userId), eq(schema.transactions.organizationId, orgId)),
    );

  transactions.forEach((t) => {
    logs.push({
      id: t.id,
      date: t.transactionDate || t.createdAt,
      activity: 'Transaksi Penjualan',
      type: 'SALES',
    });
  });

  return logs.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsers();
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

export function useUser(id: string) {
  const [data, setData] = useState<User | null>(null);
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
      const result = await fetchUser(id);
      console.log('Fetched user:', result);
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

export function useLocalUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = useAuthStore.getState().getOrganizationId();
      if (!orgId) {
        setData([]);
        return;
      }
      const result = await db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.organizationId, orgId),
          isNull(schema.users.deletedAt),
          notLike(schema.users.username, '%_deleted_%'),
        ));
      setData(result as unknown as User[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading, error, refetch: fetch };
}

export function useCurrentUser() {
  const profile = useAuthStore((state) => state.profile);
  return { data: profile, loading: false, error: null };
}

export function useUserLog(userId: string) {
  const [data, setData] = useState<IUserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserLog(userId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateUserDTO,
      options?: { onSuccess?: (data: User) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createUser(data);
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

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    loading: loading,
    isPending: loading,
    error,
  };
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateUserDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateUser(data);
        options?.onSuccess?.();
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

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    loading: loading,
    isPending: loading,
    error,
  };
}

export function useDeleteUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteUser(id);
        options?.onSuccess?.();
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

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    loading: loading,
    isPending: loading,
    error,
  };
}

export function useBulkDeleteUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await bulkDeleteUser(ids);
        options?.onSuccess?.();
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

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    loading: loading,
    isPending: loading,
    error,
  };
}
