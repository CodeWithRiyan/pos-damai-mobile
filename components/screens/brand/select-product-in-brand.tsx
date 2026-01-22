import { useBrand } from '@/lib/api/brands';
import { useLocalSearchParams, useRouter } from "expo-router";
import { ProductListItem, useAssignProductsToBrand } from "@/lib/api/products";
import SelectingProductList from "../product/selecting-product";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api/client";

export default function SelectProductInBrand() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const brandId = id as string;
  const { data } = useBrand(brandId);
  const toast = useToast();
  
  const assignMutation = useAssignProductsToBrand();

  const handleSubmit = (selectedProducts: ProductListItem[]) => {
    if (selectedProducts.length === 0) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={"toast-" + id} action="error" variant="solid">
            <ToastTitle>Pilih produk terlebih dahulu</ToastTitle>
          </Toast>
        ),
      });
      return;
    }

    const productIds = selectedProducts.map(p => p.id);
    
    assignMutation.mutate(
      { productIds, brandId },
      {
        onSuccess: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={"toast-" + id} action="success" variant="solid">
                <ToastTitle>Produk berhasil ditambahkan ke brand</ToastTitle>
              </Toast>
            ),
          });
          router.back();
        },
        onError: (error) => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={"toast-" + id} action="error" variant="solid">
                <ToastTitle>{getErrorMessage(error)}</ToastTitle>
              </Toast>
            ),
          });
        }
      }
    );
  };

  return (
    <SelectingProductList
      header={`TAMBAH PRODUK KE ${data?.name?.toUpperCase() ?? 'BRAND'}`}
      selectedItems={[]}
      onSubmit={handleSubmit}
    />
  );
}
