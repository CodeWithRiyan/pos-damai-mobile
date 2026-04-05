import { useToast } from '@/components/ui/toast';
import { useBrand } from '@/hooks/use-brand';
import { ProductListItem, useAssignProductsToBrand, useProducts } from '@/hooks/use-product';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SelectingProductList from '../product/selecting-product';

export default function SelectProductInBrand() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const brandId = id as string;
  const { data } = useBrand(brandId);
  const { data: products } = useProducts({ forceParent: true });
  const toast = useToast();

  const assignMutation = useAssignProductsToBrand();
  const isLoading = assignMutation.isPending;

  const handleSubmit = (selectedProducts: ProductListItem[]) => {
    if (selectedProducts.length === 0) {
      showToast(toast, { action: 'error', message: 'Pilih produk terlebih dahulu' });
      return;
    }

    const productIds = selectedProducts.map((p) => p.id);

    assignMutation.mutate(productIds, brandId, {
      onSuccess: () => {
        showSuccessToast(toast, `Produk berhasil ditambahkan ke ${data?.name}`);
        router.back();
      },
      onError: (error) => {
        showErrorToast(toast, error);
      },
    });
  };

  return (
    <SelectingProductList
      usedFor="brand"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'BRAND'}`}
      selectedItems={products?.filter((p) => p.brandId?.includes(brandId))}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
