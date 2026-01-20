import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { and } from 'drizzle-orm';

export interface StockOpnameDTO {
  note: string;
  items: {
    product: { id: string };
    physicalStock: number;
  }[];
}

// getOrganizationId is now replaced by useAuthStore.getState().getOrganizationId() 

export function useCreateStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StockOpnameDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const now = new Date();
      const opnameId = `opname_${Date.now()}`;

      await db.transaction(async (tx) => {
        for (const item of data.items) {
          // 1. Calculate current local stock
          const transactions = await tx
            .select()
            .from(schema.inventoryTransactions)
            .where(and(
              eq(schema.inventoryTransactions.productId, item.product.id),
              eq(schema.inventoryTransactions.status, 'COMPLETED')
            ));
          
          const currentStock = transactions.reduce((sum, t) => sum + t.quantity, 0);
          const difference = item.physicalStock - currentStock;

          if (difference === 0) continue;

          // 2. Create adjustment transaction
          const txId = `inv_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await tx.insert(schema.inventoryTransactions).values({
            id: txId,
            local_ref_id: `opname_${opnameId}_${item.product.id}`,
            productId: item.product.id,
            type: 'STOCK_OPNAME',
            quantity: difference,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });
        }
      });

      return { id: opnameId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
