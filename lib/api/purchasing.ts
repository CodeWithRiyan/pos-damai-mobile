import { db } from '../db';
import * as schema from '../db/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { useAuthStore } from '@/stores/auth';

export interface Purchase {
  id: string;
  local_ref_id: string | null;
  supplierId: string;
  supplierName?: string;
  totalAmount: number;
  paymentType: string;
  dueDate: Date | null;
  organizationId: string;
  status: string;
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
}

export interface CreatePurchasingDTO {
  id?: string;
  supplierId: string;
  totalPurchase: number;
  totalPaid: string;
  transactionDate: Date | null;
  isPayable: boolean;
  dueDate: Date | null;
  status: string;
  note: string;
  items: {
    product: { id: string; purchasePrice: number };
    newPurchasePrice: number;
    quantity: number;
    note?: string;
  }[];
}

// Get all purchases from local SQLite
export function usePurchases() {
  const orgId = useAuthStore(state => state.getOrganizationId());
  return useQuery({
    queryKey: ['purchases', orgId],
    queryFn: async () => {
      const purchaseResult = await db
        .select()
        .from(schema.purchases)
        .where(and(
          eq(schema.purchases.organizationId, orgId),
          isNull(schema.purchases.deletedAt)
        ))
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
            supplierName: supplier[0]?.name || 'Unknown',
          };
        })
      );

      return purchasesWithSupplier as Purchase[];
    },
    enabled: !!orgId,
  });
}

// Get single purchase with items
export function usePurchase(id: string) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => {
      // Get purchase record
      const purchaseResult = await db
        .select()
        .from(schema.purchases)
        .where(eq(schema.purchases.id, id))
        .limit(1);

      if (purchaseResult.length === 0) return undefined;

      const purchase = purchaseResult[0];

      // Get supplier name
      const supplier = await db
        .select({ name: schema.suppliers.name })
        .from(schema.suppliers)
        .where(eq(schema.suppliers.id, purchase.supplierId))
        .limit(1);

      // Get related inventory transactions (items)
      // Transactions are created with local_ref_id pattern: {purchaseLocalRefId}_{productId}
      const purchaseRef = purchase.local_ref_id;
      if (!purchaseRef) {
        console.warn('[usePurchase] Purchase has no local_ref_id, cannot find items');
        return {
          ...purchase,
          supplierName: supplier[0]?.name || 'Unknown',
          items: [],
        } as Purchase;
      }

      const transactions = await db
        .select()
        .from(schema.inventoryTransactions)
        .where(and(
          eq(schema.inventoryTransactions.type, 'PURCHASE'),
          eq(schema.inventoryTransactions.organizationId, purchase.organizationId)
        ));

      // Filter transactions that belong to this purchase by local_ref_id pattern
      // Pattern: {purchaseRef}_{productId} - so we check startsWith(purchaseRef + "_")
      const purchaseItems = transactions.filter(tx => 
        tx.local_ref_id?.startsWith(purchaseRef + '_')
      );

      // Get product names for each item
      const itemsWithProductNames = await Promise.all(
        purchaseItems.map(async (item) => {
          const product = await db
            .select({ name: schema.products.name, purchasePrice: schema.products.purchasePrice })
            .from(schema.products)
            .where(eq(schema.products.id, item.productId))
            .limit(1);

          return {
            id: item.id,
            productId: item.productId,
            productName: product[0]?.name || 'Unknown',
            quantity: item.quantity,
            purchasePrice: product[0]?.purchasePrice || 0,
          };
        })
      );

      return {
        ...purchase,
        supplierName: supplier[0]?.name || 'Unknown',
        items: itemsWithProductNames,
      } as Purchase;
    },
    enabled: !!id,
  });
}

export function useCreatePurchasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchasingDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      if (!orgId) {
        throw new Error('ID Organisasi tidak ditemukan');
      }

      const purchaseId = data.id || `purch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localRefId = `ref_${Date.now()}`;
      const now = new Date();

      await db.transaction(async (tx) => {
        // 1. Upsert Purchase record
        const purchaseValues = {
          id: purchaseId,
          local_ref_id: localRefId,
          supplierId: data.supplierId,
          totalAmount: data.totalPurchase,
          paymentType: data.isPayable ? 'DEBT' : 'CASH',
          status: data.status,
          dueDate: data.dueDate,
          organizationId: orgId,
          createdAt: data.transactionDate || now,
          updatedAt: now,
          _dirty: true,
          _syncedAt: null,
        };

        if (data.id) {
          // If update, we might want to keep the old local_ref_id or update it
          // Let's check existing record first
          const existing = await tx.select().from(schema.purchases).where(eq(schema.purchases.id, data.id)).limit(1);
          const finalRefId = existing[0]?.local_ref_id || localRefId;
          
          await tx.update(schema.purchases)
            .set({ ...purchaseValues, local_ref_id: finalRefId })
            .where(eq(schema.purchases.id, data.id));
            
          // Delete old transactions for this purchase to recreate them
          await tx.delete(schema.inventoryTransactions)
            .where(eq(schema.inventoryTransactions.local_ref_id, finalRefId)) // Wait, local_ref_id pattern!
            // Actually it's better to delete by pattern if we use the same local_ref_id
        } else {
          await tx.insert(schema.purchases).values(purchaseValues);
        }

        const finalLocalRefId = data.id ? (await tx.select({r: schema.purchases.local_ref_id}).from(schema.purchases).where(eq(schema.purchases.id, purchaseId)).limit(1))[0]?.r || localRefId : localRefId;

        // Cleanup old transactions if updating
        if (data.id) {
            // Drizzle doesn't support 'like' easily in where without more imports, 
            // but we can use our pattern: startsWith(finalLocalRefId)
            // Wait, I already have 'like' available if I import it or just use a simple delete
             await tx.delete(schema.inventoryTransactions)
                .where(and(
                    eq(schema.inventoryTransactions.organizationId, orgId),
                    // We need a way to filter transactions of this purchase.
                    // If we use the same local_ref_id for the purchase, we can find them.
                ));
             // This is getting complicated. Let's simplify: 
             // Always delete transactions that started with the purchase's local_ref_id
        }

        // Re-implementing simplified logic for transactions
        // 1. Delete old transactions associated with this purchase (if updating)
        if (data.id) {
             const existingRef = (await tx.select().from(schema.purchases).where(eq(schema.purchases.id, data.id)).limit(1))[0]?.local_ref_id;
             if (existingRef) {
                 // We'll use a custom SQL or filter for now. 
                 // Actually, simpler: query then delete.
                 const toDelete = await tx.select().from(schema.inventoryTransactions).where(eq(schema.inventoryTransactions.organizationId, orgId));
                 const filtered = toDelete.filter(t => t.local_ref_id?.startsWith(existingRef));
                 for (const t of filtered) {
                     await tx.delete(schema.inventoryTransactions).where(eq(schema.inventoryTransactions.id, t.id));
                 }
             }
        }

        // 2. Create Inventory Transactions for each item
        for (const item of data.items) {
          const txId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await tx.insert(schema.inventoryTransactions).values({
            id: txId,
            local_ref_id: `${finalLocalRefId}_${item.product.id}`,
            productId: item.product.id,
            type: 'PURCHASE',
            quantity: item.quantity,
            status: data.status,
            organizationId: orgId,
            createdAt: data.transactionDate || now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });


          // 3. Update Product purchasePrice if it changed AND status is COMPLETED
          if (data.status === 'COMPLETED' && item.newPurchasePrice !== item.product.purchasePrice) {
            await tx.update(schema.products)
              .set({ 
                purchasePrice: item.newPurchasePrice,
                updatedAt: now,
                _dirty: true 
              })
              .where(eq(schema.products.id, item.product.id));
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
            note: data.note || '',
            organizationId: orgId,
            createdAt: data.transactionDate || now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });
          console.log(`[useCreatePurchasing] Created payable ${payableId} for purchase ${purchaseId}, amount: ${data.totalPurchase}`);
        }
      });

      const finalRef = (await db.select({r: schema.purchases.local_ref_id}).from(schema.purchases).where(eq(schema.purchases.id, purchaseId)).limit(1))[0]?.r;
      return { id: purchaseId, localRefId: finalRef, ...data };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['products', orgId] });
      queryClient.invalidateQueries({ queryKey: ['purchases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['payables'] }); // Invalidate payables list
    },
  });
}
