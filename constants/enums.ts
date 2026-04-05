export const Status = {
  COMPLETED: 'COMPLETED',
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
} as const;

export const PriceType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
} as const;

export const PaymentMethod = { CASH: 'CASH', DEBT: 'DEBT' } as const;

export const ReturnType = { CASH: 'CASH', ITEM: 'ITEM' } as const;

export const FinanceType = {
  INCOME: 'INCOME',
  EXPENSES: 'EXPENSES',
} as const;

export const CalcType = { FLAT: 'FLAT', PERCENTAGE: 'PERCENTAGE' } as const;

export const ProductType = {
  DEFAULT: 'DEFAULT',
  MULTIUNIT: 'MULTIUNIT',
  VARIANTS: 'VARIANTS',
} as const;

export const InventoryTxType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  STOCK_OPNAME: 'STOCK_OPNAME',
  INITIAL_STOCK: 'INITIAL_STOCK',
  RETURN_SALE: 'RETURN_SALE',
  RETURN_PURCHASE: 'RETURN_PURCHASE',
  STORE_SUPPLY: 'STORE_SUPPLY',
  // Legacy aliases (server sends both forms)
  SALES_RETURN: 'SALES_RETURN',
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  STORE_SUPPLIES: 'STORE_SUPPLIES',
} as const;

export const ShiftStatus = { ACTIVE: 'ACTIVE', CLOSED: 'CLOSED' } as const;

export const DateFilterType = {
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  THIS_YEAR: 'THIS_YEAR',
  CUSTOM: 'CUSTOM',
} as const;

export const DEFAULT_PAYMENT_TYPE = 'Tunai';
