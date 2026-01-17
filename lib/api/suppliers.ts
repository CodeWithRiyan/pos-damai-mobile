import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { storageAdapter } from "@/lib/storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq, inArray, isNull } from "drizzle-orm";

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt?: Date | null;
  _dirty?: boolean | null;
}

export type CreateSupplierDTO = Omit<Supplier, "id" | "createdAt" | "updatedAt" | "organizationId" | "_dirty">;
export type UpdateSupplierDTO = Partial<CreateSupplierDTO> & { id: string };

function getOrganizationId(): string {
  const profile = storageAdapter.getItem("userProfile");
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.selectedOrganizationId || "";
    } catch {
      return "";
    }
  }
  return "";
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const result = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)));
      return result as Supplier[];
    },
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
      const orgId = getOrganizationId();
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newSupplier = {
        id,
        ...data,
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
        _dirty: true,
      };

      await db.insert(suppliers).values(newSupplier);
      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSupplierDTO) => {
      const { id, ...updateData } = data;
      const now = new Date();

      await db
        .update(suppliers)
        .set({
          ...updateData,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(suppliers.id, id));
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      await db
        .update(suppliers)
        .set({
          deletedAt: now,
          _dirty: true,
          updatedAt: now,
        })
        .where(eq(suppliers.id, id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useBulkDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const now = new Date();
      await db
        .update(suppliers)
        .set({
          deletedAt: now,
          _dirty: true,
          updatedAt: now,
        })
        .where(inArray(suppliers.id, ids));
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
