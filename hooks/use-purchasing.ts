import { Purchase, PurchaseItem, payables } from '@/db/schema';
import * as schema from '@/db/schema';
import { db } from '@/db';
import { useAuthStore } from '@/stores/system/auth';
import { usePayableStore } from '@/stores/payable';
import { InventoryTxType, Status, DEFAULT_PAYMENT_TYPE } from '@/constants';
import { and, eq, isNull, like, desc, or, isNotNull, gte, lte } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';

export interface CreatePurchasingDTO {
  id?: string;
  supplierId: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  employeeId?: string;
  employeeName?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName?: string;
    productBarcode?: string;
    productCategory?: string;
    productBrand?: string;
    productUnit?: string;
    variantId?: string;
    variantName?: string;
    variantCode?: string;
    variantNetto?: number;
    note?: string;
  }>;
  paymentTypeName?: string;
  paymentTypeCommission?: number;
  paymentTypeCommissionType?: string;
  paymentTypeMinimalAmount?: number;
  dueDate?: Date | null;
  note?: string;
  status: string;
  totalPaid?: number;
  commission?: number;
  totalPurchase?: number;
  isPayable?: boolean;
}

export async function fetchPurchases(params?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  dateType?: string;
}): Promise<Purchase[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [eq(schema.purchases.organizationId, orgId)];

  if (params?.status) {
    conditions.push(eq(schema.purchases.status, params.status as any));
  }

  if (params?.search) {
    conditions.push(like(schema.purchases.local_ref_id, `%${params.search}%`));
  }

  if (params?.dateType && params?.dateType !== 'CUSTOM') {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (params.dateType) {
      case 'TODAY':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'THIS_WEEK': {
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
        break;
      }
      case 'THIS_MONTH':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'THIS_YEAR':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    conditions.push(gte(schema.purchases.createdAt, startDate));
    conditions.push(lte(schema.purchases.createdAt, endDate));
  } else if (params?.startDate) {
    conditions.push(gte(schema.purchases.createdAt, new Date(params.startDate)));
    if (params?.endDate) {
      const endOfDay = new Date(params.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.purchases.createdAt, endOfDay));
    }
  }

  const result = await db
    .select()
    .from(schema.purchases)
    .where(and(...conditions))
    .orderBy(desc(schema.purchases.createdAt));

  return result as unknown as Purchase[];
}

export async function fetchPurchase(
  id: string,
): Promise<(Purchase & { items?: PurchaseItem[] }) | null> {
  const result = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const items = await db
    .select()
    .from(schema.purchaseItems)
    .where(eq(schema.purchaseItems.purchaseId, id));

  return { ...result[0], items } as unknown as Purchase & {
    items?: PurchaseItem[];
  };
}

export async function fetchPurchaseItems(purchaseId: string): Promise<PurchaseItem[]> {
  const result = await db
    .select()
    .from(schema.purchaseItems)
    .where(eq(schema.purchaseItems.purchaseId, purchaseId));
  return result as unknown as PurchaseItem[];
}

export async function createPurchase(data: CreatePurchasingDTO): Promise<Purchase> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const supplierResult = data.supplierId
    ? await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, data.supplierId))
    : [];
  const supplierName = supplierResult[0]?.name || data.supplierName || '';
  const supplierPhone = supplierResult[0]?.phone || data.supplierPhone || null;
  const supplierAddress = supplierResult[0]?.address || data.supplierAddress || null;

  const newPurchase = {
    id,
    local_ref_id: `PO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    organizationId: orgId,
    supplierId: data.supplierId,
    supplierName,
    supplierPhone,
    supplierAddress,
    employeeId: data.employeeId || null,
    employeeName: data.employeeName || null,
    paymentTypeName: data.paymentTypeName || DEFAULT_PAYMENT_TYPE,
    paymentTypeCommission: data.paymentTypeCommission || 0,
    paymentTypeCommissionType: data.paymentTypeCommissionType || 'PERCENTAGE',
    paymentTypeMinimalAmount: data.paymentTypeMinimalAmount || 0,
    totalAmount,
    totalPaid: data.totalPaid || 0,
    dueDate: data.dueDate || null,
    status: data.status,
    note: data.note || null,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    _dirty: true,
    _syncedAt: null,
    commission: 0,
  };

  await db.insert(schema.purchases).values(newPurchase as any);

  for (const item of data.items) {
    const itemId = `pit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(schema.purchaseItems).values({
      id: itemId,
      purchaseId: id,
      organizationId: orgId,
      productId: item.productId,
      productName: item.productName || null,
      productBarcode: item.productBarcode || null,
      productCategory: item.productCategory || null,
      productBrand: item.productBrand || null,
      productUnit: item.productUnit || null,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      variantCode: item.variantCode || null,
      variantNetto: item.variantNetto || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      note: item.note || null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
      _dirty: true,
      _syncedAt: null,
    } as any);

    if (data.status === Status.COMPLETED) {
      await db.insert(schema.inventoryTransactions).values({
        id: `invtx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        local_ref_id: `${id}_${item.productId}`,
        productId: item.productId,
        productName: item.productName || null,
        productBarcode: item.productBarcode || null,
        productCategory: item.productCategory || null,
        productBrand: item.productBrand || null,
        productUnit: item.productUnit || null,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        variantCode: item.variantCode || null,
        variantNetto: item.variantNetto || null,
        type: InventoryTxType.PURCHASE,
        quantity: item.quantity,
        contextName: supplierName || null,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        status: Status.COMPLETED,
        _dirty: true,
        _syncedAt: null,
      } as any);
    }
  }

  if (data.isPayable && data.dueDate && data.status === Status.COMPLETED) {
    const nominal = totalAmount;
    await db.insert(payables).values({
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      local_ref_id: `PAY-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      organizationId: orgId,
      supplierId: data.supplierId,
      supplierName,
      supplierPhone,
      supplierAddress,
      nominal,
      dueDate: data.dueDate,
      note: data.note || null,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      _dirty: true,
      _syncedAt: null,
    } as any);
    usePayableStore.getState().incrementVersion();
  }

  return newPurchase as unknown as Purchase;
}

export function usePurchases(params?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  userId?: string;
  paymentTypeIds?: string[];
  dateType?: string;
}) {
  const [data, setData] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPurchases(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [
    params?.search,
    params?.status,
    params?.startDate,
    params?.endDate,
    params?.supplierId,
    params?.userId,
    params?.paymentTypeIds,
    params?.dateType,
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function usePurchase(id: string) {
  const [data, setData] = useState<(Purchase & { items?: PurchaseItem[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPurchase(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useCreatePurchasing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreatePurchasingDTO,
      options?: { onSuccess?: (data: Purchase) => void; onError?: (error: Error) => void },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await createPurchase(data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    loading: isLoading,
    isPending: isLoading,
    error,
  };
}
