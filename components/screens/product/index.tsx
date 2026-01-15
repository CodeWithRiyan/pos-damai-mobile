import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import { Product, useBulkDeleteProduct, useProducts } from "@/lib/api/products";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function ProductList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data, isLoading, refetch } = useProducts();
  const [selectedItems, setSelectedItems] = useState<Product[] | null>(null);

  const products = data || [];

  const deleteMutation = useBulkDeleteProduct();
  const toast = useToast();

  const handleItemPress = (item: Product) => {
    if (selectedItems?.some((r) => r.id === item.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== item.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([item]);
      return;
    }
    setSelectedItems([...selectedItems, item]);
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={"toast-" + id} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      ),
    });
  };

  const handleAdd = () => {
    setSelectedItems(null);
    router.push("/(main)/management/product-category-brand/product/add" as any);
  };

  const handleDeletePress = () => {
    const ids = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS PRODUK",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{ids?.length}</Text>
          {` produk? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(ids),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (ids: string[]) => {
    if (!ids.length) return;

    deleteMutation.mutate(
      { ids },
      {
        onSuccess: () => {
          setSelectedItems(null);
          hidePopUpConfirm();
          refetch();

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
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PRODUK"
        isGoBack
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedItems?.length ? (
              deleteMutation.isPending ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <Pressable className="p-6" onPress={() => handleDeletePress()}>
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
              )
            ) : (
              <Pressable className="p-6" onPress={() => {}}>
                <SolarIconBold
                  name="MenuDots"
                  size={20}
                  color="#FDFBF9"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </Pressable>
            )}
          </HStack>
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {products.map((item) => (
                <Pressable
                  key={item.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedItems?.some((r) => r.id === item.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedItems?.length) {
                      handleItemPress(item);
                    } else {
                      router.navigate(
                        `/(main)/management/product-category-brand/product/detail/${item.id}` as any
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handleItemPress(item)}
                >
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Heading size="sm">{item.name}</Heading>
                      {item.barcode && (
                        <Text size="xs" className="text-slate-400 mt-0.5">
                          {item.barcode}
                        </Text>
                      )}
                    </VStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        Harga Beli
                      </Text>
                      <Text>{formatPrice(item.purchasePrice)}</Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {products?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">Tidak ada produk</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH PRODUK</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
