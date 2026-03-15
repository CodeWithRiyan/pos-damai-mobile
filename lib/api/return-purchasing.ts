import { InventoryTxType, ReturnType, Status } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { generateLocalRefId } from "../utils/reference";
import {
  inventoryTransactions,
  purchaseReturnItems,
  purchaseReturns,
  suppliers,
  users,
} from "../db/schema";

export interface ReturnPurchasingItem {
  productId: string;
  productName?: string;
  quantity: number;
  purchasePrice: number;
}

export interface ReturnPurchasing {
  id: string;
  local_ref_id: string;
  supplierId: string;
  supplierName?: string;
  totalAmount: number;
  returnType: "CASH" | "ITEM";
  note: string; // Required field for return reason
  items?: ReturnPurchasingItem[];
  createdBy: string | null;
  createdByName?: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseReturnParams {
  supplierId: string;
}

export const usePurchaseReturns = (params: PurchaseReturnParams | void) => {
  const isUsedFilter = !!params?.supplierId;
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useQuery({
    queryKey: ["purchase-returns", organizationId, params?.supplierId],
    queryFn: async () => {
      if (!organizationId) return [];

      const [retdat, supdat] = await Promise.all([
        db
          .select()
          .from(purchaseReturns)
          .where(eq(purchaseReturns.organizationId, organizationId))
          .orderBy(desc(purchaseReturns.createdAt)),
        db
          .select()
          .from(suppliers)
          .where(eq(suppliers.organizationId, organizationId)),
      ]);

      const supplierMap = new Map(supdat.map((s) => [s.id, s.name]));

      const retData = retdat.map((r) => ({
        ...r,
        supplierName: supplierMap.get(r.supplierId) || "Unknown",
      }));

      const filteredRetData = retData.filter(
        (r) => r.supplierId === params?.supplierId,
      );

      return isUsedFilter ? filteredRetData : retData;
    },
    enabled: !!organizationId,
  });
};

export const usePurchaseReturn = (id: string) => {
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useQuery({
    queryKey: ["purchase-return", id],
    queryFn: async () => {
      if (!organizationId || !id) return null;

      // Get return record
      const returnResult = await db
        .select()
        .from(purchaseReturns)
        .where(eq(purchaseReturns.id, id))
        .limit(1);
      if (!returnResult.length) return null;

      const returnRecord = returnResult[0];

      // Get supplier name
      const supplierResult = await db
        .select({ name: suppliers.name })
        .from(suppliers)
        .where(eq(suppliers.id, returnRecord.supplierId))
        .limit(1);

      // Get creator name
      let createdByName = 'Admin';
      if (returnRecord.createdBy) {
        const creatorResult = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, returnRecord.createdBy))
          .limit(1);
        if (creatorResult.length > 0) {
          createdByName = creatorResult[0].name;
        }
      }

      // Get items with product names
      const items = await db
        .select()
        .from(purchaseReturnItems)
        .where(eq(purchaseReturnItems.purchaseReturnId, id));

      // Import products to get names
      const { products } = await import("../db/schema");
      const itemsWithNames = await Promise.all(
        items.map(async (item) => {
          const productResult = await db
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);
          return {
            ...item,
            productName: productResult[0]?.name || "Unknown",
          };
        }),
      );

      return {
        ...returnRecord,
        supplierName: supplierResult[0]?.name || "Unknown",
        createdByName,
        items: itemsWithNames,
      };
    },
    enabled: !!organizationId && !!id,
  });
};

export const useCreatePurchaseReturn = () => {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useMutation({
    mutationFn: async (
      data: Omit<ReturnPurchasing, "id" | "local_ref_id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">,
    ) => {
      if (!organizationId) throw new Error("Organization ID is required");

      const returnId = `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;
      let finalLocalRefId = "";

      await db.transaction(async (tx) => {
        finalLocalRefId = await generateLocalRefId(tx, purchaseReturns, "RTP");
        
        // 1. Create Return Header
        await tx.insert(purchaseReturns).values({
          id: returnId,
          local_ref_id: finalLocalRefId,
          supplierId: data.supplierId,
          totalAmount: data.totalAmount,
          returnType: data.returnType,
          note: data.note,
          organizationId,
          createdBy: userId,
          updatedBy: userId,
          _dirty: true,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Create Items and Transactions
        if (data.items) {
          for (const item of data.items) {
            const itemId = `reti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 2a. Save item
            await tx.insert(purchaseReturnItems).values({
              id: itemId,
              purchaseReturnId: returnId,
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              organizationId,
              createdBy: userId,
              updatedBy: userId,
              _dirty: true,
              createdAt: now,
              updatedAt: now,
            });

            // 2b. Reduce stock via transaction
            const txIdOut = `itrt_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const txRefIdOut = `${finalLocalRefId}-${item.productId}-out`;

            if (!item.productId) {
              console.error(
                "❌ [RETURN API] Product ID is missing for item!",
                item,
              );
              continue;
            }

            // Leg 1: Item goes back to supplier (Stock OUT)
            await tx.insert(inventoryTransactions).values({
              id: txIdOut,
              local_ref_id: txRefIdOut,
              productId: item.productId,
              type: InventoryTxType.RETURN_PURCHASE,
              quantity: -item.quantity,
              status: Status.COMPLETED,
              organizationId,
              createdBy: userId,
              updatedBy: userId,
              _dirty: true,
              createdAt: now,
              updatedAt: now,
            });

            // Leg 2: Replacement item received (Stock IN) - only for ITEM return
            if (data.returnType === ReturnType.ITEM) {
              const txIdIn = `itrt_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const txRefIdIn = `${finalLocalRefId}-${item.productId}-in`;

              await tx.insert(inventoryTransactions).values({
                id: txIdIn,
                local_ref_id: txRefIdIn,
                productId: item.productId,
                type: InventoryTxType.PURCHASE,
                quantity: item.quantity,
                status: Status.COMPLETED,
                organizationId,
                createdBy: userId,
                updatedBy: userId,
                _dirty: true,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      });

      return { id: returnId, local_ref_id: finalLocalRefId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
    },
  });
};
