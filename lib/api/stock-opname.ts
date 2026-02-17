import { db } from '../db';
import * as schema from '../db/schema';
import { eq, desc, and, getTableColumns } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';

export interface StockOpnameDTO {
  date: Date;
  note: string;
  items: {
    product: { id: string; name: string };
    physicalStock: number;
  }[];
}

export function useCreateStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StockOpnameDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();
      const opnameId = `opname_${Date.now()}`;
      const userId = useAuthStore.getState().profile?.id;
      
      let totalGain = 0;
      let totalLoss = 0;
      let hasDifference = false;

      await db.transaction(async (tx) => {
        // 1. Calculate financials & prepare items
        
        for (const item of data.items) {
          // Get current system stock
          const transactions = await tx
            .select()
            .from(schema.inventoryTransactions)
            .where(and(
              eq(schema.inventoryTransactions.productId, item.product.id),
              eq(schema.inventoryTransactions.status, 'COMPLETED')
            ));

          const currentStock = transactions.reduce((sum, t) => sum + t.quantity, 0);
          const difference = item.physicalStock - currentStock;
          
          // Get product purchase price
          const [product] = await tx
            .select()
            .from(schema.products)
            .where(eq(schema.products.id, item.product.id));
            
          const purchasePrice = product?.purchasePrice || 0;
          const financialImpact = difference * purchasePrice;

          if (difference > 0) totalGain += financialImpact;
          if (difference < 0) totalLoss += Math.abs(financialImpact);
          if (difference !== 0) hasDifference = true;

          const opnameItemId = `opname_item_${Date.now()}_${item.product.id}`;
          
          // Insert Opname Item
          await tx.insert(schema.stockOpnameItems).values({
            id: opnameItemId,
            stockOpnameId: opnameId,
            productId: item.product.id,
            quantitySystem: currentStock,
            quantityPhysical: item.physicalStock,
            difference,
            purchasePrice,
            financialImpact,
            organizationId: orgId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
            _dirty: true,
          });

          // Create inventory adjustment if needed
          if (difference !== 0) {
            const txId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(schema.inventoryTransactions).values({
              id: txId,
              local_ref_id: `opname_${opnameId}_${item.product.id}`,
              productId: item.product.id,
              type: 'STOCK_OPNAME',
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

        // 2. Create StockOpname record
        await tx.insert(schema.stockOpnames).values({
          id: opnameId,
          local_ref_id: opnameId,
          date: data.date,
          note: data.note,
          status: hasDifference ? 'DIFFERENCE' : 'DONE',
          totalGain,
          totalLoss,
          createdBy: userId,
          updatedBy: userId,
          organizationId: orgId,
          createdAt: now,
          updatedAt: now,
          _dirty: true,
        });
      });

      return { id: opnameId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] });
    },
  });
}

export function useStockOpnames() {
  return useQuery({
    queryKey: ['stock-opnames'],
    queryFn: async () => {
      const result = await db
        .select()
        .from(schema.stockOpnames)
        .orderBy(desc(schema.stockOpnames.date));
      return result;
    },
  });
}

export function useStockOpname(id: string) {
  return useQuery({
    queryKey: ['stock-opname', id],
    queryFn: async () => {
      // Get Opname
      const [opname] = await db
        .select()
        .from(schema.stockOpnames)
        .where(eq(schema.stockOpnames.id, id));

      if (!opname) return null;

      // Get Items with Products
      const items = await db
        .select({
          ...getTableColumns(schema.stockOpnameItems),
          productName: schema.products.name,
          productUnit: schema.products.unit,
        })
        .from(schema.stockOpnameItems)
        .leftJoin(schema.products, eq(schema.stockOpnameItems.productId, schema.products.id))
        .where(eq(schema.stockOpnameItems.stockOpnameId, id));

      return { ...opname, items };
    },
    enabled: !!id,
  });
}
