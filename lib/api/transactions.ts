import {
  DateFilterType,
  InventoryTxType,
  PriceType,
  ProductType,
  Status,
} from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { getDiscountedPrice, isDiscountActive } from "../price";
import { formatDisplayRefId, generateLocalRefId } from "../utils/reference";
import { Product } from "./products";

export interface Transaction {
  id: string;
  local_ref_id: string | null;
  customerId: string | null;
  employeeId?: string | null;
  customerName?: string;
  employeeName?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  totalDiscount?: number;
  totalProfit?: number;
  paymentTypeId: string;
  paymentTypeName?: string;
  transactionDate: Date;
  status: string;
  note: string | null;
  returnId?: string | null;
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
  productType?: Product["type"];
  variantId?: string | null;
  variantName?: string;
  quantity: number;
  sellPrice: number;
  discountAmount: number;
  purchasePrice: number;
  profit: number;
  note?: string | null;
}

export interface CreateTransactionDTO {
  id?: string;
  customerId?: string;
  employeeId?: string;
  totalAmount: number;
  totalPaid: number;
  commission?: number;
  paymentTypeId: string;
  transactionDate: Date;
  status: string;
  note: string;
  returnId?: string;
  items: {
    product: {
      id: string;
      discount?: {
        nominal: number;
        type: "FLAT" | "PERCENTAGE";
        startDate: Date;
        endDate: Date;
      };
    };
    variant?: { id: string; name: string; netto?: number | null };
    quantity: number;
    tempSellPrice: number;
    isManualPrice?: boolean;
    note?: string;
  }[];
}

export interface TransactionFilterParams {
  customerId?: string;
  userId?: string;
  paymentTypeIds?: string[];
  dateType?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM";
  startDate?: Date;
  endDate?: Date;
  showReturnData?: boolean;
  search?: string;
}

// Get all transactions from local SQLite
export function useTransactions(params?: TransactionFilterParams) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  const conditions = [
    eq(schema.transactions.organizationId, orgId),
    isNull(schema.transactions.deletedAt),
  ];

  if (params?.customerId) {
    conditions.push(eq(schema.transactions.customerId, params.customerId));
  }

  if (params?.userId) {
    conditions.push(eq(schema.transactions.createdBy, params.userId));
  }

  if (!params?.showReturnData) {
    conditions.push(isNull(schema.transactions.returnId));
  }

  return useQuery({
    queryKey: ["transactions", orgId, params],
    queryFn: async () => {
      let transactionResult = await db
        .select()
        .from(schema.transactions)
        .where(and(...conditions))
        .orderBy(desc(schema.transactions.createdAt));

      // Apply date filter in JS (since SQLite timestamps are integers)
      if (params?.dateType) {
        const now = new Date();
        let filterStart: Date | undefined;
        let filterEnd: Date | undefined;

        if (params.dateType === DateFilterType.TODAY) {
          filterStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          filterEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
          );
        } else if (params.dateType === DateFilterType.THIS_WEEK) {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          filterStart = new Date(now.getFullYear(), now.getMonth(), diff);
          filterEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            diff + 6,
            23,
            59,
            59,
            999,
          );
        } else if (params.dateType === DateFilterType.THIS_MONTH) {
          filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filterEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
        } else if (params.dateType === DateFilterType.THIS_YEAR) {
          filterStart = new Date(now.getFullYear(), 0, 1);
          filterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (
          params.dateType === DateFilterType.CUSTOM &&
          params.startDate &&
          params.endDate
        ) {
          filterStart = new Date(
            params.startDate.getFullYear(),
            params.startDate.getMonth(),
            params.startDate.getDate(),
          );
          filterEnd = new Date(
            params.endDate.getFullYear(),
            params.endDate.getMonth(),
            params.endDate.getDate(),
            23,
            59,
            59,
            999,
          );
        }

        if (filterStart && filterEnd) {
          transactionResult = transactionResult.filter((t) => {
            const date = t.createdAt || t.transactionDate;
            return date && date >= filterStart! && date <= filterEnd!;
          });
        }
      }

      // Apply paymentTypeId filter
      if (params?.paymentTypeIds && params.paymentTypeIds.length > 0) {
        transactionResult = transactionResult.filter((t) =>
          params.paymentTypeIds!.includes(t.paymentTypeId),
        );
      }

      // Join with customer, employee, and payment type names
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

          let employeeName: string | undefined;
          if (transaction.employeeId) {
            const employee = await db
              .select({ name: schema.users.name })
              .from(schema.users)
              .where(eq(schema.users.id, transaction.employeeId))
              .limit(1);
            employeeName = employee[0]?.name;
            customerName = employeeName
              ? `Karyawan: ${employeeName}`
              : "Karyawan";
          }

          const paymentType = await db
            .select({ name: schema.paymentTypes.name })
            .from(schema.paymentTypes)
            .where(eq(schema.paymentTypes.id, transaction.paymentTypeId))
            .limit(1);

          return {
            ...transaction,
            customerName,
            employeeName,
            paymentTypeName: paymentType[0]?.name || "Unknown",
          };
        }),
      );

      // Apply search filter
      if (params?.search && params.search.trim()) {
        const term = params.search.toLowerCase();
        return (transactionsWithDetails as Transaction[]).filter(
          (t) =>
            (formatDisplayRefId(t.local_ref_id) || t.id)
              .toLowerCase()
              .includes(term) || t.customerName?.toLowerCase().includes(term),
        );
      }

      return transactionsWithDetails as Transaction[];
    },
    enabled: !!orgId,
  });
}

// Get customer IDs that have at least one completed transaction
export function useCustomerIdsWithTransactions() {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["customer-ids-with-transactions", orgId],
    queryFn: async () => {
      if (!orgId) return new Set<string>();

      const rows = await db
        .selectDistinct({ customerId: schema.transactions.customerId })
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.organizationId, orgId),
            eq(schema.transactions.status, Status.COMPLETED),
            isNull(schema.transactions.deletedAt),
          ),
        );

      return new Set(
        rows.map((r) => r.customerId).filter((id): id is string => id !== null),
      );
    },
    enabled: !!orgId,
  });
}

// Get all products purchased by a specific customer
export function usePurchasedProducts(customerId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["purchased-products", orgId, customerId],
    queryFn: async () => {
      if (!customerId || !orgId) return [];

      // 1. Get all purchased items + their sell price ordered by most recent first
      const purchasedItems = await db
        .select({
          productId: schema.transactionItems.productId,
          variantId: schema.transactionItems.variantId,
          sellPrice: schema.transactionItems.sellPrice,
          transactionDate: schema.transactions.transactionDate,
        })
        .from(schema.transactionItems)
        .innerJoin(
          schema.transactions,
          eq(schema.transactionItems.transactionId, schema.transactions.id),
        )
        .where(
          and(
            eq(schema.transactions.customerId, customerId),
            eq(schema.transactions.organizationId, orgId),
            eq(schema.transactions.status, Status.COMPLETED),
            isNull(schema.transactions.deletedAt),
          ),
        )
        .orderBy(desc(schema.transactions.transactionDate));

      if (purchasedItems.length === 0) return [];

      // Most-recent sell price per product for this customer
      const lastSellPriceMap: Record<string, number> = {};
      for (const item of purchasedItems) {
        if (!(item.productId in lastSellPriceMap)) {
          lastSellPriceMap[item.productId] = item.sellPrice;
        }
      }

      // Use a set to get unique product IDs
      const productIds = Array.from(
        new Set(purchasedItems.map((item) => item.productId)),
      );

      // 2. Fetch full product details for these IDs
      // We'll reuse the logic from useProducts but filtered by IDs
      const productResult = await db
        .select({
          product: schema.products,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(
          schema.discounts,
          eq(schema.products.discountId, schema.discounts.id),
        )
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            isNull(schema.products.deletedAt),
            // Drizzle doesn't have a direct "in Array" helper that works easily with large arrays in all versions,
            // but we can use multiple or conditions or just filter in JS if the list is small.
            // For POS, customer's unique products usually aren't thousands.
          ),
        );

      // Filter in memory for simplicity and to match the schema
      const filteredResult = productResult.filter((r) =>
        productIds.includes(r.product.id),
      );

      const productsWithDetails = await Promise.all(
        filteredResult.map(async ({ product, discount }) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));

          const variants = await db
            .select()
            .from(schema.productVariants)
            .where(
              and(
                eq(schema.productVariants.productId, product.id),
                isNull(schema.productVariants.deletedAt),
              ),
            );

          // Calculate stock
          const transactions = await db
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, Status.COMPLETED),
              ),
            );

          const totalStock = transactions.reduce(
            (sum, tx) => sum + tx.quantity,
            0,
          );

          return {
            ...product,
            purchasePrice: product.purchasePrice ?? 0,
            minimumStock: product.minimumStock ?? 0,
            isActive: !!product.isActive,
            isFavorite: !!product.isFavorite,
            type: (product.type || ProductType.DEFAULT) as
              | "DEFAULT"
              | "MULTIUNIT"
              | "VARIANTS",
            code: product.barcode,
            sellPrices: prices.map((p) => ({
              ...p,
              minimumPurchase: p.minimumPurchase ?? 0,
              type: p.type as "RETAIL" | "WHOLESALE",
            })),
            variants: variants,
            stock: totalStock,
            lastSellPrice: lastSellPriceMap[product.id],
            discount: discount
              ? {
                  id: discount.id,
                  name: discount.name,
                  nominal: discount.nominal,
                  type: discount.type as "FLAT" | "PERCENTAGE",
                  startDate: discount.startDate,
                  endDate: discount.endDate,
                }
              : undefined,
          };
        }),
      );

      return productsWithDetails;
    },
    enabled: !!orgId && !!customerId,
  });
}

export async function fetchTransaction(
  id: string,
  options?: {
    useReturnId?: boolean;
  },
): Promise<Transaction | null> {
  // Get transaction record
  const transactionResult = await db
    .select()
    .from(schema.transactions)
    .where(
      options?.useReturnId
        ? eq(schema.transactions.returnId, id)
        : eq(schema.transactions.id, id),
    )
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

  // Get employee name
  let employeeName: string | undefined;
  if (transaction.employeeId) {
    const employee = await db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, transaction.employeeId))
      .limit(1);
    employeeName = employee[0]?.name;
    customerName = employeeName ? `Karyawan: ${employeeName}` : "Karyawan";
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
    .where(eq(schema.transactionItems.transactionId, transaction?.id || id));

  // Get product names for each item
  const itemsWithProductNames = await Promise.all(
    items.map(async (item) => {
      const product = await db
        .select({ name: schema.products.name, type: schema.products.type })
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
        productType: (product[0]?.type ||
          ProductType.DEFAULT) as Product["type"],
        variantName,
        discountAmount: item.discountAmount ?? 0,
        purchasePrice: item.purchasePrice ?? 0,
        profit: item.profit ?? 0,
      };
    }),
  );

  return {
    ...transaction,
    customerName,
    employeeName,
    paymentTypeName: paymentType[0]?.name || "Unknown",
    items: itemsWithProductNames,
  } as Transaction;
}

// Get single transaction with items
export function useTransaction(
  id: string,
  options?: { useReturnId?: boolean },
) {
  return useQuery({
    queryKey: ["transactions", options?.useReturnId ? "returnId" : "id", id],
    queryFn: () => fetchTransaction(id, options),
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
        const localRefId = await generateLocalRefId(
          tx,
          schema.transactions,
          "TRX",
        );

        // 1. Create/Update Transaction record
        const transactionValues = {
          id: transactionId,
          local_ref_id: localRefId,
          customerId: data.customerId || null,
          employeeId: data.employeeId || null,
          totalAmount: data.totalAmount,
          totalPaid: Number(data.totalPaid) || 0,
          commission: data.commission || 0,
          totalDiscount: 0,
          totalProfit: 0,
          paymentTypeId: data.paymentTypeId,
          transactionDate: data.transactionDate,
          status: data.status,
          note: data.note || null,
          returnId: data.returnId || null,
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
            .select({
              status: schema.transactions.status,
              local_ref_id: schema.transactions.local_ref_id,
            })
            .from(schema.transactions)
            .where(eq(schema.transactions.id, data.id))
            .limit(1);

          const statusCompleted =
            data.status === Status.COMPLETED &&
            existing[0]?.status === Status.DRAFT;

          if (statusCompleted) {
            const newRefId = await generateLocalRefId(
              tx,
              schema.transactions,
              "TRX",
            );

            await tx
              .update(schema.transactions)
              .set({ status: Status.COMPLETED, local_ref_id: newRefId })
              .where(eq(schema.transactions.id, data.id));

            finalLocalRefId = newRefId;
          }
        }

        // 2. Create Transaction Items and Inventory Transactions
        let totalDiscountAcc = 0;
        let totalProfitAcc = 0;

        for (const item of data.items) {
          const discount = item.product.discount;
          const unitPrice = item.tempSellPrice || 0;
          const isManual = !!item.isManualPrice;
          const hasDiscount = !isManual && isDiscountActive(discount);

          // Fetch purchase price for profit calculation
          const productRow = await tx
            .select({ purchasePrice: schema.products.purchasePrice })
            .from(schema.products)
            .where(eq(schema.products.id, item.product.id))
            .limit(1);
          const unitPurchasePrice = productRow[0]?.purchasePrice || 0;
          const variantNetto = item.variant?.netto || 1;

          // We split the item into two entries if it has a discount and quantity > 0
          // Entry 1: 1 quantity with discounted price
          // Entry 2: quantity - 1 with regular price (if quantity > 1)

          const itemsToCreate = [];
          if (hasDiscount && item.quantity > 0) {
            const discountedPrice = getDiscountedPrice(unitPrice, discount);

            // If quantity >= 1, 1 unit is discounted, rest is regular
            // If quantity < 1, the entire fraction is discounted
            const discountedQty = Math.min(1, item.quantity);
            const discountPerUnit = unitPrice - discountedPrice;

            itemsToCreate.push({
              qty: discountedQty,
              price: discountedPrice,
              discountAmount: discountPerUnit * discountedQty,
            });

            if (item.quantity > discountedQty) {
              itemsToCreate.push({
                qty: item.quantity - discountedQty,
                price: unitPrice,
                discountAmount: 0,
              });
            }
          } else {
            itemsToCreate.push({
              qty: item.quantity,
              price: unitPrice,
              discountAmount: 0,
            });
          }

          for (const subItem of itemsToCreate) {
            const itemId = `trans_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const itemCost = unitPurchasePrice * variantNetto * subItem.qty;
            const itemRevenue = subItem.price * subItem.qty;
            const itemProfit = itemRevenue - itemCost;

            totalDiscountAcc += subItem.discountAmount;
            totalProfitAcc += itemProfit;

            await tx.insert(schema.transactionItems).values({
              id: itemId,
              transactionId: transactionId,
              productId: item.product.id,
              variantId: item.variant?.id || null,
              quantity: subItem.qty,
              sellPrice: subItem.price,
              discountAmount: subItem.discountAmount,
              purchasePrice: unitPurchasePrice * variantNetto,
              profit: itemProfit,
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
          if (data.status === Status.COMPLETED) {
            const invTxId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.inventoryTransactions).values({
              id: invTxId,
              local_ref_id: `${finalLocalRefId}_${item.product.id}_${item.variant?.id || "base"}`,
              productId: item.product.id,
              variantId: item.variant?.id || null,
              type: InventoryTxType.SALE,
              quantity: -item.quantity * variantNetto,
              status: Status.COMPLETED,
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

        // Update transaction with computed totals
        await tx
          .update(schema.transactions)
          .set({ totalDiscount: totalDiscountAcc, totalProfit: totalProfitAcc })
          .where(eq(schema.transactions.id, transactionId));

        // 3. Calculate and Add Customer Points (if applicable)
        if (data.customerId && data.status === Status.COMPLETED) {
          let isNewOrDraft = true;
          if (data.id) {
            const existingTx = await tx
              .select({ status: schema.transactions.status })
              .from(schema.transactions)
              .where(eq(schema.transactions.id, data.id))
              .limit(1);
            if (
              existingTx.length > 0 &&
              existingTx[0].status === Status.COMPLETED
            ) {
              isNewOrDraft = false;
            }
          }

          if (isNewOrDraft) {
            const customerResult = await tx
              .select()
              .from(schema.customers)
              .where(eq(schema.customers.id, data.customerId))
              .limit(1);

            if (customerResult.length > 0) {
              const customer = customerResult[0];
              let earnedPoints = 0;
              let totalPurchaseCost = 0;

              for (const item of data.items) {
                const productWithCategory = await tx
                  .select({
                    retailPoint: schema.categories.retailPoint,
                    wholesalePoint: schema.categories.wholesalePoint,
                    purchasePrice: schema.products.purchasePrice,
                  })
                  .from(schema.products)
                  .leftJoin(
                    schema.categories,
                    eq(schema.products.categoryId, schema.categories.id),
                  )
                  .where(eq(schema.products.id, item.product.id))
                  .limit(1);

                if (productWithCategory.length > 0) {
                  const p = productWithCategory[0];

                  // Points
                  const categoryPoints =
                    customer.category === PriceType.WHOLESALE
                      ? p.wholesalePoint
                      : p.retailPoint;

                  const variantNetto = item.variant?.netto || 1;
                  earnedPoints +=
                    (categoryPoints || 0) * (item.quantity * variantNetto);

                  // Purchase Cost
                  const purchasePrice = p.purchasePrice || 0;
                  totalPurchaseCost +=
                    purchasePrice * variantNetto * item.quantity;
                }
              }

              const transactionProfit = data.totalAmount - totalPurchaseCost;

              await tx
                .update(schema.customers)
                .set({
                  points: (customer.points || 0) + earnedPoints,
                  totalTransactions: (customer.totalTransactions || 0) + 1,
                  totalRevenue: (customer.totalRevenue || 0) + data.totalAmount,
                  totalProfit: (customer.totalProfit || 0) + transactionProfit,
                  _dirty: true,
                })

                .where(eq(schema.customers.id, customer.id));
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
      queryClient.invalidateQueries({ queryKey: ["customers", orgId] });
      if (responseData.customerId) {
        queryClient.invalidateQueries({
          queryKey: ["customers", responseData.customerId],
        });
      }
      if (responseData.returnId) {
        queryClient.invalidateQueries({
          queryKey: ["transactions", "returnId", responseData.returnId],
        });
      }
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
