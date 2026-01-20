import { db } from "../db";
import { purchaseReturns, purchaseReturnItems, inventoryTransactions, suppliers } from "../db/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, desc } from "drizzle-orm";
import { useAuthStore } from "@/stores/auth";

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
  returnType: 'CASH' | 'ITEM';
  items?: ReturnPurchasingItem[];
  createdAt: Date;
}

export const usePurchaseReturns = () => {
  const organizationId = useAuthStore((state) => state.profile?.selectedOrganizationId);

  return useQuery({
    queryKey: ["purchase-returns", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const [retdat, supdat] = await Promise.all([
        db.select().from(purchaseReturns).where(eq(purchaseReturns.organizationId, organizationId)).orderBy(desc(purchaseReturns.createdAt)),
        db.select().from(suppliers).where(eq(suppliers.organizationId, organizationId))
      ]);
      
      const supplierMap = new Map(supdat.map(s => [s.id, s.name]));
      
      return retdat.map(r => ({
        ...r,
        supplierName: supplierMap.get(r.supplierId) || "Unknown"
      }));
    },
    enabled: !!organizationId,
  });
};

export const usePurchaseReturn = (id: string) => {
  const organizationId = useAuthStore((state) => state.profile?.selectedOrganizationId);

  return useQuery({
    queryKey: ["purchase-return", id],
    queryFn: async () => {
      if (!organizationId || !id) return null;
      
      // Get return record
      const returnResult = await db.select().from(purchaseReturns).where(eq(purchaseReturns.id, id)).limit(1);
      if (!returnResult.length) return null;
      
      const returnRecord = returnResult[0];
      
      // Get supplier name
      const supplierResult = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, returnRecord.supplierId)).limit(1);
      
      // Get items with product names
      const items = await db.select().from(purchaseReturnItems).where(eq(purchaseReturnItems.purchaseReturnId, id));
      
      // Import products to get names
      const { products } = await import("../db/schema");
      const itemsWithNames = await Promise.all(
        items.map(async (item) => {
          const productResult = await db.select({ name: products.name }).from(products).where(eq(products.id, item.productId)).limit(1);
          return {
            ...item,
            productName: productResult[0]?.name || "Unknown"
          };
        })
      );
      
      return {
        ...returnRecord,
        supplierName: supplierResult[0]?.name || "Unknown",
        items: itemsWithNames,
      };
    },
    enabled: !!organizationId && !!id,
  });
};

export const useCreatePurchaseReturn = () => {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.profile?.selectedOrganizationId);

  return useMutation({
    mutationFn: async (data: Omit<ReturnPurchasing, "id" | "local_ref_id" | "createdAt">) => {
      if (!organizationId) throw new Error("Organization ID is required");

      const returnId = `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localRefId = `ref_ret_${Date.now()}`;
      const now = new Date();

      await db.transaction(async (tx) => {
        // 1. Create Return Header
        await tx.insert(purchaseReturns).values({
          id: returnId,
          local_ref_id: localRefId,
          supplierId: data.supplierId,
          totalAmount: data.totalAmount,
          returnType: data.returnType,
          organizationId,
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
              _dirty: true,
              createdAt: now,
              updatedAt: now,
            });

            // 2b. Reduce stock via transaction (matching backend logic)
            if (data.returnType === 'CASH') {
              await tx.insert(inventoryTransactions).values({
                id: `itrt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                local_ref_id: `${localRefId}-${item.productId}`,
                productId: item.productId,
                type: 'RETURN_PURCHASE',
                quantity: -item.quantity,
                status: 'COMPLETED',
                organizationId,
                _dirty: true,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      });

      return { id: returnId, local_ref_id: localRefId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
    },
  });
};
