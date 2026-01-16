import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// Base columns for all sync-able tables
const syncColumns = {
  _dirty: integer('_dirty', { mode: 'boolean' }).default(false),
  _syncedAt: integer('_syncedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
  deletedAt: integer('deletedAt', { mode: 'timestamp' }),
};

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  point: real('point').default(0),
  description: text('description'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const brands = sqliteTable('brands', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  purchasePrice: real('purchasePrice').default(0),
  description: text('description'),
  isFavorite: integer('isFavorite', { mode: 'boolean' }).default(false),
  categoryId: text('categoryId').notNull(),
  brandId: text('brandId'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const productPrices = sqliteTable('product_prices', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  price: real('price').notNull(),
  productId: text('productId').notNull(),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').default('RETAIL'),
  code: text('code').unique(),
  phone: text('phone'),
  address: text('address'),
  organizationId: text('organizationId'),
  ...syncColumns,
});

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(), // local UUID if offline
  local_ref_id: text('local_ref_id').unique(),
  supplierId: text('supplierId').notNull(),
  totalAmount: real('totalAmount').notNull(),
  paymentType: text('paymentType').default('CASH'),
  dueDate: integer('dueDate', { mode: 'timestamp' }),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey(), // local UUID if offline
  local_ref_id: text('local_ref_id').unique(),
  productId: text('productId').notNull(),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  inventoryBatchId: text('inventoryBatchId'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(), // e.g., 'lastSyncAt'
  value: text('value').notNull(),
});
