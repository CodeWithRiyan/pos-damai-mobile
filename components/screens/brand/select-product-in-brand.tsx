import { useToast } from '@/components/ui/toast';
import { useBrand } from '@/hooks/use-brand';
import {
  ProductListItem,
  useAssignProductsToBrand,
  useUnassignProductsFromBrand,
  useProducts,
} from '@/hooks/use-product';
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

  const originalProducts = products?.filter((p) => p.brandId === brandId) ?? [];

  const assignMutation = useAssignProductsToBrand();
  const unassignMutation = useUnassignProductsFromBrand();
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
        await assignMutation.mutateAsync(toAssign, brandId);
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
      usedFor="brand"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'BRAND'}`}
      selectedItems={originalProducts}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
