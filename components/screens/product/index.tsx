import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Badge, BadgeText } from "@/components/ui/badge";
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
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { ScrollView } from "react-native";

export default function ProductList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data, isLoading, refetch } = useProducts();
  const [selectedItems, setSelectedItems] = useState<Product[] | null>(
    null
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const products = data || [];

  const deleteMutation = useBulkDeleteProduct();
  const toast = useToast();

  const handlePress = (data: Product) => {
    if (selectedItems?.some((r) => r.id === data.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== data.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([data]);
      return;
    }

    setSelectedItems([...selectedItems, data]);
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

  const handleAdd = () => {
    setSelectedItems(null);
    router.push("/(main)/management/product-category-brand/product/add");
  };

  const handleDeletePress = () => {
    const productIds = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS PRODUK",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{productIds?.length}</Text>
          {` produk? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(productIds),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (productIds: string[]) => {
    if (!productIds.length) return;

    deleteMutation.mutate(
      { ids: productIds },
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

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PRODUK"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          !!selectedItems?.length ? (
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
          )
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {products?.map((product) => (
                <Pressable
                  key={product.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedItems?.some((r) => r.id === product.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedItems?.length) {
                      handlePress(product);
                    } else {
                      router.navigate(
                        `/(main)/management/product-category-brand/product/detail/${product.id}` as any
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handlePress(product)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-lg bg-primary-200 items-center justify-center">
                        <Text className="text-primary-500 font-bold">
                          {product.name.substring(0, 1).toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">{product.name}</Heading>
                        <Text size="xs" className="text-slate-500">
                          {product.code}
                        </Text>
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">{`Harga Beli: Rp ${(product.purchasePrice ?? 0).toLocaleString(
                            "id-ID"
                          )}`}</BadgeText>
                        </Badge>
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        Stok: {product.stock ?? 0}
                      </Text>
                      <Text className="text-xs">
                        Retail:{" "}
                        {`${
                          product.sellPrices?.filter(
                            (r) => r.type === "RETAIL"
                          )?.[0]?.minimumPurchase ?? 0
                        }@ Rp ${product.sellPrices
                          ?.filter((r) => r.type === "RETAIL")?.[0]
                          ?.price.toLocaleString("id-ID") ?? 0}`}
                      </Text>
                      <Text className="text-xs">
                        Grosir:{" "}
                        {`${
                          product.sellPrices?.filter(
                            (r) => r.type === "WHOLESALE"
                          )?.[0]?.minimumPurchase ?? 0
                        }@ Rp ${product.sellPrices
                          ?.filter((r) => r.type === "WHOLESALE")?.[0]
                          ?.price.toLocaleString("id-ID") ?? 0}`}
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {products?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Belum ada produk
                  </Text>
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
