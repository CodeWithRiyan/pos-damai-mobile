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
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useBrand, useBrands, useDeleteBrand } from "@/lib/api/brands";
import { getErrorMessage } from "@/lib/api/client";
import { useBrandStore } from "@/stores/brand";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { dataProducts, Product } from "../product";

export default function BrandDetail() {
  const { setOpen, setData } = useBrandStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const brandId = id as string;

  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[] | null>(
    null
  );

  const { refetch: refetchBrands } = useBrands();
  const { data: brand, refetch: refetchBrand } = useBrand(brandId || "");
  const deleteMutation = useDeleteBrand();
  const toast = useToast();

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
      onOk: () => {}, // tambahkan fungsi hapus produk dari brand
      // loading: false,
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
          {`Apakah Anda yakin ingin menghapus pelanggan `}
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
        setShowActionsheet(false);
        router.back();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Pelanggan berhasil dihapus</ToastTitle>
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
        header="DETAIL BRAND"
        selectedItemsLength={selectedProducts?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => setSelectedProducts(null)}
        action={
          !!selectedProducts?.length ? (
            // deleteProductFromBrandMutation.isPending
            false ? (
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
            <Pressable className="p-6" onPress={() => setShowActionsheet(true)}>
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
                      <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                        <Text className="text-brand-primary font-bold">
                          {product.name.substring(0, 1).toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">{product.name}</Heading>
                        <Text size="xs" className="text-slate-500">
                          {product.code}
                        </Text>
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">{`Harga Beli: Rp ${product.purchasePrice.toLocaleString(
                            "id-ID"
                          )}`}</BadgeText>
                        </Badge>
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        {product.stock}
                      </Text>
                      <Text className="text-xs">
                        Retail:{" "}
                        {`${
                          product.sellPrices?.filter(
                            (r) => r.type === "RETAIL"
                          )?.[0].minimumPurchase
                        }@ Rp ${product.sellPrices
                          ?.filter((r) => r.type === "RETAIL")?.[0]
                          .price.toLocaleString("id-ID")}`}
                      </Text>
                      <Text className="text-xs">
                        Grosir:{" "}
                        {`${
                          product.sellPrices?.filter(
                            (r) => r.type === "WHOLESALE"
                          )?.[0].minimumPurchase
                        }@ Rp ${product.sellPrices
                          ?.filter((r) => r.type === "WHOLESALE")?.[0]
                          .price.toLocaleString("id-ID")}`}
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500">
          <Text size="sm" className="text-typography-0 font-bold">TAMBAHKAN PRODUK</Text>
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
              setOpen(true);
              setData(brand);
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
