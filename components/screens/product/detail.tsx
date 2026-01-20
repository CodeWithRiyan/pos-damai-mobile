import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Box,
  HStack,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteProduct, useProduct, useProducts } from "@/lib/api/products";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";

export default function ProductDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = id as string;


  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const { refetch: refetchProducts } = useProducts();
  const { data: product, refetch: refetchProduct } = useProduct(productId || "");
  const deleteMutation = useDeleteProduct();
  const toast = useToast();

  const onRefetch = () => {
    refetchProducts();
    refetchProduct();
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const handleDeletePress = () => {
    showPopUpConfirm({
      title: "HAPUS PRODUK",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus produk `}
          <Text className="font-bold text-slate-900">{product?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async () => {
    if (!product) return;

    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();
        setShowActionsheet(false);
        router.back();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Produk berhasil dihapus</ToastTitle>
            </Toast>
          ),
        });
      },
      onError: (error) => {
        showErrorToast(error);
        hidePopUpConfirm();
        setShowActionsheet(false);
      },
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL PRODUK"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={() => setShowActionsheet(true)}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <VStack className="w-full p-4 border-b border-background-300">
            <Text size="xl" className="font-bold">
              {product?.name}
            </Text>
            <Text className="text-gray-500">{product?.code || "-"}</Text>
          </VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            {/* Stok Terkini - Highlighted */}
            <VStack className="w-full mb-2 p-3 bg-primary-50 border border-primary-200 rounded-md">
              <Text className="text-primary-600 text-sm">Stok Terkini</Text>
              <Text className="font-bold text-2xl text-primary-700">
                {product?.stock ?? 0} {product?.unit || "pcs"}
              </Text>
            </VStack>
            
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Jenis Produk</Text>
              <Text className="font-bold">{product?.type || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Harga Beli</Text>
              <Text className="font-bold">{product?.purchasePrice || "-"}</Text>
            </VStack>
            {product?.unit && (
              <VStack className="w-1/2 pr-4">
                <Text className="text-gray-500">Satuan</Text>
                <Text className="font-bold">{product?.unit}</Text>
              </VStack>
            )}
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Kategori</Text>
              <Text className="font-bold">
                {product?.category?.name || "-"}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Brand</Text>
              <Text className="font-bold">{product?.brand?.name || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Diskon</Text>
              <Text className="font-bold">
                {product?.discount?.name || "-"}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Minimum Stok</Text>
              <Text className="font-bold">{product?.minimumStock || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Status</Text>
              <Text className="font-bold">
                {product?.isActive
                  ? "Tampil di transaksi"
                  : "Tidak tampil di transaksi"}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Keterangan</Text>
              <Text className="font-bold">{product?.description || "-"}</Text>
            </VStack>
          </Box>
          {product?.type === "VARIANTS" && (
            <VStack
              space="md"
              className="pt-4 pb-6 border-b border-background-300"
            >
              <Text className="font-bold text-center">Varian</Text>
              <Box className="w-full flex-row flex-wrap gap-y-4">
                {product?.variants?.map((variant, index) => (
                  <Box
                    key={index}
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-2 pl-4" : "pr-4 pl-2"
                    }`}
                  >
                    <VStack className="border border-background-200 rounded-md shadow bg-info-50 p-4">
                      <Text className="font-bold">{variant?.name || "-"}</Text>
                      <Text className="text-gray-500">
                        {variant?.code || "-"}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </Box>
            </VStack>
          )}
          <VStack space="md" className="p-10 pt-4">
            <Text className="font-bold text-center">List Harga</Text>
            <HStack
              space="md"
              className="border border-background-200 rounded-md shadow bg-info-50 p-4"
            >
              <VStack className="w-1/2 items-center">
                <Text className="font-bold pb-2">Harga Retail</Text>
                {product?.sellPrices
                  .filter((f) => f.type === "RETAIL")
                  ?.map((price, index) => (
                    <Text key={index}>{`${
                      price.minimumPurchase
                    }@ Rp ${price.price.toLocaleString("id-ID")}`}</Text>
                  ))}
              </VStack>
              <VStack className="w-1/2 items-center">
                <Text className="font-bold pb-2">Harga Grosir</Text>
                {product?.sellPrices
                  .filter((f) => f.type === "WHOLESALE")
                  ?.map((price, index) => (
                    <Text key={index}>{`${
                      price.minimumPurchase
                    }@ Rp ${price.price.toLocaleString("id-ID")}`}</Text>
                  ))}
              </VStack>
            </HStack>
          </VStack>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-background-0 border border-brand-primary"
          onPress={() => {
            if (product?.supplierId) {
              router.push(
                `/(main)/management/customer-supplier/supplier/detail/${product.supplierId}`
              );
            } else {
              toast.show({
                placement: "top",
                render: ({ id }) => (
                  <Toast nativeID={`toast-${id}`} action="warning" variant="solid">
                    <ToastTitle>Produk tidak memiliki supplier</ToastTitle>
                  </Toast>
                ),
              });
            }
          }}
        >
          <Text size="sm" className="text-brand-primary font-bold">
            LIHAT SUPPLIER
          </Text>
        </Pressable>
      </VStack>

      <Actionsheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="px-0">
          <ActionsheetDragIndicatorWrapper className="pb-4 pt-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem
            onPress={() => {
              router.navigate(
                `/(main)/management/product-category-brand/product/edit/${product?.id}`
              );
              setShowActionsheet(false);
            }}
          >
            <HStack className="w-full justify-between items-center px-4 py-2">
              <ActionsheetItemText className="font-bold">
                Edit
              </ActionsheetItemText>
              <SolarIconBold name="Pen" size={16} />
            </HStack>
          </ActionsheetItem>

          <ActionsheetItem
            onPress={() => {
              handleDeletePress();
            }}
          >
            <HStack className="w-full justify-between items-center px-4 py-2">
              <ActionsheetItemText className="font-bold text-red-500">
                Delete
              </ActionsheetItemText>
              <SolarIconBold name="TrashBin2" size={16} color="#ef4444" />
            </HStack>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}
