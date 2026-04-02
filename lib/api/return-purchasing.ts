import { SupplierReturn, useSupplierReturns, useSupplierReturn, useCreateSupplierReturn, fetchSupplierReturn, fetchSupplierReturns } from './supplier-returns';

export type PurchaseReturn = SupplierReturn;

export { useSupplierReturns as usePurchaseReturns, useSupplierReturn as usePurchaseReturn, useCreateSupplierReturn, fetchSupplierReturn, fetchSupplierReturns };

export function usePurchaseReturnList() {
  return useSupplierReturns();
}

export function usePurchaseReturnDetail(id: string) {
  return useSupplierReturn(id);
}

export function useCreatePurchaseReturn() {
  return useCreateSupplierReturn();
}

export async function fetchPurchaseReturns(params?: { search?: string; status?: string; supplierId?: string }): Promise<SupplierReturn[]> {
  return fetchSupplierReturns(params);
}