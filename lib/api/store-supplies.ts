import { db } from '../db';
import * as schema from '../db/schema';
import { eq, desc, and, getTableColumns } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { generateLocalRefId } from '../utils/reference';

export interface StoreSupplyDTO {
  date: Date;
  note: string;
  items: {
    product: { id: string; name: string };
    variant?: { id: string; name: string; netto?: number | null };
    quantity: number;
  }[];
}

export function useCreateStoreSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StoreSupplyDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      let supplyRefId = '';
      const supplyId = `supply_${Date.now()}`;

      await db.transaction(async (tx) => {
        supplyRefId = await generateLocalRefId(tx, schema.storeSupplies, 'SSP');

        for (const item of data.items) {
          // Get current system stock
          const transactions = await tx
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, item.product.id),
                eq(schema.inventoryTransactions.status, 'COMPLETED'),
              ),
            );

          const currentStock = transactions.reduce((sum, t) => sum + t.quantity, 0);

          // Get product purchase price
          const [product] = await tx
            .select()
            .from(schema.products)
            .where(eq(schema.products.id, item.product.id));

          const purchasePrice = product?.purchasePrice || 0;

          // Usage is now direct input quantity
          const variantNetto = item.variant?.netto || 1;
          const usageInBaseUnit = item.quantity * variantNetto;
          const physicalStock = Math.max(0, currentStock - usageInBaseUnit);
          const difference = -usageInBaseUnit;

          const supplyItemId = `supply_item_${Date.now()}_${item.product.id}_${item.variant?.id || 'base'}`;

          // Insert Supply Item
          await tx.insert(schema.storeSupplyItems).values({
            id: supplyItemId,
            storeSupplyId: supplyId,
            productId: item.product.id,
            variantId: item.variant?.id || null,
            quantitySystem: currentStock,
            quantityPhysical: physicalStock,
            usage: item.quantity,
            purchasePrice: purchasePrice,
            organizationId: orgId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
            _dirty: true,
          });

          // Create inventory adjustment (always decrease or zero)
          if (difference !== 0) {
            const txId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.inventoryTransactions).values({
              id: txId,
              local_ref_id: `${supplyRefId}_${item.product.id}_${item.variant?.id || 'base'}`,
              productId: item.product.id,
              variantId: item.variant?.id || null,
              type: 'STORE_SUPPLY',
              quantity: difference,
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }

        // 2. Create StoreSupply record
        await tx.insert(schema.storeSupplies).values({
          id: supplyId,
          local_ref_id: supplyRefId,
          date: data.date,
          note: data.note,
          status: 'COMPLETED',
          createdBy: userId,
          updatedBy: userId,
          organizationId: orgId,
          createdAt: now,
          updatedAt: now,
          _dirty: true,
        });
      });

      return { id: supplyId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-supplies'] });
    },
  });
}

export function useStoreSupplies() {
  return useQuery({
    queryKey: ['store-supplies'],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.storeSupplies)
        .orderBy(desc(schema.storeSupplies.date));
      return result;
    },
  });
}

export function useStoreSupply(id: string) {
  return useQuery({
    queryKey: ['store-supply', id],
    queryFn: async () => {
      // Get Supply
      const [supply] = await db
        .select()
        .from(schema.storeSupplies)
        .where(eq(schema.storeSupplies.id, id));

      if (!supply) return null;

      // Get Items with Products & Variants
      const items = await db
        .select({
          ...getTableColumns(schema.storeSupplyItems),
          productName: schema.products.name,
          productUnit: schema.products.unit,
          variantName: schema.productVariants.name,
        })
        .from(schema.storeSupplyItems)
        .leftJoin(schema.products, eq(schema.storeSupplyItems.productId, schema.products.id))
        .leftJoin(
          schema.productVariants,
          eq(schema.storeSupplyItems.variantId, schema.productVariants.id),
        )
        .where(eq(schema.storeSupplyItems.storeSupplyId, id));

      return { ...supply, items };
    },
    enabled: !!id,
  });
}
