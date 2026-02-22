import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface Finance {
  id: string;
  local_ref_id: string;
  nominal: number;
  type: "INCOME" | "EXPENSES";
  expensesType?: string | null;
  transactionDate: Date;
  status: "DRAFT" | "COMPLETED";
  note?: string | null;
  inputToCashdrawer: boolean;
  userId?: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  _dirty: boolean;
  _syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function useFinances() {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["finances", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const results = await db
        .select()
        .from(schema.finances)
        .where(
          and(
            eq(schema.finances.organizationId, orgId),
            isNull(schema.finances.deletedAt)
          )
        )
        .orderBy(desc(schema.finances.transactionDate));
      return results as unknown as Finance[];
    },
    enabled: !!orgId,
  });
}

export function useFinance(id?: string) {
  return useQuery({
    queryKey: ["finances", id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db
        .select()
        .from(schema.finances)
        .where(eq(schema.finances.id, id))
        .limit(1);
      
      if (results.length === 0) return null;
      return results[0] as unknown as Finance;
    },
    enabled: !!id,
  });
}

export function useCreateFinance() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useMutation({
    mutationFn: async (data: Partial<Finance>) => {
      if (!orgId) throw new Error("Organization ID is required");

      const now = new Date();
      const financeId = data.id || `fin_${Date.now()}`;
      
      const existing = data.id 
        ? await db.select({ r: schema.finances.local_ref_id }).from(schema.finances).where(eq(schema.finances.id, data.id)).limit(1)
        : [];
      
      const localRefId = existing.length > 0 ? existing[0].r : (data.local_ref_id || `L-FIN-${Date.now()}`);

      const profile = useAuthStore.getState().profile;
      const userId = profile?.id || null;

      const financeValues = {
        id: financeId,
        local_ref_id: localRefId,
        nominal: data.nominal || 0,
        type: data.type || "EXPENSES",
        expensesType: data.expensesType || null,
        transactionDate: data.transactionDate || now,
        status: data.status || "COMPLETED",
        note: data.note || null,
        inputToCashdrawer: data.inputToCashdrawer ?? false,
        userId: userId,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: data.createdAt || now,
        updatedAt: now,
        _dirty: true,
        _syncedAt: null,
      };

      await db
        .insert(schema.finances)
        .values(financeValues)
        .onConflictDoUpdate({
          target: schema.finances.id,
          set: {
            ...financeValues,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          },
        });

      return { id: financeId };
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      if (responseData?.id) {
          queryClient.invalidateQueries({ queryKey: ["finances", responseData.id] });
      }
    },
  });
}

export function useDeleteFinance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db
        .update(schema.finances)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.finances.id, id));
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
    },
  });
}
