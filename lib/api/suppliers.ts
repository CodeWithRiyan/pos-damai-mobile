import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { and, eq, inArray, isNull } from "drizzle-orm";

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt?: Date | null;
  _dirty?: boolean | null;
}

export type CreateSupplierDTO = Omit<
  Supplier,
  "id" | "createdAt" | "updatedAt" | "organizationId" | "_dirty"
>;
export type UpdateSupplierDTO = Partial<CreateSupplierDTO> & { id: string };

export function useSuppliers() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["suppliers", orgId],
    queryFn: async () => {
      const result = await db
        .select()
        .from(suppliers)
        .where(
          and(eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)),
        );
      return result as Supplier[];
    },
    enabled: !!orgId,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      if (!id) return null;
      const result = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, id));
      return (result[0] as Supplier) || null;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSupplierDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      const newSupplier = {
        id,
        ...data,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        _dirty: true,
      };

      await db.insert(suppliers).values(newSupplier);
      return newSupplier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers", data.organizationId],
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSupplierDTO) => {
      const { id, ...updateData } = data;
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(suppliers)
        .set({
          ...updateData,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(suppliers.id, id));
      return id;
    },
    onSuccess: (_, variables) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["suppliers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(suppliers)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(suppliers.id, id));
      return id;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["suppliers", orgId] });
    },
  });
}

export function useBulkDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(suppliers)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(inArray(suppliers.id, ids));
      return ids;
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["suppliers", orgId] });
    },
  });
}
