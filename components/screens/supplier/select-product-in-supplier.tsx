import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/client';
import { ProductListItem, useAssignProductsToSupplier, useProducts } from '@/lib/api/products';
import { useSupplier } from '@/lib/api/suppliers';
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
      { productIds, supplierId },
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
      usedFor="supplier"
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'SUPPLIER'}`}
      selectedItems={products}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
