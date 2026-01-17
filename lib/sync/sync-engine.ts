import { db } from '../db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { apiClient } from '../api/client';
import { storageAdapter } from '../storage';

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
      storageAdapter.setItem('userProfile', JSON.stringify(currentUser));

      const orgId = organizationIdForSync;

      // 2. Determine Pull Type (Bootstrap vs Incremental)
      const lastSyncAt = storageAdapter.getItem('lastSyncAt');
      const syncEndpoint = lastSyncAt 
        ? `/sync/incremental?since=${lastSyncAt}`
        : `/sync/bootstrap`;

      console.log(`[Sync] Pulling from ${syncEndpoint}`);
      const pullRes = await apiClient.get(syncEndpoint);
      
      const { data: serverData, timestamp: serverTime } = pullRes.data;

      // 3. Apply Pull Data (Master Data - Server Wins)
      // Mapping server keys to local schema keys if they differ
      const tableMap: Record<string, any> = {
        categories: schema.categories,
        brands: schema.brands,
        products: schema.products,
        prices: schema.productPrices, // Backend 'prices' -> Local 'productPrices'
        variants: schema.productVariants, // Backend 'variants' -> Local 'product_variants'
        customers: schema.customers,
      };

      await db.transaction(async (tx) => {
        for (const [serverKey, records] of Object.entries(serverData)) {
          const table = tableMap[serverKey];
          if (!table) {
            console.warn(`[Sync] No local table mapping for server key: ${serverKey}`);
            continue;
          }

          for (const record of (records as any[])) {
            if (record.deletedAt) {
              await tx.delete(table).where(eq(table.id, record.id));
            } else {
              // Ensure we don't have null organizationId if backend provides it
              const values = {
                ...record,
                organizationId: record.organizationId || orgId,
                _dirty: false,
                _syncedAt: new Date(),
              };

              await tx.insert(table).values(values).onConflictDoUpdate({
                target: table.id,
                set: values
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

    const totalDirty = dirtyCategories.length + dirtyBrands.length + allProductsToPush.length + 
                       dirtyCustomers.length + dirtyPurchases.length + dirtyTransactions.length;

    if (totalDirty === 0) {
      console.log('[Sync] No dirty records to push');
      return;
    }

    console.log(`[Sync] Pushing ${dirtyCategories.length} categories, ${dirtyBrands.length} brands, ${allProductsToPush.length} products, ${dirtyCustomers.length} customers, ${dirtyPurchases.length} purchases, ${dirtyTransactions.length} transactions`);

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
      purchases: dirtyPurchases.map(({ _dirty, _syncedAt, ...rest }) => rest),
      transactions: dirtyTransactions.map(({ _dirty, _syncedAt, ...rest }) => rest),
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
      });
      
      console.log('[Sync] Push completed and local records updated');
    }
  }
}

