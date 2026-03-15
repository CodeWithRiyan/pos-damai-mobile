import { InventoryTxType, PaymentMethod, Status } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { generateLocalRefId } from "../utils/reference";

export interface Purchase {
  id: string;
  local_ref_id: string | null;
  supplierId: string;
  supplierName?: string;
  totalAmount: number;
  totalPaid: number;
  paymentType: string;
  paymentTypeName?: string;
  paymentTypeId: string | null;
  commission: number;
  dueDate: Date | null;
  note?: string | null;
  organizationId: string;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  purchasePrice?: number;
  note?: string | null;
}

export interface CreatePurchasingDTO {
  id?: string;
  supplierId: string;
  totalPurchase: number;
  totalPaid: number;
  transactionDate: Date | null;
  isPayable: boolean;
  dueDate: Date | null;
  status: string;
  note: string;
  paymentMethodId: string;
  commission?: number;
  items: {
    product: { id: string; purchasePrice: number };
    newPurchasePrice: number;
    quantity: number;
    note?: string;
  }[];
}

// Get all purchases from local SQLite
export function usePurchases(params: { supplierId?: string } | void) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  const conditions = [
    eq(schema.purchases.organizationId, orgId),
    isNull(schema.purchases.deletedAt),
  ];

  if (params?.supplierId) {
    conditions.push(eq(schema.purchases.supplierId, params.supplierId));
  }

  return useQuery({
    queryKey: ["purchases", orgId, params?.supplierId],
    queryFn: async () => {
      const purchaseResult = await db
        .select()
        .from(schema.purchases)
        .where(and(...conditions))
        .orderBy(desc(schema.purchases.createdAt));

      // Join with supplier names
      const purchasesWithSupplier = await Promise.all(
        purchaseResult.map(async (purchase) => {
          const supplier = await db
            .select({ name: schema.suppliers.name })
            .from(schema.suppliers)
            .where(eq(schema.suppliers.id, purchase.supplierId))
            .limit(1);

          return {
            ...purchase,
            supplierName: supplier[0]?.name || "Unknown",
          };
        }),
      );

      return purchasesWithSupplier as Purchase[];
    },
    enabled: !!orgId,
  });
}

export async function fetchPurchase(id: string): Promise<Purchase | null> {
  // Get purchase record
  const purchaseResult = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, id))
    .limit(1);

  if (purchaseResult.length === 0) return null;

  const purchase = purchaseResult[0];

  // Get payment type name
  const paymentType = await db
    .select({ name: schema.paymentTypes.name })
    .from(schema.paymentTypes)
    .where(eq(schema.paymentTypes.id, purchase.paymentTypeId || ""))
    .limit(1);

  // Get supplier name
  const supplier = await db
    .select({ name: schema.suppliers.name })
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, purchase.supplierId))
    .limit(1);

  // Get transaction items
  // Transactions are created with local_ref_id pattern: {purchaseLocalRefId}_{productId}
  const purchaseRef = purchase.local_ref_id;
  if (!purchaseRef) {
    console.warn(
      "[fetchPurchase] Purchase has no local_ref_id, cannot find items",
    );
    return {
      ...purchase,
      supplierName: supplier[0]?.name || "Unknown",
      items: [],
    } as Purchase;
  }

  const purchaseItems = await db
    .select()
    .from(schema.inventoryTransactions)
    .where(
      and(
        eq(schema.inventoryTransactions.type, InventoryTxType.PURCHASE),
        eq(
          schema.inventoryTransactions.organizationId,
          purchase.organizationId,
        ),
        like(schema.inventoryTransactions.local_ref_id, `${purchaseRef}_%`),
      ),
    );

  // Get product names for each item
  const itemsWithProductNames = await Promise.all(
    purchaseItems.map(async (item) => {
      const product = await db
        .select({
          name: schema.products.name,
          purchasePrice: schema.products.purchasePrice,
        })
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1);

      return {
        id: item.id,
        productId: item.productId,
        productName: product[0]?.name || "Unknown",
        quantity: item.quantity,
        purchasePrice: product[0]?.purchasePrice || 0,
        note: item.note,
      };
    }),
  );

  return {
    ...purchase,
    supplierName: supplier[0]?.name || "Unknown",
    paymentTypeName: paymentType[0]?.name || (purchase.paymentType === PaymentMethod.CASH ? "Tunai" : "Hutang"),
    items: itemsWithProductNames,
  } as Purchase;
}

// Get single purchase with items
export function usePurchase(id: string) {
  return useQuery({
    queryKey: ["purchases", id],
    queryFn: () => fetchPurchase(id),
    enabled: !!id,
  });
}

export function useCreatePurchasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchasingDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      if (!orgId) {
        throw new Error("ID Organisasi tidak ditemukan");
      }

      const purchaseId =
        data.id ||
        `purch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db.transaction(async (tx) => {
        const localRefId = await generateLocalRefId(
          tx,
          schema.purchases,
          "PUR",
        );

        const existingRef = data.id
          ? (
              await tx
                .select({ r: schema.purchases.local_ref_id })
                .from(schema.purchases)
                .where(eq(schema.purchases.id, data.id))
                .limit(1)
            )[0]?.r
          : null;
        let finalLocalRefId = existingRef || localRefId;

        if (data.id) {
          const existing = await tx
            .select({ status: schema.purchases.status })
            .from(schema.purchases)
            .where(eq(schema.purchases.id, data.id))
            .limit(1);

          const statusCompleted =
            data.status === Status.COMPLETED && existing[0]?.status === Status.DRAFT;

          if (statusCompleted) {
            finalLocalRefId = await generateLocalRefId(
              tx,
              schema.purchases,
              "PUR",
            );
          }
        }

        const purchaseValues = {
          id: purchaseId,
          local_ref_id: finalLocalRefId,
          supplierId: data.supplierId,
          totalAmount: data.totalPurchase,
          totalPaid: data.totalPaid,
          paymentType: data.isPayable ? PaymentMethod.DEBT : PaymentMethod.CASH,
          paymentTypeId: data.paymentMethodId,
          commission: data.commission || 0,
          status: data.status,
          dueDate: data.dueDate,
          note: data.note,
          organizationId: orgId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: data.transactionDate || now,
          updatedAt: now,
          _dirty: true,
          _syncedAt: null,
        };

        if (data.id) {
          await tx
            .update(schema.purchases)
            .set(purchaseValues)
            .where(eq(schema.purchases.id, data.id));

          // Efficiently delete old inventory transactions for this purchase
          await tx
            .delete(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.organizationId, orgId),
                like(
                  schema.inventoryTransactions.local_ref_id,
                  `${finalLocalRefId}_%`,
                ),
              ),
            );
        } else {
          await tx.insert(schema.purchases).values(purchaseValues);
        }

        // 2. Create Inventory Transactions for each item
        for (const item of data.items) {
          const txId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await tx.insert(schema.inventoryTransactions).values({
            id: txId,
            local_ref_id: `${finalLocalRefId}_${item.product.id}`,
            productId: item.product.id,
            type: InventoryTxType.PURCHASE,
            quantity: item.quantity,
            status: data.status,
            note: item.note || "",
            organizationId: orgId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: data.transactionDate || now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });

          // 3. Update Product purchasePrice and link supplierId if status is COMPLETED
          if (data.status === Status.COMPLETED) {
            const [dbProduct] = await tx
              .select({
                purchasePrice: schema.products.purchasePrice,
                supplierId: schema.products.supplierId,
              })
              .from(schema.products)
              .where(eq(schema.products.id, item.product.id))
              .limit(1);

            if (dbProduct) {
              const updates: { purchasePrice?: number; supplierId?: string } = {};
              if (item.newPurchasePrice !== dbProduct.purchasePrice) {
                updates.purchasePrice = item.newPurchasePrice;
              }
              if (!dbProduct.supplierId) {
                updates.supplierId = data.supplierId;
              }

              if (Object.keys(updates).length > 0) {
                await tx
                  .update(schema.products)
                  .set({
                    ...updates,
                    updatedBy: userId,
                    updatedAt: now,
                    _dirty: true,
                  })
                  .where(eq(schema.products.id, item.product.id));
              }
            }
          }
        }

        // 4. Create Payable record if isPayable is true
        if (data.isPayable) {
          const payableId = `payable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await tx.insert(schema.payables).values({
            id: payableId,
            supplierId: data.supplierId,
            nominal: data.totalPurchase,
            dueDate: data.dueDate,
            note: data.note || "",
            organizationId: orgId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: data.transactionDate || now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });
          // 5. Create Payable Realization as DP if totalPaid < totalPurchase
          const totalPaidNum = Number(data.totalPaid) || 0;
          if (totalPaidNum > 0 && totalPaidNum < data.totalPurchase) {
            const realizationId = `preal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.payableRealizations).values({
              id: realizationId,
              payableId: payableId,
              nominal: totalPaidNum,
              realizationDate: data.transactionDate || now,
              paymentMethodId: data.paymentMethodId || "CASH",
              note: "DP Pembelian",
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
              createdAt: data.transactionDate || now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }
      });

      const finalRef = (
        await db
          .select({ r: schema.purchases.local_ref_id })
          .from(schema.purchases)
          .where(eq(schema.purchases.id, purchaseId))
          .limit(1)
      )[0]?.r;
      return { ...data, id: purchaseId, local_ref_id: finalRef };
    },
    onSuccess: (responseData) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
      queryClient.invalidateQueries({ queryKey: ["purchases", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["purchases", responseData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["payables"] }); // Invalidate payables list
    },
  });
}
