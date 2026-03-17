import {
  InventoryTxType,
  PriceType,
  ReturnType,
  Status,
} from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { generateLocalRefId } from "../utils/reference";
import {
  categories,
  customers,
  inventoryTransactions,
  products,
  transactionReturnItems,
  transactionReturns,
  users,
} from "../db/schema";

export interface ReturnTransactionItem {
  productId: string;
  productName?: string;
  quantity: number;
  sellPrice: number;
}

export interface ReturnTransaction {
  id: string;
  local_ref_id: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  returnType: "CASH" | "ITEM";
  note: string; // Required field for return reason
  items?: ReturnTransactionItem[];
  createdBy: string | null;
  createdByName?: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionReturnParams {
  customerId?: string;
}

async function calcEarnedPoints(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: { productId: string; quantity: number; sellPrice: number }[],
  customerCategory: string | null,
): Promise<{ points: number; revenue: number; profit: number }> {
  let points = 0,
    revenue = 0,
    profit = 0;
  for (const item of items) {
    const [row] = await tx
      .select({
        retailPoint: categories.retailPoint,
        wholesalePoint: categories.wholesalePoint,
        purchasePrice: products.purchasePrice,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, item.productId))
      .limit(1);
    if (row) {
      const catPoints =
        customerCategory === PriceType.WHOLESALE
          ? row.wholesalePoint
          : row.retailPoint;
      points += (catPoints ?? 0) * item.quantity;
      revenue += item.sellPrice * item.quantity;
      profit += (item.sellPrice - (row.purchasePrice ?? 0)) * item.quantity;
    }
  }
  return { points, revenue, profit };
}

export const useTransactionReturns = (
  params: TransactionReturnParams | void,
) => {
  const isUsedFilter = !!params?.customerId;
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useQuery({
    queryKey: ["transaction-returns", organizationId, params?.customerId],
    queryFn: async () => {
      if (!organizationId) return [];

      const [retdat, custdat] = await Promise.all([
        db
          .select()
          .from(transactionReturns)
          .where(eq(transactionReturns.organizationId, organizationId))
          .orderBy(desc(transactionReturns.createdAt)),
        db
          .select()
          .from(customers)
          .where(eq(customers.organizationId, organizationId)),
      ]);

      const customerMap = new Map(custdat.map((c) => [c.id, c.name]));

      const retData = retdat.map((r) => ({
        ...r,
        customerName: r.customerId
          ? customerMap.get(r.customerId) || "Walk-in Customer"
          : "Walk-in Customer",
      }));

      const filteredRetData = retData.filter(
        (r) => r.customerId === params?.customerId,
      );

      return isUsedFilter ? filteredRetData : retData;
    },
    enabled: !!organizationId,
  });
};

export const useTransactionReturn = (id: string) => {
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useQuery({
    queryKey: ["transaction-return", id],
    queryFn: async () => {
      if (!organizationId || !id) return null;

      // Get return record
      const returnResult = await db
        .select()
        .from(transactionReturns)
        .where(eq(transactionReturns.id, id))
        .limit(1);
      if (!returnResult.length) return null;

      const returnRecord = returnResult[0];

      // Get customer name
      let customerName = "Walk-in Customer";
      if (returnRecord.customerId) {
        const customerResult = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, returnRecord.customerId))
          .limit(1);
        if (customerResult.length > 0) {
          customerName = customerResult[0].name;
        }
      }

      // Get creator name
      let createdByName = "Admin";
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
        .from(transactionReturnItems)
        .where(eq(transactionReturnItems.transactionReturnId, id));

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
        customerName,
        createdByName,
        items: itemsWithNames,
      };
    },
    enabled: !!organizationId && !!id,
  });
};

export const useCreateTransactionReturn = () => {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore(
    (state) => state.profile?.selectedOrganizationId,
  );

  return useMutation({
    mutationFn: async (
      data: Omit<
        ReturnTransaction,
        | "id"
        | "local_ref_id"
        | "createdAt"
        | "updatedAt"
        | "createdBy"
        | "updatedBy"
      >,
    ) => {
      if (!organizationId) throw new Error("Organization ID is required");

      const returnId = `tret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;
      let finalLocalRefId = "";

      await db.transaction(async (tx) => {
        finalLocalRefId = await generateLocalRefId(
          tx,
          transactionReturns,
          "RTS",
        );

        // 1. Create Return Header
        await tx.insert(transactionReturns).values({
          id: returnId,
          local_ref_id: finalLocalRefId,
          customerId: data.customerId || null,
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
            const itemId = `treti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 2a. Save item
            await tx.insert(transactionReturnItems).values({
              id: itemId,
              transactionReturnId: returnId,
              productId: item.productId,
              quantity: item.quantity,
              sellPrice: item.sellPrice,
              organizationId,
              createdBy: userId,
              updatedBy: userId,
              _dirty: true,
              createdAt: now,
              updatedAt: now,
            });

            // 2b. Add stock via transaction
            const txIdIn = `invrt_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const txRefIdIn = `${finalLocalRefId}-${item.productId}-in`;

            if (!item.productId) continue;

            // Leg 1: Item comes back (Stock IN)
            await tx.insert(inventoryTransactions).values({
              id: txIdIn,
              local_ref_id: txRefIdIn,
              productId: item.productId,
              type: InventoryTxType.RETURN_SALE,
              quantity: item.quantity, // Positive for returned sales
              status: Status.COMPLETED,
              organizationId,
              createdBy: userId,
              updatedBy: userId,
              _dirty: true,
              createdAt: now,
              updatedAt: now,
            });

            // Leg 2: Replacement item goes out (Stock OUT) - only for ITEM return
            if (data.returnType === ReturnType.ITEM) {
              const txIdOut = `invrt_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const txRefIdOut = `${finalLocalRefId}-${item.productId}-out`;

              await tx.insert(inventoryTransactions).values({
                id: txIdOut,
                local_ref_id: txRefIdOut,
                productId: item.productId,
                type: InventoryTxType.SALE,
                quantity: -item.quantity, // Negative for replacement item
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

        // 3. Customer points adjustment
        if (data.customerId) {
          const [cust] = await tx
            .select()
            .from(customers)
            .where(eq(customers.id, data.customerId))
            .limit(1);
          if (cust) {
            const returned = await calcEarnedPoints(
              tx,
              data.items ?? [],
              cust.category,
            );
            if (data.returnType === ReturnType.CASH) {
              await tx
                .update(customers)
                .set({
                  points: Math.max(0, (cust.points ?? 0) - returned.points),
                  totalTransactions: Math.max(
                    0,
                    (cust.totalTransactions ?? 0) - 1,
                  ),
                  totalRevenue: Math.max(
                    0,
                    (cust.totalRevenue ?? 0) - returned.revenue,
                  ),
                  totalProfit: Math.max(
                    0,
                    (cust.totalProfit ?? 0) - returned.profit,
                  ),
                  _dirty: true,
                })
                .where(eq(customers.id, cust.id));
            }
            // ITEM return: deducted points equal re-awarded points → net 0, no DB write needed
          }
        }
      });

      return { id: returnId, local_ref_id: finalLocalRefId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
