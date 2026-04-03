import { useToast } from '@/components/ui/toast';
import { ProductListItem, useAssignProductsToSupplier, useProducts } from '@/hooks/use-product';
import { useSupplier } from '@/hooks/use-supplier';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SelectingProductList from '../product/selecting-product';

export default function SelectProductInSupplier() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const supplierId = id as string;
  const { data } = useSupplier(supplierId);
  const { data: products } = useProducts({ supplierId, forceParent: true });
  const toast = useToast();

  const assignMutation = useAssignProductsToSupplier();
  const isLoading = assignMutation.isPending;

  const handleSubmit = (selectedProducts: ProductListItem[]) => {
    if (selectedProducts.length === 0) {
      showToast(toast, { action: 'error', message: 'Pilih produk terlebih dahulu' });
      return;
    }

    const productIds = selectedProducts.map((p) => p.id);

    assignMutation.mutate(productIds, supplierId, {
      onSuccess: () => {
        showSuccessToast(toast, `Produk berhasil ditambahkan ke ${data?.name}`);
        router.back();
      },
      onError: (error: Error) => {
        showErrorToast(toast, error);
      },
    });
  };

  return (
    <SelectingProductList
      usedFor="supplier"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'SUPPLIER'}`}
      selectedItems={products}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
