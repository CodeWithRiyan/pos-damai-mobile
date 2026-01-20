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
  retailPoint: real('retailPoint').default(0),
  wholesalePoint: real('wholesalePoint').default(0),
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
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  type: text('type').default('DEFAULT'),
  unit: text('unit'),
  minimumStock: real('minimumStock').default(0),
  categoryId: text('categoryId').notNull(),
  brandId: text('brandId'),
  discountId: text('discountId'), // Added
  supplierId: text('supplierId'), // Added
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const discounts = sqliteTable('discounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nominal: real('nominal').notNull(),
  type: text('type').default('FLAT'), // 'PERCENTAGE' or 'FLAT'
  startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
  endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  productId: text('productId').notNull(),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const productPrices = sqliteTable('product_prices', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  price: real('price').notNull(),
  minimumPurchase: real('minimumPurchase').default(1),
  type: text('type').default('RETAIL'),
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
  status: text('status').default('COMPLETED'),
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
  status: text('status').default('COMPLETED'),
  inventoryBatchId: text('inventoryBatchId'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const purchaseReturns = sqliteTable('purchase_returns', {
  id: text('id').primaryKey(),
  local_ref_id: text('local_ref_id').unique(),
  supplierId: text('supplierId').notNull(),
  totalAmount: real('totalAmount').notNull(),
  returnType: text('returnType').default('CASH'),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const purchaseReturnItems = sqliteTable('purchase_return_items', {
  id: text('id').primaryKey(),
  purchaseReturnId: text('purchaseReturnId').notNull(),
  productId: text('productId').notNull(),
  quantity: real('quantity').notNull(),
  purchasePrice: real('purchasePrice').default(0),
  organizationId: text('organizationId').notNull(),
  ...syncColumns,
});

export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(), // e.g., 'lastSyncAt'
  value: text('value').notNull(),
});
