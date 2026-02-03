import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface SupplierPurchaseReturnSummary {
  supplierId: string;
  supplierName: string;
  totalReturns: number;
  totalValue: number;
  lastReturnDate: Date;
}

export interface SupplierPurchaseReturnDetail {
  id: string;
  returnDate: Date;
  returnType: string;
  totalAmount: number;
  localRefId: string | null;
  itemCount: number;
}

export function useSupplierPurchaseReturnsSummary() {
  return useQuery({
    queryKey: ['supplier-purchase-returns-summary'],
    queryFn: async () => {
      const response = await apiClient.get<SupplierPurchaseReturnSummary[]>(
        `/suppliers/purchase-returns/summary`
      );
      return response.data;
    },
  });
}

export function useSupplierPurchaseReturns(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-purchase-returns', supplierId],
    queryFn: async () => {
      const response = await apiClient.get<SupplierPurchaseReturnDetail[]>(
        `/suppliers/${supplierId}/purchase-returns`
      );
      return response.data;
    },
    enabled: !!supplierId,
  });
}
