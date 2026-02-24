import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Box,
  Heading,
  HStack,
  Spinner,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useBrand, useBrands, useDeleteBrand } from "@/lib/api/brands";
import { getErrorMessage } from "@/lib/api/client";
import {
  Product,
  useProductsByBrand,
  useUnassignProductsFromBrand,
} from "@/lib/api/products";
import { useBrandStore } from "@/stores/brand";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView } from "react-native";

export default function BrandDetail() {
  const { setOpen, setData } = useBrandStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const brandId = id as string;

  const [selectedProducts, setSelectedProducts] = useState<Product[] | null>(
    null,
  );

  const { refetch: refetchBrands } = useBrands();
  const { data: brand, refetch: refetchBrand } = useBrand(brandId || "");
  const { data: products } = useProductsByBrand(brandId || "");
  const deleteMutation = useDeleteBrand();
  const unassignProductMutation = useUnassignProductsFromBrand();
  const toast = useToast();

  const dataProducts = useMemo(() => products || [], [products]);

  const totalModal = useMemo(() => {
    return dataProducts.reduce((acc, curr) => {
      return acc + (curr.purchasePrice || 0) * (curr.stock || 0);
    }, 0);
  }, [dataProducts]);

  const onRefetch = () => {
    refetchBrands();
    refetchBrand();
  };

  const handleProductPress = (data: Product) => {
    if (selectedProducts?.some((r) => r.id === data.id)) {
      setSelectedProducts(selectedProducts.filter((r) => r.id !== data.id));
      return;
    }
    if (!selectedProducts) {
      setSelectedProducts([data]);
      return;
    }

    setSelectedProducts([...selectedProducts, data]);
  };

  const handleDeleteProductPress = () => {
    const productIds = selectedProducts?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: `HAPUS PRODUK DARI ${brand?.name.toUpperCase()}`,
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{productIds?.length}</Text>
          {` produk dari brand ${brand?.name}? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => {
        unassignProductMutation.mutate(
          { productIds },
          {
            onSuccess: () => {
              hidePopUpConfirm();
              setSelectedProducts(null);
              onRefetch();
              toast.show({
                placement: "top",
                render: ({ id }) => (
                  <Toast
                    nativeID={`toast-${id}`}
                    action="success"
                    variant="solid"
                  >
                    <ToastTitle>Produk berhasil dihapus dari brand</ToastTitle>
                  </Toast>
                ),
              });
            },
            onError: (error) => {
              showErrorToast(error);
              hidePopUpConfirm();
            },
          },
        );
      },
      loading: unassignProductMutation.isPending,
    });
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
      title: "HAPUS PELANGGAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus brand `}
          <Text className="font-bold text-slate-900">{brand?.name}</Text>
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
    if (!brand) return;

    deleteMutation.mutate(brand.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();
        router.back();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Brand berhasil dihapus</ToastTitle>
            </Toast>
          ),
        });
      },
      onError: (error) => {
        showErrorToast(error);
        hidePopUpConfirm();
      },
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Edit",
          icon: "Pen",
          onPress: () => {
            setOpen(true);
            setData(brand);
            hideActionDrawer();
          },
        },
        {
          label: "Delete",
          icon: "TrashBin2",
          theme: "red",
          onPress: () => {
            handleDeletePress();
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL BRAND"
        selectedItemsLength={selectedProducts?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => setSelectedProducts(null)}
        action={
          !!selectedProducts?.length ? (
            unassignProductMutation.isPending ? (
              <Box className="p-6">
                <Spinner size="small" color="#FFFFFF" />
              </Box>
            ) : (
              <Pressable
                className="p-6"
                onPress={() => handleDeleteProductPress()}
              >
                <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
              </Pressable>
            )
          ) : (
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          )
        }
        isGoBack
      />


      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Nama Brand</Text>
              <Text className="font-bold">{brand?.name || "-"}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Total Produk</Text>
              <Text className="font-bold">{dataProducts.length}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Nilai Modal</Text>
              <Text className="font-bold">
                Rp {totalModal.toLocaleString("id-ID")}
              </Text>
            </HStack>
          </Box>
          <Box className="pr-4">
            <VStack>
              {dataProducts?.map((product) => (
                <Pressable
                  key={product.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedProducts?.some((r) => r.id === product.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedProducts?.length) {
                      handleProductPress(product);
                    }
                  }}
                  onLongPress={() => handleProductPress(product)}
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
                          <BadgeText className="text-xs">{`Harga Beli: Rp ${(
                            product.purchasePrice ?? 0
                          ).toLocaleString("id-ID")}`}</BadgeText>
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
                            (r) => r.type === "RETAIL",
                          )?.[0]?.minimumPurchase ?? 0
                        }@ Rp ${
                          product.sellPrices
                            ?.filter((r) => r.type === "RETAIL")?.[0]
                            ?.price.toLocaleString("id-ID") ?? 0
                        }`}
                      </Text>
                      {!!product.sellPrices?.filter(
                        (r) => r.type === "WHOLESALE",
                      ).length && (
                        <Text className="text-xs">
                          Grosir:{" "}
                          {`${
                            product.sellPrices?.filter(
                              (r) => r.type === "WHOLESALE",
                            )?.[0]?.minimumPurchase ?? 0
                          }@ Rp ${
                            product.sellPrices
                              ?.filter((r) => r.type === "WHOLESALE")?.[0]
                              ?.price.toLocaleString("id-ID") ?? 0
                          }`}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => {
            router.navigate(
              `/(main)/management/product-category-brand/brand/select-product/${brand?.id}`,
            );
            setSelectedProducts(null);
          }}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            TAMBAHKAN PRODUK
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
