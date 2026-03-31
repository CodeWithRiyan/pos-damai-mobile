import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  username: text("username").notNull(),
  organizationId: text("organizationId"),
  _dirty: integer("_dirty", { mode: "boolean" }).default(false),
  _syncedAt: integer("_syncedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
});

// Base columns for all sync-able tables
const syncColumns = {
  createdBy: text("createdBy"),
  updatedBy: text("updatedBy"),
  _dirty: integer("_dirty", { mode: "boolean" }).default(false),
  _syncedAt: integer("_syncedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
};

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  point: real("point").default(0),
  retailPoint: real("retailPoint").default(0),
  wholesalePoint: real("wholesalePoint").default(0),
  description: text("description"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const brands = sqliteTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode"),
  purchasePrice: real("purchasePrice").default(0),
  description: text("description"),
  isFavorite: integer("isFavorite", { mode: "boolean" }).default(false),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  type: text("type").default("DEFAULT"),
  unit: text("unit"),
  minimumStock: real("minimumStock").default(0),
  categoryId: text("categoryId").notNull(),
  brandId: text("brandId"),
  discountId: text("discountId"), // Added
  supplierId: text("supplierId"), // Added
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const discounts = sqliteTable("discounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nominal: real("nominal").notNull(),
  type: text("type").default("FLAT"), // 'PERCENTAGE' or 'FLAT'
  startDate: integer("startDate", { mode: "timestamp" }).notNull(),
  endDate: integer("endDate", { mode: "timestamp" }).notNull(),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const paymentTypes = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  commission: real("commission").default(0),
  commissionType: text("commissionType").default("PERCENTAGE"), // 'FLAT' or 'PERCENTAGE'
  isDefault: integer("isDefault", { mode: "boolean" }).default(false),
  minimalAmount: real("minimalAmount").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  productId: text("productId").notNull(),
  organizationId: text("organizationId").notNull(),
  netto: real("netto").default(1),
  ...syncColumns,
});

export const productPrices = sqliteTable("product_prices", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  price: real("price").notNull(),
  minimumPurchase: real("minimumPurchase").default(1),
  type: text("type").default("RETAIL"),
  productId: text("productId").notNull(),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").default("RETAIL"),
  code: text("code").unique(),
  phone: text("phone"),
  address: text("address"),
  points: real("points").default(0),
  totalTransactions: integer("totalTransactions").default(0),
  totalRevenue: real("totalRevenue").default(0),
  totalProfit: real("totalProfit").default(0),

  organizationId: text("organizationId"),
  ...syncColumns,
});

export const purchases = sqliteTable("purchases", {
  id: text("id").primaryKey(), // local UUID if offline
  local_ref_id: text("local_ref_id").unique(),
  supplierId: text("supplierId").notNull(),
  totalAmount: real("totalAmount").notNull(),
  totalPaid: real("totalPaid").default(0),
  paymentType: text("paymentType").default("CASH"),
  paymentTypeId: text("paymentTypeId"),
  commission: real("commission").default(0),
  status: text("status").default("COMPLETED"),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  note: text("note"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey(), // local UUID if offline
  local_ref_id: text("local_ref_id").unique(),
  productId: text("productId").notNull(),
  variantId: text("variantId"),
  type: text("type").notNull(),
  quantity: real("quantity").notNull(),
  status: text("status").default("COMPLETED"),
  note: text("note"),
  inventoryBatchId: text("inventoryBatchId"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const purchaseReturns = sqliteTable("purchase_returns", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  supplierId: text("supplierId").notNull(),
  totalAmount: real("totalAmount").notNull(),
  returnType: text("returnType").default("CASH"),
  note: text("note").notNull(), // Required field for return reason
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const purchaseReturnItems = sqliteTable("purchase_return_items", {
  id: text("id").primaryKey(),
  purchaseReturnId: text("purchaseReturnId").notNull(),
  productId: text("productId").notNull(),
  quantity: real("quantity").notNull(),
  purchasePrice: real("purchasePrice").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const stockOpnames = sqliteTable("stock_opnames", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  note: text("note"),
  status: text("status").default("DIFFERENCE"),
  totalGain: real("totalGain").default(0),
  totalLoss: real("totalLoss").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const stockOpnameItems = sqliteTable("stock_opname_items", {
  id: text("id").primaryKey(),
  stockOpnameId: text("stockOpnameId").notNull(),
  productId: text("productId").notNull(),
  variantId: text("variantId"),
  quantitySystem: real("quantitySystem").notNull(),
  quantityPhysical: real("quantityPhysical").notNull(),
  difference: real("difference").notNull(),
  purchasePrice: real("purchasePrice").default(0),
  financialImpact: real("financialImpact").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(), // e.g., 'lastSyncAt'
  value: text("value").notNull(),
});

export const payables = sqliteTable("payables", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  nominal: real("nominal").notNull(),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  note: text("note"),
  supplierId: text("supplierId").notNull(),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const payableRealizations = sqliteTable("payable_realizations", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  payableId: text("payableId").notNull(),
  nominal: real("nominal").notNull(),
  realizationDate: integer("realizationDate", { mode: "timestamp" }).notNull(),
  paymentMethodId: text("paymentMethodId").notNull(),
  note: text("note"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const receivables = sqliteTable("receivables", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  nominal: real("nominal").notNull(),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  note: text("note"),
  userId: text("userId").notNull(),
  organizationId: text("organizationId").notNull(),
  transactionId: text("transactionId"),  // NEW: optional link to transaction
  ...syncColumns,
});

export const receivableRealizations = sqliteTable("receivable_realizations", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  receivableId: text("receivableId").notNull(),
  nominal: real("nominal").notNull(),
  realizationDate: integer("realizationDate", { mode: "timestamp" }).notNull(),
  paymentMethodId: text("paymentMethodId").notNull(),
  note: text("note"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

// Sales Transactions (POS)
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  customerId: text("customerId"),
  employeeId: text("employeeId"),
  totalAmount: real("totalAmount").notNull(),
  totalPaid: real("totalPaid").notNull(),
  commission: real("commission").default(0),
  totalDiscount: real("totalDiscount").default(0),
  totalProfit: real("totalProfit").default(0),
  paymentTypeId: text("paymentTypeId").notNull(),
  transactionDate: integer("transactionDate", { mode: "timestamp" }).notNull(),
  status: text("status").default("COMPLETED"), // 'DRAFT' | 'COMPLETED'
  note: text("note"),
  returnId: text("returnId"), // links to a return-transaction; NULL = regular sale
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const transactionItems = sqliteTable("transaction_items", {
  id: text("id").primaryKey(),
  transactionId: text("transactionId").notNull(),
  productId: text("productId").notNull(),
  variantId: text("variantId"),
  quantity: real("quantity").notNull(),
  sellPrice: real("sellPrice").notNull(),
  discountAmount: real("discountAmount").default(0),
  purchasePrice: real("purchasePrice").default(0),
  profit: real("profit").default(0),
  note: text("note"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const transactionReturns = sqliteTable("transaction_returns", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  customerId: text("customerId"), // Can be null for walk-in customers
  totalAmount: real("totalAmount").notNull(),
  returnType: text("returnType").default("CASH"), // CASH, REPLACE, etc.
  note: text("note").notNull(), // Required field for return reason
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const transactionReturnItems = sqliteTable("transaction_return_items", {
  id: text("id").primaryKey(),
  transactionReturnId: text("transactionReturnId").notNull(),
  productId: text("productId").notNull(),
  variantId: text("variantId"),
  quantity: real("quantity").notNull(),
  sellPrice: real("sellPrice").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

// Cash Drawers & Shifts
export const cashDrawers = sqliteTable("cash_drawers", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

// Finance (Income & Expenses)
export const finances = sqliteTable("finances", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  nominal: real("nominal").notNull(),
  type: text("type").notNull(), // 'INCOME' | 'EXPENSES'
  expensesType: text("expensesType"), // 'STORE_EXPENSES' | 'SUPPLIES' | 'EQUIPMENT'
  transactionDate: integer("transactionDate", { mode: "timestamp" }).notNull(),
  status: text("status").default("COMPLETED"), // 'DRAFT' | 'COMPLETED'
  note: text("note"),
  inputToCashdrawer: integer("inputToCashdrawer", { mode: "boolean" }).default(
    false,
  ),
  userId: text("userId"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  cashDrawerId: text("cashDrawerId").notNull(),
  userId: text("userId").notNull(),
  startTime: integer("startTime", { mode: "timestamp" }).notNull(),
  endTime: integer("endTime", { mode: "timestamp" }),
  initialBalance: real("initialBalance").notNull(),
  finalBalance: real("finalBalance"),
  expectedBalance: real("expectedBalance"),
  difference: real("difference"),
  status: text("status").default("ACTIVE"), // 'ACTIVE' | 'CLOSED'
  note: text("note"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const storeSupplies = sqliteTable("store_supplies", {
  id: text("id").primaryKey(),
  local_ref_id: text("local_ref_id").unique(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  note: text("note"),
  status: text("status").default("COMPLETED"),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

export const storeSupplyItems = sqliteTable("store_supply_items", {
  id: text("id").primaryKey(),
  storeSupplyId: text("storeSupplyId").notNull(),
  productId: text("productId").notNull(),
  variantId: text("variantId"),
  quantitySystem: real("quantitySystem").notNull(),
  quantityPhysical: real("quantityPhysical").notNull(),
  usage: real("usage").notNull(),
  purchasePrice: real("purchasePrice").default(0),
  organizationId: text("organizationId").notNull(),
  ...syncColumns,
});

// Inferred types for select/insert operations
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type BrandRow = typeof brands.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type SupplierRow = typeof suppliers.$inferSelect;
export type DiscountRow = typeof discounts.$inferSelect;
export type PaymentTypeRow = typeof paymentTypes.$inferSelect;
export type ProductVariantRow = typeof productVariants.$inferSelect;
export type ProductPriceRow = typeof productPrices.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type PurchaseRow = typeof purchases.$inferSelect;
export type InventoryTransactionRow = typeof inventoryTransactions.$inferSelect;
export type PurchaseReturnRow = typeof purchaseReturns.$inferSelect;
export type PurchaseReturnItemRow = typeof purchaseReturnItems.$inferSelect;
export type StockOpnameRow = typeof stockOpnames.$inferSelect;
export type StockOpnameItemRow = typeof stockOpnameItems.$inferSelect;
export type PayableRow = typeof payables.$inferSelect;
export type PayableRealizationRow = typeof payableRealizations.$inferSelect;
export type ReceivableRow = typeof receivables.$inferSelect;
export type ReceivableRealizationRow =
  typeof receivableRealizations.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type TransactionItemRow = typeof transactionItems.$inferSelect;
export type TransactionReturnRow = typeof transactionReturns.$inferSelect;
export type TransactionReturnItemRow =
  typeof transactionReturnItems.$inferSelect;
export type CashDrawerRow = typeof cashDrawers.$inferSelect;
export type FinanceRow = typeof finances.$inferSelect;
export type ShiftRow = typeof shifts.$inferSelect;
export type StoreSupplyRow = typeof storeSupplies.$inferSelect;
export type StoreSupplyItemRow = typeof storeSupplyItems.$inferSelect;
