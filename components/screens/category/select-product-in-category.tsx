import { useToast } from '@/components/ui/toast';
import { useCategory } from '@/hooks/use-category';
import { ProductListItem, useAssignProductsToCategory, useProducts } from '@/hooks/use-product';
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
  const assignMutation = useAssignProductsToCategory();
  const isLoading = assignMutation.isPending;

  const handleSubmit = (selectedProducts: ProductListItem[]) => {
    if (selectedProducts.length === 0) {
      showWarningToast(toast, 'Pilih minimal 1 produk');
      return;
    }

    const productIds = selectedProducts.map((p) => p.id);

    assignMutation.mutate(productIds, categoryId, {
      onSuccess: () => {
        showSuccessToast(toast, `Produk berhasil ditambahkan ke ${data?.name}`);
        refetch();
        router.back();
      },
      onError: (error) => {
        showErrorToast(toast, error);
      },
    });
  };

  return (
    <SelectingProductList
      usedFor="category"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'KATEGORI'}`}
      selectedItems={products?.filter((p) => p.categoryId.includes(categoryId))}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
