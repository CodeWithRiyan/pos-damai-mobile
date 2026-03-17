import { db } from "../db";
import * as schema from "../db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";

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
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
  id: string;
}

// Get product counts by category
export function useProductCountsByCategory() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["productCountsByCategory", orgId],
    queryFn: async () => {
      const products = await db
        .select({ categoryId: schema.products.categoryId })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Count products per category
      const counts: Record<string, number> = {};
      for (const product of products) {
        counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
      }
      return counts;
    },
    enabled: !!orgId,
  });
}

// Get capital value (stock × purchase price) by category
export function useCapitalValueByCategory() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["capitalValueByCategory", orgId],
    queryFn: async () => {
      // Get all products with their category
      const products = await db
        .select({
          id: schema.products.id,
          categoryId: schema.products.categoryId,
          purchasePrice: schema.products.purchasePrice,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Calculate capital value per category
      const values: Record<string, number> = {};

      for (const product of products) {
        // Get stock from inventory transactions
        const transactions = await db
          .select({ quantity: schema.inventoryTransactions.quantity })
          .from(schema.inventoryTransactions)
          .where(
            and(
              eq(schema.inventoryTransactions.productId, product.id),
              eq(schema.inventoryTransactions.status, "COMPLETED"),
            ),
          );

        const stock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
        const value = stock * (product.purchasePrice ?? 0);
        values[product.categoryId] = (values[product.categoryId] || 0) + value;
      }

      return values;
    },
    enabled: !!orgId,
  });
}

// Get all categories from local SQLite (excluding soft-deleted)
export function useCategories() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["categories", orgId],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.organizationId, orgId),
            isNull(schema.categories.deletedAt),
          ),
        );
      return result as Category[];
    },
    enabled: !!orgId,
  });
}

// Get single category
export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, id))
        .limit(1);
      return result[0] as Category | undefined;
    },
    enabled: !!id,
  });
}

// Create category (saved to local SQLite, synced via SyncEngine)
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();

      if (!orgId) {
        throw new Error(
          "Gagal menambahkan kategori: ID Organisasi tidak ditemukan. Silakan login kembali.",
        );
      }

      // Check for duplicate name
      const existing = await db
        .select()
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.name, data.name),
            eq(schema.categories.organizationId, orgId),
            isNull(schema.categories.deletedAt),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Kategori dengan nama "${data.name}" sudah ada.`);
      }

      const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      const newCategory = {
        id,
        name: data.name,
        point: data.point ?? 0,
        retailPoint: data.retailPoint ?? 0,
        wholesalePoint: data.wholesalePoint ?? 0,
        description: data.description ?? null,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.categories).values(newCategory);
      return newCategory as Category;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["categories", data.organizationId],
      });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCategoryDTO) => {
      const { id, ...rest } = data;
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();

      if (rest.name) {
        const existing = await db
          .select()
          .from(schema.categories)
          .where(
            and(
              eq(schema.categories.name, rest.name),
              eq(schema.categories.organizationId, orgId),
              ne(schema.categories.id, id),
              isNull(schema.categories.deletedAt),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`Kategori dengan nama "${rest.name}" sudah ada.`);
        }
      }

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.categories)
        .set({
          ...rest,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.categories.id, id));

      return { id, ...rest };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["categories", orgId] });
      queryClient.invalidateQueries({ queryKey: ["categories", data.id] });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      // Soft delete locally
      await db
        .update(schema.categories)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.categories.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["categories", orgId] });
    },
  });
}

// Bulk delete categories
export function useBulkDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        await db
          .update(schema.categories)
          .set({
            deletedAt: now,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.categories.id, id));
      }

      return data;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["categories", orgId] });
    },
  });
}
