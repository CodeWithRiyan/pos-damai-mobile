import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { useCategory } from '@/lib/api/categories';
import { getErrorMessage } from "@/lib/api/client";
import { ProductListItem, useAssignProductsToCategory } from "@/lib/api/products";
import { useLocalSearchParams, useRouter } from "expo-router";
import SelectingProductList from "../product/selecting-product";

export default function SelectProductInCategory() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams();
  const categoryId = id as string;
  const { data, refetch } = useCategory(categoryId);
  const assignMutation = useAssignProductsToCategory();

  const handleSubmit = (selectedProducts: ProductListItem[]) => {
    if (selectedProducts.length === 0) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="warning" variant="solid">
            <ToastTitle>Pilih minimal 1 produk</ToastTitle>
          </Toast>
        ),
      });
      return;
    }

    const productIds = selectedProducts.map(p => p.id);

    assignMutation.mutate(
      { productIds, categoryId },
      {
        onSuccess: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>{selectedProducts.length} produk berhasil ditambahkan ke {data?.name}</ToastTitle>
              </Toast>
            ),
          });
          refetch();
          router.back();
        },
        onError: (error) => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>{getErrorMessage(error)}</ToastTitle>
              </Toast>
            ),
          });
        },
      }
    );
  };

  return (
    <SelectingProductList
      header="TAMBAH PRODUK"
      selectedItems={[]}
      onSubmit={handleSubmit}
    />
  );
}
