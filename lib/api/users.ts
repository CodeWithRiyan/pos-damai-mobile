import { apiClient } from '@/lib/api/client';

export * from '@/hooks/use-user';

import type { User, CreateUserDTO, UpdateUserDTO } from '@/hooks/use-user';

export async function apiGetUsers(): Promise<User[]> {
  const response = await apiClient.get('/users');
  return response.data.data;
}

export async function apiGetUser(id: string): Promise<User | null> {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data ?? null;
}

export async function apiCreateUser(data: CreateUserDTO): Promise<User> {
  const response = await apiClient.post('/users', data);
  return response.data.data;
}

export async function apiUpdateUser(id: string, data: UpdateUserDTO): Promise<User> {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data.data;
}

export async function apiDeleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function apiBulkDeleteUser(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.delete(`/users/${id}`)));
}
