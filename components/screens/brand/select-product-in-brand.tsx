import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { useBrand } from '@/lib/api/brands';
import { getErrorMessage } from '@/lib/api/client';
import { ProductListItem, useAssignProductsToBrand, useProducts } from '@/lib/api/products';
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
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={'toast-' + id} action="error" variant="solid">
            <ToastTitle>Pilih produk terlebih dahulu</ToastTitle>
          </Toast>
        ),
      });
      return;
    }

    const productIds = selectedProducts.map((p) => p.id);

    assignMutation.mutate(
      productIds,
      brandId,
      {
        onSuccess: () => {
          toast.show({
            placement: 'top',
            render: ({ id }) => (
              <Toast nativeID={'toast-' + id} action="success" variant="solid">
                <ToastTitle>{`Produk berhasil ditambahkan ke ${data?.name}`}</ToastTitle>
              </Toast>
            ),
          });
          router.back();
        },
        onError: (error) => {
          toast.show({
            placement: 'top',
            render: ({ id }) => (
              <Toast nativeID={'toast-' + id} action="error" variant="solid">
                <ToastTitle>{getErrorMessage(error)}</ToastTitle>
              </Toast>
            ),
          });
        },
      },
    );
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
