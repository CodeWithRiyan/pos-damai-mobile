import { useToast } from '@/components/ui/toast';
import { useCategory } from '@/hooks/use-category';
import {
  ProductListItem,
  useAssignProductsToCategory,
  useUnassignProductsFromCategory,
  useProducts,
} from '@/hooks/use-product';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SelectingProductList from '../product/selecting-product';

export default function SelectProductInCategory() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams();
  const categoryId = id as string;
  const { data, refetch } = useCategory(categoryId);
  const { data: products } = useProducts({ forceParent: true });

  const originalProducts = products?.filter((p) => p.categoryId === categoryId) ?? [];

  const assignMutation = useAssignProductsToCategory();
  const unassignMutation = useUnassignProductsFromCategory();
  const isLoading = assignMutation.isPending || unassignMutation.isPending;

  const handleSubmit = async (selectedProducts: ProductListItem[]) => {
    const selectedIds = new Set(selectedProducts.map((p) => p.id));
    const originalIds = new Set(originalProducts.map((p) => p.id));

    const toAssign = selectedProducts.filter((p) => !originalIds.has(p.id)).map((p) => p.id);
    const toUnassign = originalProducts.filter((p) => !selectedIds.has(p.id)).map((p) => p.id);

    if (toAssign.length === 0 && toUnassign.length === 0) {
      showWarningToast(toast, 'Tidak ada perubahan');
      return;
    }

    try {
      if (toAssign.length > 0) {
        await assignMutation.mutateAsync(toAssign, categoryId);
      }
      if (toUnassign.length > 0) {
        await unassignMutation.mutateAsync(toUnassign);
      }
      showSuccessToast(toast, `Produk berhasil diperbarui untuk ${data?.name}`);
      refetch();
      router.back();
    } catch (error) {
      showErrorToast(toast, error as Error);
    }
  };

  return (
    <SelectingProductList
      usedFor="category"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'KATEGORI'}`}
      selectedItems={originalProducts}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
