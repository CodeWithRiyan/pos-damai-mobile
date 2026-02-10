import { db } from '../db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { apiClient } from '../api/client';
import { storageAdapter } from '../storage';
import { useAuthStore } from '@/stores/auth';
import { queryClient } from '@/providers/query-provider';

export class SyncEngine {
  /**
   * Main sync entry point.
   * Pulls data from server and pushes local dirty records.
   */
  static async sync() {
    try {
      // 1. Context Fetch (Verify online and get orgId)
      // apiClient already has the token interceptor
      console.log('!!!! SYNC STARTING - STEP 1');
      const profileResponse = await apiClient.get('/auth/profile');
      console.log('!!!! PROFILE RAW DATA:', JSON.stringify(profileResponse?.data));
      
      const body = profileResponse?.data;
      const dataPayload = body?.data;
      const currentUser = dataPayload?.user;

      console.log('!!!! USER OBJECT TYPE:', typeof currentUser);
      console.log('!!!! USER OBJECT:', JSON.stringify(currentUser));

      if (!currentUser) {
        throw new Error('User object missing from profile response');
      }

      const organizationIdForSync = currentUser.selectedOrganizationId;
      console.log('!!!! SELECTED ORG ID:', organizationIdForSync);
      
      if (!organizationIdForSync) {
        throw new Error('No organizationId found on user profile');
      }

      // Store user profile for local access (used by local CRUD operations)
      useAuthStore.getState().setProfile(currentUser);
      queryClient.setQueryData(['auth', 'profile'], currentUser);

      const orgId = organizationIdForSync;

      // 2. Determine Pull Type (Bootstrap vs Incremental)
      const lastSyncAt = storageAdapter.getItem('lastSyncAt');
      const syncEndpoint = lastSyncAt 
        ? `/sync/incremental?since=${lastSyncAt}`
        : `/sync/bootstrap`;

      console.log(`[Sync] Pulling from ${syncEndpoint}`);
      const pullRes = await apiClient.get(syncEndpoint);
      
      const payload = pullRes.data;
      const responseData = payload.data;
      
      // Handle potential double wrapping from interceptor
      const serverData = responseData.data || responseData;
      const serverTime = responseData.timestamp || payload.timestamp;

      // 3. Apply Pull Data (Master Data - Server Wins)
      // Mapping server keys to local schema keys if they differ
      const tableMap: Record<string, any> = {
        categories: schema.categories,
        brands: schema.brands,
        products: schema.products,
        prices: schema.productPrices,
        variants: schema.productVariants,
        customers: schema.customers,
        suppliers: schema.suppliers, // Added
        discounts: schema.discounts, // Added
        purchases: schema.purchases, // Added
        transactions: schema.inventoryTransactions, // Added (Backend 'transactions' -> Local 'inventoryTransactions')
        purchaseReturns: schema.purchaseReturns,
        purchaseReturnItems: schema.purchaseReturnItems,
        stockOpnames: schema.stockOpnames,
        stockOpnameItems: schema.stockOpnameItems,
        paymentMethods: schema.paymentTypes,
        payables: schema.payables,
        payableRealizations: schema.payableRealizations,
        receivables: schema.receivables,
        receivableRealizations: schema.receivableRealizations,
        finances: schema.finances,
        shifts: schema.shifts,
        cashDrawers: schema.cashDrawers,
        users: schema.users,
      };

      await db.transaction(async (tx) => {
        for (const [serverKey, records] of Object.entries(serverData)) {
          const table = tableMap[serverKey];
          if (!table) {
            console.warn(`[Sync] No local table mapping for server key: ${serverKey}`);
            continue;
          }

          for (const record of (records as any[])) {
            // Convert ISO strings back to Date objects for Drizzle timestamp columns
            const processedRecord = { ...record };
            for (const key in processedRecord) {
              const val = processedRecord[key];
              if (
                typeof val === 'string' && 
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
              ) {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                  processedRecord[key] = date;
                }
              }
            }

            if (processedRecord.deletedAt) {
              // Handle tables where ID might be different (e.g., transactions use local_ref_id for some cases, but schema still has 'id')
              // The server data for products/categories uses 'id'
              const idToMatch = processedRecord.id || processedRecord.local_ref_id;
              if (idToMatch) {
                // Determine which column to match against
                const idCol = table.id || (table.local_ref_id && processedRecord.local_ref_id ? table.local_ref_id : null);
                if (idCol) {
                  await tx.delete(table).where(eq(idCol, idToMatch));
                }
              }
            } else {
              const values = {
                ...processedRecord,
                organizationId: processedRecord.organizationId || orgId,
                _dirty: false,
                _syncedAt: new Date(),
              };

              // Determine conflict target (prefer local_ref_id if available as it is the stable reference)
              const target = table.local_ref_id || table.id;
              
              // Strip nested relationships from server data to prevent Drizzle/SQLite errors
              const { items, realizations, ...valuesToInsert } = values as any;

              await tx.insert(table).values(valuesToInsert).onConflictDoUpdate({
                target: target,
                set: valuesToInsert
              });
            }
          }
        }
      });

      // 4. Push local dirty records (Transactions - Client Wins)
      await this.pushDirtyRecords(orgId);

      // 5. Finalize
      storageAdapter.setItem('lastSyncAt', serverTime);
      console.log('[Sync] Completed successfully at', serverTime);
      
      return { success: true };

    } catch (error: any) {
      console.error('[Sync] Engine error:', error.message);
      throw error;
    }
  }

  /**
   * Pushes locally created/modified records to the server.
   */
  private static async pushDirtyRecords(orgId: string) {
    // Collect dirty master data
    const dirtyCategories = await db.select().from(schema.categories).where(eq(schema.categories._dirty, true));
    const dirtyBrands = await db.select().from(schema.brands).where(eq(schema.brands._dirty, true));
    const dirtyProducts = await db.select().from(schema.products).where(eq(schema.products._dirty, true));
    const dirtyCustomers = await db.select().from(schema.customers).where(eq(schema.customers._dirty, true));
    const dirtyPaymentTypes = await db.select().from(schema.paymentTypes).where(eq(schema.paymentTypes._dirty, true));
    
    // Also consider products whose prices or variants are dirty
    const dirtyPrices = await db.select().from(schema.productPrices).where(eq(schema.productPrices._dirty, true));
    const dirtyVariants = await db.select().from(schema.productVariants).where(eq(schema.productVariants._dirty, true));

    // Get unique product IDs that need matching/pushing due to price/variant changes
    const extraProductIds = [...new Set([
      ...dirtyPrices.map(p => p.productId),
      ...dirtyVariants.map(v => v.productId)
    ])];

    // Fetch those products if they aren't already in dirtyProducts
    const existingDirtyProductIds = new Set(dirtyProducts.map(p => p.id));
    const missingProductIds = extraProductIds.filter(id => !existingDirtyProductIds.has(id));
    
    let allProductsToPush = [...dirtyProducts];
    if (missingProductIds.length > 0) {
      const extraProducts = await db.select().from(schema.products).where(inArray(schema.products.id, missingProductIds));
      allProductsToPush = [...allProductsToPush, ...extraProducts];
    }

    // Collect dirty transactional data
    const dirtyPurchases = await db.select().from(schema.purchases).where(eq(schema.purchases._dirty, true));
    const dirtyTransactions = await db.select().from(schema.inventoryTransactions).where(eq(schema.inventoryTransactions._dirty, true));
    const dirtyReturns = await db.select().from(schema.purchaseReturns).where(eq(schema.purchaseReturns._dirty, true));
    const dirtyStockOpnames = await db.select().from(schema.stockOpnames).where(eq(schema.stockOpnames._dirty, true));

    const dirtyPayables = await db.select().from(schema.payables).where(eq(schema.payables._dirty, true));
    const dirtyPayableRealizations = await db.select().from(schema.payableRealizations).where(eq(schema.payableRealizations._dirty, true));
    const dirtyReceivables = await db.select().from(schema.receivables).where(eq(schema.receivables._dirty, true));
    const dirtyReceivableRealizations = await db.select().from(schema.receivableRealizations).where(eq(schema.receivableRealizations._dirty, true));

    const dirtyFinances = await db.select().from(schema.finances).where(eq(schema.finances._dirty, true));
    const dirtyShifts = await db.select().from(schema.shifts).where(eq(schema.shifts._dirty, true));
    const dirtyCashDrawers = await db.select().from(schema.cashDrawers).where(eq(schema.cashDrawers._dirty, true));
    const dirtySalesTransactions = await db.select().from(schema.transactions).where(eq(schema.transactions._dirty, true));

    const totalDirty = dirtyCategories.length + dirtyBrands.length + allProductsToPush.length + 
                       dirtyCustomers.length + dirtyPaymentTypes.length + dirtyPurchases.length + dirtyTransactions.length +
                       dirtyReturns.length + dirtyStockOpnames.length + 
                       dirtyPayables.length + dirtyPayableRealizations.length + 
                       dirtyReceivables.length + dirtyReceivableRealizations.length +
                       dirtyFinances.length + dirtyShifts.length + dirtyCashDrawers.length + dirtySalesTransactions.length;

    if (totalDirty === 0) {
      console.log('[Sync] No dirty records to push');
      return;
    }

    console.log(`[Sync] Pushing ${dirtyCategories.length} categories, ${dirtyBrands.length} brands, ${allProductsToPush.length} products, ${dirtyCustomers.length} customers, ${dirtyPaymentTypes.length} payment types, ${dirtyPurchases.length} purchases, ${dirtyTransactions.length} transactions, ${dirtyReturns.length} returns, ${dirtyStockOpnames.length} stock opnames, ${dirtyPayables.length} payables, ${dirtyPayableRealizations.length} payable realizations, ${dirtyReceivables.length} receivables, ${dirtyReceivableRealizations.length} receivable realizations, ${dirtyFinances.length} finances, ${dirtyShifts.length} shifts, ${dirtyCashDrawers.length} cashDrawers, ${dirtySalesTransactions.length} salesTransactions`);

    // Fetch ALL items for returns we are pushing
    const returnIds = dirtyReturns.map(r => r.id);
    const returnItems = returnIds.length > 0 
      ? await db.select().from(schema.purchaseReturnItems).where(inArray(schema.purchaseReturnItems.purchaseReturnId, returnIds))
      : [];

    // Fetch ALL items for stock opnames we are pushing
    const opnameIds = dirtyStockOpnames.map(o => o.id);
    const opnameItems = opnameIds.length > 0
      ? await db.select().from(schema.stockOpnameItems).where(inArray(schema.stockOpnameItems.stockOpnameId, opnameIds))
      : [];

    // Fetch ALL prices and variants for all products we are pushing
    const productIdsToPush = allProductsToPush.map(p => p.id);
    const allPrices = await db.select().from(schema.productPrices).where(inArray(schema.productPrices.productId, productIdsToPush));
    const allVariants = await db.select().from(schema.productVariants).where(inArray(schema.productVariants.productId, productIdsToPush));

    const pushPayload = {
      categories: dirtyCategories.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      brands: dirtyBrands.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      products: allProductsToPush.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
        prices: allPrices.filter(p => p.productId === rest.id).map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...pRest }) => ({
          ...pRest,
          deletedAt: deletedAt ? deletedAt.toISOString() : null,
        })),
        variants: allVariants.filter(v => v.productId === rest.id).map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...vRest }) => ({
          ...vRest,
          deletedAt: deletedAt ? deletedAt.toISOString() : null,
        })),
      })),
      customers: dirtyCustomers.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      paymentMethods: dirtyPaymentTypes.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      purchases: dirtyPurchases.map(({ _dirty, _syncedAt, dueDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        dueDate: dueDate ? dueDate.toISOString() : null,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      transactions: dirtyTransactions.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      purchaseReturns: dirtyReturns.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
        items: returnItems.filter(i => i.purchaseReturnId === rest.id).map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...iRest }) => ({
          ...iRest,
          createdAt: createdAt ? createdAt.toISOString() : undefined,
          updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
          deletedAt: deletedAt ? deletedAt.toISOString() : null,
        })),
      })),
      stockOpnames: dirtyStockOpnames.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
        items: opnameItems.filter(i => i.stockOpnameId === rest.id).map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...iRest }) => ({
          ...iRest,
          createdAt: createdAt ? createdAt.toISOString() : undefined,
          updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
          deletedAt: deletedAt ? deletedAt.toISOString() : null,
        })),
      })),
      payables: dirtyPayables.map(({ _dirty, _syncedAt, dueDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        dueDate: dueDate ? dueDate.toISOString() : null,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      payableRealizations: dirtyPayableRealizations.map(({ _dirty, _syncedAt, realizationDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        realizationDate: realizationDate ? realizationDate.toISOString() : null,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      receivables: dirtyReceivables.map(({ _dirty, _syncedAt, dueDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        dueDate: dueDate ? dueDate.toISOString() : null,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      receivableRealizations: dirtyReceivableRealizations.map(({ _dirty, _syncedAt, realizationDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        realizationDate: realizationDate ? realizationDate.toISOString() : null,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      finances: dirtyFinances.map(({ _dirty, _syncedAt, transactionDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        transactionDate: transactionDate ? transactionDate.toISOString() : undefined,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      shifts: dirtyShifts.map(({ _dirty, _syncedAt, startTime, endTime, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        startTime: startTime ? startTime.toISOString() : undefined,
        endTime: endTime ? endTime.toISOString() : undefined,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      cashDrawers: dirtyCashDrawers.map(({ _dirty, _syncedAt, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
      salesTransactions: dirtySalesTransactions.map(({ _dirty, _syncedAt, transactionDate, createdAt, updatedAt, deletedAt, ...rest }) => ({
        ...rest,
        transactionDate: transactionDate ? transactionDate.toISOString() : undefined,
        createdAt: createdAt ? createdAt.toISOString() : undefined,
        updatedAt: updatedAt ? updatedAt.toISOString() : undefined,
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
      })),
    };

    const pushRes = await apiClient.post('/sync/push', pushPayload);

    // Backend wraps response in StandardResponse { data: { ... }, ... }
    if (pushRes.data && pushRes.data.data) {
      const results = pushRes.data.data;
      
      await db.transaction(async (tx) => {
        // Mark master data as synced
        for (const res of (results.categories || [])) {
          await tx.update(schema.categories)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.categories.id, res.id));
        }
        
        for (const res of (results.brands || [])) {
          await tx.update(schema.brands)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.brands.id, res.id));
        }
        
        for (const res of (results.products || [])) {
          await tx.update(schema.products)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.products.id, res.id));
          
          // Also mark related prices and variants as synced for this product
          await tx.update(schema.productPrices)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.productPrices.productId, res.id));
            
          await tx.update(schema.productVariants)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.productVariants.productId, res.id));
        }
        
        for (const res of (results.customers || [])) {
          await tx.update(schema.customers)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.customers.id, res.id));
        }

        for (const res of (results.paymentMethods || [])) {
          await tx.update(schema.paymentTypes)
            .set({ _dirty: false, _syncedAt: new Date() })
            .where(eq(schema.paymentTypes.id, res.id));
        }
        
        // Mark transactional data as synced and update server IDs
        for (const res of (results.purchases || [])) {
          await tx.update(schema.purchases)
            .set({ 
              _dirty: false, 
              _syncedAt: new Date(), 
              id: res.server_id 
            })
            .where(eq(schema.purchases.local_ref_id, res.local_ref_id));
        }
        for (const res of (results.transactions || [])) {
          await tx.update(schema.inventoryTransactions)
            .set({ 
              _dirty: false, 
              _syncedAt: new Date(), 
              id: res.server_id 
            })
            .where(eq(schema.inventoryTransactions.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.purchaseReturns || [])) {
          await tx.update(schema.purchaseReturns)
            .set({ 
              _dirty: false, 
              _syncedAt: new Date(), 
              id: res.server_id 
            })
            .where(eq(schema.purchaseReturns.local_ref_id, res.local_ref_id));
            
          // Also mark items for this return as synced and update FK
          await tx.update(schema.purchaseReturnItems)
            .set({ 
              purchaseReturnId: res.server_id,
              _dirty: false, 
              _syncedAt: new Date() 
            })
            .where(eq(schema.purchaseReturnItems.purchaseReturnId, res.local_ref_id)); 
        }

        for (const res of (results.stockOpnames || [])) {
          await tx.update(schema.stockOpnames)
            .set({ 
              _dirty: false, 
              _syncedAt: new Date(), 
              id: res.server_id 
            })
            .where(eq(schema.stockOpnames.local_ref_id, res.local_ref_id));

          // Also mark items for this opname as synced
          // Note: If ID changed, we might need to update items foreign key if not handled by cascade or if items are not re-synced by ID.
          // But usually we just mark them dirty=false.
          // If the server returns server_id, and we update local ID, we must update foreign keys?
          // SQLite doesn't automatically cascade updates unless configured.
          // For now, let's assume we just mark as synced.
          // Actually, if we update the parent ID, we MUST update the children's FK if we want to keep integrity.
          // But `stockOpnameItems` has `stockOpnameId`. 
          
          if (res.server_id !== res.local_ref_id) {
             await tx.update(schema.stockOpnameItems)
              .set({ stockOpnameId: res.server_id, _dirty: false, _syncedAt: new Date() })
              .where(eq(schema.stockOpnameItems.stockOpnameId, res.local_ref_id));
          } else {
             await tx.update(schema.stockOpnameItems)
              .set({ _dirty: false, _syncedAt: new Date() })
              .where(eq(schema.stockOpnameItems.stockOpnameId, res.local_ref_id));
          }
        }

        for (const res of (results.payables || [])) {
          await tx.update(schema.payables)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.payables.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.payableRealizations || [])) {
          await tx.update(schema.payableRealizations)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.payableRealizations.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.receivables || [])) {
          await tx.update(schema.receivables)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.receivables.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.receivableRealizations || [])) {
          await tx.update(schema.receivableRealizations)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.receivableRealizations.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.finances || [])) {
          await tx.update(schema.finances)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.finances.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.shifts || [])) {
          await tx.update(schema.shifts)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.shifts.local_ref_id, res.local_ref_id));
        }

        for (const res of (results.cashDrawers || [])) {
          await tx.update(schema.cashDrawers)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq((schema.cashDrawers as any).local_ref_id, res.local_ref_id));
        }

        for (const res of (results.salesTransactions || [])) {
          await tx.update(schema.transactions)
            .set({ _dirty: false, _syncedAt: new Date(), id: res.server_id })
            .where(eq(schema.transactions.local_ref_id, res.local_ref_id));
        }
      });
      
      console.log('[Sync] Push completed and local records updated');
    }
  }
}

