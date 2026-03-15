import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export function useDirtyCount() {
  const [dirtyCount, setDirtyCount] = useState(0);

  const fetchDirtyCount = async () => {
    try {
      const tables = [
        schema.categories,
        schema.brands,
        schema.products,
        schema.suppliers,
        schema.discounts,
        schema.paymentTypes,
        schema.productVariants,
        schema.productPrices,
        schema.customers,
        schema.purchases,
        schema.inventoryTransactions,
        schema.purchaseReturns,
        schema.purchaseReturnItems,
        schema.transactionReturns,
        schema.transactionReturnItems,
        schema.stockOpnames,
        schema.stockOpnameItems,
        schema.payables,
        schema.payableRealizations,
        schema.receivables,
        schema.receivableRealizations,
        schema.transactions,
        schema.transactionItems,
        schema.cashDrawers,
        schema.finances,
        schema.shifts,
        schema.storeSupplies,
        schema.storeSupplyItems,
      ];

      let total = 0;
      for (const table of tables) {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(table)
          .where(eq(table._dirty, true));
        
        total += result[0]?.count || 0;
      }

      setDirtyCount(total);
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('no such table')) {
        // Silently ignore because this happens during database reset when tables are dropped
        setDirtyCount(0);
        return;
      }
      console.warn('[useDirtyCount] Failed to fetch dirty count:', error);
    }
  };

  useEffect(() => {
    fetchDirtyCount();
    
    // Refresh every 10 seconds or could be triggered by events
    const interval = setInterval(fetchDirtyCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return { dirtyCount, refetch: fetchDirtyCount };
}
