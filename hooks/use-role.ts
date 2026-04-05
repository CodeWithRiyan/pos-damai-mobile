import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/db/client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
  isSystem: boolean;
  permissions?: Permission[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDTO {
  id: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
}

async function fetchRolesApi(): Promise<Role[]> {
  const response = await apiClient.get('/roles');
  return response.data.data;
}

async function fetchRoleApi(id: string): Promise<Role | null> {
  const response = await apiClient.get(`/roles/${id}`);
  return response.data.data ?? null;
}

async function fetchPermissionsApi(): Promise<Permission[]> {
  const response = await apiClient.get('/roles/permissions');
  return response.data.data.data;
}

async function createRoleApi(data: CreateRoleDTO): Promise<Role> {
  const response = await apiClient.post('/roles', data);
  return response.data.data;
}

async function updateRoleApi(id: string, data: UpdateRoleDTO): Promise<Role> {
  const response = await apiClient.put(`/roles/${id}`, data);
  return response.data.data;
}

async function deleteRoleApi(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export function useRoles() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRolesApi();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, isLoading: loading, error, refetch };
}

export function usePermissions() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPermissionsApi();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, isLoading: loading, error, refetch };
}

export function useRole(id: string) {
  const [data, setData] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRoleApi(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [id]);

  return { data, loading, isLoading: loading, error, refetch };
}

export function useCreateRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateRoleDTO,
      options?: { onSuccess?: (data: Role) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createRoleApi(data);
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

export function useUpdateRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateRoleDTO,
      options?: { onSuccess?: (data: Role) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await updateRoleApi(data.id, data);
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

export function useDeleteRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteRoleApi(id);
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

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useBulkDeleteRole() {
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
        await Promise.all(ids.map((id) => deleteRoleApi(id)));
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

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}
