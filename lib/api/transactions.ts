import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { getDiscountedPrice, isDiscountActive } from "../price";
import { generateLocalRefId } from "../utils/reference";

export interface Transaction {
  id: string;
  local_ref_id: string | null;
  customerId: string | null;
  customerName?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  paymentTypeId: string;
  paymentTypeName?: string;
  transactionDate: Date;
  status: string;
  note: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName?: string;
  variantId?: string | null;
  variantName?: string;
  quantity: number;
  sellPrice: number;
  note?: string | null;
}

export interface CreateTransactionDTO {
  id?: string;
  customerId?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  paymentTypeId: string;
  transactionDate: Date;
  status: string;
  note: string;
  items: {
    product: { id: string; discount?: { nominal: number; type: "FLAT" | "PERCENTAGE"; startDate: Date; endDate: Date } };
    variant?: { id: string; name: string };
    quantity: number;
    tempSellPrice: number;
    isManualPrice?: boolean;
    note?: string;
  }[];
}

// Get all transactions from local SQLite
export function useTransactions(params: { customerId?: string } | void) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  const conditions = [
    eq(schema.transactions.organizationId, orgId),
    isNull(schema.transactions.deletedAt),
  ];

  if (params?.customerId) {
    conditions.push(eq(schema.transactions.customerId, params.customerId));
  }

  return useQuery({
    queryKey: ["transactions", orgId, params?.customerId], // ← Tambahkan customerId di sini
    queryFn: async () => {
      const transactionResult = await db
        .select()
        .from(schema.transactions)
        .where(and(...conditions))
        .orderBy(desc(schema.transactions.createdAt));

      // Join with customer and payment type names
      const transactionsWithDetails = await Promise.all(
        transactionResult.map(async (transaction) => {
          let customerName = "Walk-in Customer";
          if (transaction.customerId) {
            const customer = await db
              .select({ name: schema.customers.name })
              .from(schema.customers)
              .where(eq(schema.customers.id, transaction.customerId))
              .limit(1);
            customerName = customer[0]?.name || "Unknown";
          }

          const paymentType = await db
            .select({ name: schema.paymentTypes.name })
            .from(schema.paymentTypes)
            .where(eq(schema.paymentTypes.id, transaction.paymentTypeId))
            .limit(1);

          return {
            ...transaction,
            customerName,
            paymentTypeName: paymentType[0]?.name || "Unknown",
          };
        }),
      );

      return transactionsWithDetails as Transaction[];
    },
    enabled: !!orgId,
  });
}

export async function fetchTransaction(id: string): Promise<Transaction | null> {
  // Get transaction record
  const transactionResult = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id))
    .limit(1);

  if (transactionResult.length === 0) return null;

  const transaction = transactionResult[0];

  // Get customer name
  let customerName = "Walk-in Customer";
  if (transaction.customerId) {
    const customer = await db
      .select({ name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, transaction.customerId))
      .limit(1);
    customerName = customer[0]?.name || "Unknown";
  }

  // Get payment type name
  const paymentType = await db
    .select({ name: schema.paymentTypes.name })
    .from(schema.paymentTypes)
    .where(eq(schema.paymentTypes.id, transaction.paymentTypeId))
    .limit(1);

  // Get transaction items
  const items = await db
    .select()
    .from(schema.transactionItems)
    .where(eq(schema.transactionItems.transactionId, id));

  // Get product names for each item
  const itemsWithProductNames = await Promise.all(
    items.map(async (item) => {
      const product = await db
        .select({ name: schema.products.name })
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1);

      let variantName;
      if (item.variantId) {
        const variant = await db
          .select({ name: schema.productVariants.name })
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, item.variantId))
          .limit(1);
        variantName = variant[0]?.name;
      }

      return {
        ...item,
        productName: product[0]?.name || "Unknown",
        variantName,
      };
    }),
  );

  return {
    ...transaction,
    customerName,
    paymentTypeName: paymentType[0]?.name || "Unknown",
    items: itemsWithProductNames,
  } as Transaction;
}

// Get single transaction with items
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

// Create or update transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      if (!orgId) {
        throw new Error("ID Organisasi tidak ditemukan");
      }

      const transactionId =
        data.id ||
        `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      await db.transaction(async (tx) => {
        const localRefId = await generateLocalRefId(tx, schema.transactions, "TRX");
        
        // 1. Create/Update Transaction record
        const transactionValues = {
          id: transactionId,
          local_ref_id: localRefId,
          customerId: data.customerId || null,
          totalAmount: data.totalAmount,
          totalPaid: Number(data.totalPaid) || 0,
          commission: data.commission || 0,
          paymentTypeId: data.paymentTypeId,
          transactionDate: data.transactionDate,
          status: data.status,
          note: data.note || null,
          organizationId: orgId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: data.transactionDate || now,
          updatedAt: now,
          _dirty: true,
          _syncedAt: null,
        };

        if (data.id) {
          // Update existing transaction
          const existing = await tx
            .select()
            .from(schema.transactions)
            .where(eq(schema.transactions.id, data.id))
            .limit(1);
          const finalRefId = existing[0]?.local_ref_id || localRefId;

          await tx
            .update(schema.transactions)
            .set({ ...transactionValues, local_ref_id: finalRefId })
            .where(eq(schema.transactions.id, data.id));

          // Delete old transaction items
          await tx
            .delete(schema.transactionItems)
            .where(eq(schema.transactionItems.transactionId, data.id));

          // Efficiently delete old inventory transactions
          await tx
            .delete(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.organizationId, orgId),
                like(
                  schema.inventoryTransactions.local_ref_id,
                  `${finalRefId}_%`,
                ),
              ),
            );
        } else {
          await tx.insert(schema.transactions).values(transactionValues);
        }

        let finalLocalRefId = data.id
          ? (
              await tx
                .select({ r: schema.transactions.local_ref_id })
                .from(schema.transactions)
                .where(eq(schema.transactions.id, transactionId))
                .limit(1)
            )[0]?.r || localRefId
          : localRefId;

        if (data.id) {
            const existing = await tx
              .select({ status: schema.transactions.status, local_ref_id: schema.transactions.local_ref_id })
              .from(schema.transactions)
              .where(eq(schema.transactions.id, data.id))
              .limit(1);

            const statusCompleted =
              data.status === "COMPLETED" && existing[0]?.status === "DRAFT";

            if (statusCompleted) {
              const newRefId = await generateLocalRefId(tx, schema.transactions, "TRX");
              
              await tx
                .update(schema.transactions)
                .set({ status: "COMPLETED", local_ref_id: newRefId })
                .where(eq(schema.transactions.id, data.id));
              
              finalLocalRefId = newRefId;
            }
        }

        // 2. Create Transaction Items and Inventory Transactions
        for (const item of data.items) {
          const discount = item.product.discount;
          const unitPrice = item.tempSellPrice || 0;
          const isManual = !!item.isManualPrice;
          const hasDiscount = !isManual && isDiscountActive(discount);

          // We split the item into two entries if it has a discount and quantity > 0
          // Entry 1: 1 quantity with discounted price
          // Entry 2: quantity - 1 with regular price (if quantity > 1)
          
          const itemsToCreate = [];
          if (hasDiscount && item.quantity > 0) {
            const discountedPrice = getDiscountedPrice(unitPrice, discount);
            itemsToCreate.push({
              qty: 1,
              price: discountedPrice,
            });
            if (item.quantity > 1) {
              itemsToCreate.push({
                qty: item.quantity - 1,
                price: unitPrice,
              });
            }
          } else {
            itemsToCreate.push({
              qty: item.quantity,
              price: unitPrice,
            });
          }

          for (const subItem of itemsToCreate) {
            const itemId = `trans_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.transactionItems).values({
              id: itemId,
              transactionId: transactionId,
              productId: item.product.id,
              variantId: item.variant?.id || null,
              quantity: subItem.qty,
              sellPrice: subItem.price,
              note: item.note || null,
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }

          // Create inventory transaction (negative quantity for sales)
          if (data.status === "COMPLETED") {
            const invTxId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.inventoryTransactions).values({
              id: invTxId,
              local_ref_id: `${finalLocalRefId}_${item.product.id}`,
              productId: item.product.id,
              type: "SALE",
              quantity: -item.quantity, // Negative for sales, total quantity remains same for stock
              status: "COMPLETED",
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
              _dirty: true,
              _syncedAt: null,
              createdAt: data.transactionDate || now,
              updatedAt: now,
            });
          }
        }

        // 3. Calculate and Add Customer Points (if applicable)
        if (data.customerId && data.status === "COMPLETED") {
          let isNewOrDraft = true;
          if (data.id) {
            const existingTx = await tx
              .select({ status: schema.transactions.status })
              .from(schema.transactions)
              .where(eq(schema.transactions.id, data.id))
              .limit(1);
            if (existingTx.length > 0 && existingTx[0].status === "COMPLETED") {
              isNewOrDraft = false;
            }
          }

          if (isNewOrDraft) {
            const customerResult = await tx
              .select({ id: schema.customers.id, category: schema.customers.category, points: schema.customers.points })
              .from(schema.customers)
              .where(eq(schema.customers.id, data.customerId))
              .limit(1);

            if (customerResult.length > 0) {
              const customer = customerResult[0];
              let earnedPoints = 0;

              for (const item of data.items) {
                const productCategoryResult = await tx
                  .select({ 
                    retailPoint: schema.categories.retailPoint, 
                    wholesalePoint: schema.categories.wholesalePoint 
                  })
                  .from(schema.products)
                  .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
                  .where(eq(schema.products.id, item.product.id))
                  .limit(1);

                if (productCategoryResult.length > 0) {
                  const categoryPoints = customer.category === 'WHOLESALE' 
                    ? productCategoryResult[0].wholesalePoint
                    : productCategoryResult[0].retailPoint;
                  
                  earnedPoints += (categoryPoints || 0) * item.quantity;
                }
              }

              if (earnedPoints > 0) {
                const currentPoints = customer.points || 0;
                await tx.update(schema.customers)
                  .set({ points: currentPoints + earnedPoints, _dirty: true })
                  .where(eq(schema.customers.id, customer.id));
              }
            }
          }
        }
      });

      return { id: transactionId, local_ref_id: transactionId, ...data }; // Return actual ID, as finalLocalRefId is scoped inside the tx block.
    },
    onSuccess: (responseData) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["transactions", responseData.id],
      });
    },
  });
}

// Soft delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();

      await db.transaction(async (tx) => {
        // Get transaction ref_id
        const existing = await tx
          .select()
          .from(schema.transactions)
          .where(eq(schema.transactions.id, id))
          .limit(1);

        if (existing.length > 0) {
          const refId = existing[0].local_ref_id;

          // Soft delete transaction
          await tx
            .update(schema.transactions)
            .set({
              deletedAt: now,
              updatedBy: useAuthStore.getState().profile?.id,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.transactions.id, id));

          // Delete transaction items
          await tx
            .delete(schema.transactionItems)
            .where(eq(schema.transactionItems.transactionId, id));

          // Delete inventory transactions
          if (refId) {
            const transactions = await tx
              .select()
              .from(schema.inventoryTransactions)
              .where(eq(schema.inventoryTransactions.organizationId, orgId));

            const filtered = transactions.filter((t) =>
              t.local_ref_id?.startsWith(refId),
            );
            for (const t of filtered) {
              await tx
                .delete(schema.inventoryTransactions)
                .where(eq(schema.inventoryTransactions.id, t.id));
            }
          }
        }
      });

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
    },
  });
}
