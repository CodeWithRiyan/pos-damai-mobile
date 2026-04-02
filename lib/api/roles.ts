import { apiClient } from '@/lib/api/client';

export * from '@/hooks/use-role';

import type { Role, Permission, CreateRoleDTO, UpdateRoleDTO } from '@/hooks/use-role';

export async function apiGetRoles(): Promise<Role[]> {
  const response = await apiClient.get('/roles');
  return response.data.data;
}

export async function apiGetRole(id: string): Promise<Role | null> {
  const response = await apiClient.get(`/roles/${id}`);
  return response.data.data ?? null;
}

export async function apiGetPermissions(): Promise<Permission[]> {
  const response = await apiClient.get('/permissions');
  return response.data.data;
}

export async function apiCreateRole(data: CreateRoleDTO): Promise<Role> {
  const response = await apiClient.post('/roles', data);
  return response.data.data;
}

export async function apiUpdateRole(id: string, data: UpdateRoleDTO): Promise<Role> {
  const response = await apiClient.put(`/roles/${id}`, data);
  return response.data.data;
}

export async function apiDeleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export async function apiBulkDeleteRole(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.delete(`/roles/${id}`)));
}
