import { useToast } from '@/components/ui/toast';
import {
  ProductListItem,
  useAssignProductsToSupplier,
  useUnassignProductsFromSupplier,
  useProducts,
} from '@/hooks/use-product';
import { useSupplier } from '@/hooks/use-supplier';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SelectingProductList from '../product/selecting-product';

export default function SelectProductInSupplier() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const supplierId = id as string;
  const { data } = useSupplier(supplierId);
  const { data: products } = useProducts({ forceParent: true });
  const toast = useToast();

  const originalProducts = products?.filter((p) => p.supplierId === supplierId) ?? [];

  const assignMutation = useAssignProductsToSupplier();
  const unassignMutation = useUnassignProductsFromSupplier();
  const isLoading = assignMutation.isPending || unassignMutation.isPending;

  const handleSubmit = async (selectedProducts: ProductListItem[]) => {
    const selectedIds = new Set(selectedProducts.map((p) => p.id));
    const originalIds = new Set(originalProducts.map((p) => p.id));

    const toAssign = selectedProducts.filter((p) => !originalIds.has(p.id)).map((p) => p.id);
    const toUnassign = originalProducts.filter((p) => !selectedIds.has(p.id)).map((p) => p.id);

    if (toAssign.length === 0 && toUnassign.length === 0) {
      showToast(toast, { action: 'warning', message: 'Tidak ada perubahan' });
      return;
    }

    try {
      if (toAssign.length > 0) {
        await assignMutation.mutateAsync(toAssign, supplierId);
      }
      if (toUnassign.length > 0) {
        await unassignMutation.mutateAsync(toUnassign);
      }
      showSuccessToast(toast, `Produk berhasil diperbarui untuk ${data?.name}`);
      router.back();
    } catch (error) {
      showErrorToast(toast, error as Error);
    }
  };

  return (
    <SelectingProductList
      usedFor="supplier"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'SUPPLIER'}`}
      selectedItems={originalProducts}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
