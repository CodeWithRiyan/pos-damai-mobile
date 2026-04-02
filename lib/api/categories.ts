import { categories } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, like, desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface Category {
  id: string;
  name: string;
  point: number;
  retailPoint: number;
  wholesalePoint: number;
  description: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCategoryDTO {
  name: string;
  point?: number;
  retailPoint?: number;
  wholesalePoint?: number;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
  id: string;
}

export async function fetchCategories(params?: { search?: string }): Promise<Category[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [
    eq(categories.organizationId, orgId),
    isNull(categories.deletedAt),
  ];

  if (params?.search) {
    conditions.push(like(categories.name, `%${params.search}%`));
  }

  const result = await db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(desc(categories.createdAt));

  return result as unknown as Category[];
}

export async function fetchCategory(id: string): Promise<Category | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as Category;
}

export async function createCategory(data: CreateCategoryDTO): Promise<Category> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const newCategory = {
    id,
    name: data.name,
    imageUrl: data.imageUrl || null,
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
  };

  await db.insert(categories).values(newCategory as any);

  return newCategory as unknown as Category;
}

export async function updateCategory(data: UpdateCategoryDTO): Promise<void> {
  const { id, ...rest } = data;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(categories)
    .set({
      ...rest,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db
    .update(categories)
    .set({
      deletedAt: now,
      updatedBy: userId,
      updatedAt: now,
      _dirty: true,
    })
    .where(eq(categories.id, id));
}

export async function bulkDeleteCategory(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const id of ids) {
    await db
      .update(categories)
      .set({
        deletedAt: now,
        updatedBy: userId,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(categories.id, id));
  }
}