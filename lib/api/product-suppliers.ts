import { useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { apiClient } from "./client";

export interface ProductSupplier {
  supplierId: string;
  supplierName: string;
  totalQuantity: number;
  totalValue: number;
  lastPurchaseDate: Date;
  transactionCount: number;
}

export interface ProductSupplierTransaction {
  id: string;
  purchaseDate: Date;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string | null;
}

export function useProductSuppliers(productId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["product-suppliers", productId, orgId],
    queryFn: async () => {
      console.log(
        "[useProductSuppliers] Starting query for productId:",
        productId,
        "orgId:",
        orgId,
      );

      if (!productId || !orgId) {
        console.log("[useProductSuppliers] Missing productId or orgId");
        return [];
      }

      // Get all inventory transactions for this product (type = PURCHASE, status = COMPLETED)
      const transactions = await db
        .select()
        .from(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.productId, productId),
            eq(schema.inventoryTransactions.type, "PURCHASE"),
            eq(schema.inventoryTransactions.status, "COMPLETED"),
            eq(schema.inventoryTransactions.organizationId, orgId),
            isNull(schema.inventoryTransactions.deletedAt),
          ),
        );

      console.log(
        "[useProductSuppliers] Found transactions:",
        transactions.length,
      );
      console.log(
        "[useProductSuppliers] Transactions:",
        JSON.stringify(transactions, null, 2),
      );

      if (transactions.length === 0) return [];

      // Extract purchase refs from transaction local_ref_id
      // Pattern: {purchaseLocalRefId}_{productId}
      // We need to remove the _{productId} suffix
      const purchaseRefs = new Set<string>();
      transactions.forEach((tx) => {
        if (tx.local_ref_id) {
          // Remove _{productId} from the end
          const purchaseRef = tx.local_ref_id.replace(`_${productId}`, "");
          purchaseRefs.add(purchaseRef);
          console.log(
            "[useProductSuppliers] Extracted purchaseRef:",
            purchaseRef,
            "from",
            tx.local_ref_id,
          );
        }
      });

      console.log(
        "[useProductSuppliers] Purchase refs:",
        Array.from(purchaseRefs),
      );

      if (purchaseRefs.size === 0) return [];

      // Get all completed purchases
      const purchases = await db
        .select()
        .from(schema.purchases)
        .where(
          and(
            eq(schema.purchases.organizationId, orgId),
            eq(schema.purchases.status, "COMPLETED"),
            isNull(schema.purchases.deletedAt),
          ),
        );

      console.log("[useProductSuppliers] Found purchases:", purchases.length);
      console.log(
        "[useProductSuppliers] Purchases:",
        JSON.stringify(
          purchases.map((p) => ({
            id: p.id,
            local_ref_id: p.local_ref_id,
            supplierId: p.supplierId,
          })),
          null,
          2,
        ),
      );

      // Filter purchases by local_ref_id
      const relevantPurchases = purchases.filter(
        (p) => p.local_ref_id && purchaseRefs.has(p.local_ref_id),
      );

      console.log(
        "[useProductSuppliers] Relevant purchases:",
        relevantPurchases.length,
      );

      // Group by supplierId
      const supplierMap = new Map<
        string,
        {
          supplierId: string;
          totalQuantity: number;
          totalValue: number;
          lastPurchaseDate: Date | null;
          purchaseIds: Set<string>;
        }
      >();

      // Get current product price for calculation
      const productData = await db
        .select({ purchasePrice: schema.products.purchasePrice })
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1);

      const currentPrice = productData[0]?.purchasePrice || 0;
      console.log("[useProductSuppliers] Current product price:", currentPrice);

      for (const purchase of relevantPurchases) {
        if (!purchase.supplierId) continue;

        if (!supplierMap.has(purchase.supplierId)) {
          supplierMap.set(purchase.supplierId, {
            supplierId: purchase.supplierId,
            totalQuantity: 0,
            totalValue: 0,
            lastPurchaseDate: purchase.createdAt,
            purchaseIds: new Set(),
          });
        }

        const supplierData = supplierMap.get(purchase.supplierId)!;

        // Find transactions for this purchase and product
        const purchaseTxs = transactions.filter((tx) =>
          tx.local_ref_id?.startsWith(purchase.local_ref_id + "_"),
        );

        console.log(
          "[useProductSuppliers] Purchase",
          purchase.id,
          "has",
          purchaseTxs.length,
          "transactions",
        );

        for (const tx of purchaseTxs) {
          supplierData.totalQuantity += tx.quantity;
          supplierData.totalValue += tx.quantity * currentPrice;
        }

        // Update last purchase date
        if (
          purchase.createdAt &&
          (!supplierData.lastPurchaseDate ||
            purchase.createdAt > supplierData.lastPurchaseDate)
        ) {
          supplierData.lastPurchaseDate = purchase.createdAt;
        }

        // Track unique purchases
        supplierData.purchaseIds.add(purchase.id);
      }

      console.log("[useProductSuppliers] Supplier map size:", supplierMap.size);

      // Get supplier names and build final result
      const result: ProductSupplier[] = [];

      for (const [supplierId, data] of supplierMap.entries()) {
        const supplier = await db
          .select({ name: schema.suppliers.name })
          .from(schema.suppliers)
          .where(eq(schema.suppliers.id, supplierId))
          .limit(1);

        result.push({
          supplierId: data.supplierId,
          supplierName: supplier[0]?.name || "Unknown Supplier",
          totalQuantity: data.totalQuantity,
          totalValue: data.totalValue,
          lastPurchaseDate: data.lastPurchaseDate || new Date(),
          transactionCount: data.purchaseIds.size,
        });
      }

      // Sort by last purchase date (most recent first)
      result.sort(
        (a, b) =>
          new Date(b.lastPurchaseDate).getTime() -
          new Date(a.lastPurchaseDate).getTime(),
      );

      console.log("[useProductSuppliers] Final result:", result);

      return result;
    },
    enabled: !!productId && !!orgId,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

export function useProductSupplierTransactions(
  productId: string,
  supplierId: string,
) {
  return useQuery({
    queryKey: ["product-supplier-transactions", productId, supplierId],
    queryFn: async () => {
      const response = await apiClient.get<ProductSupplierTransaction[]>(
        `/products/${productId}/suppliers/${supplierId}/transactions`,
      );
      return response.data;
    },
    enabled: !!productId && !!supplierId,
  });
}
