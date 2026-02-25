import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import {
  Box,
  HStack,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteProduct, useProduct, useProducts } from "@/lib/api/products";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView } from "react-native";

export default function ProductDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = decodeURIComponent(id as string);
  console.log(`[DETAIL] productId from URL (decoded): "${productId}"`);

  const { refetch: refetchProducts } = useProducts();
  const { data: product, refetch: refetchProduct } = useProduct(
    productId || "",
  );
  const deleteMutation = useDeleteProduct();
  const toast = useToast();

  const unitSuffixHelper = (unit?: string | null) => {
    switch (unit) {
      case "KILOGRAM":
        return "kg";
      case "LITER":
        return "liter";
      default:
        return "";
    }
  };

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
    Alert.alert(
      "HAPUS PRODUK",
      `Apakah Anda yakin ingin menghapus produk ${product?.name}? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: "BATAL", style: "cancel" },
        {
          text: "HAPUS",
          style: "destructive",
          onPress: () => {
            console.log(
              `[DETAIL] confirmDelete ENTERED via Alert, productId="${productId}", product.id="${product?.id}"`,
            );
            deleteMutation.mutate(productId, {
              onSuccess: () => {
                onRefetch();
                router.back();
                toast.show({
                  placement: "top",
                  render: ({ id }) => (
                    <Toast
                      nativeID={`toast-${id}`}
                      action="success"
                      variant="solid"
                    >
                      <ToastTitle>Produk berhasil dihapus</ToastTitle>
                    </Toast>
                  ),
                });
              },
              onError: (error) => {
                showErrorToast(error);
              },
            });
          },
        },
      ],
    );
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Log Produk",
          icon: "ClipboardList",
          onPress: () => {
            router.push(
              `/(main)/management/product-category-brand/product/log/${productId}`,
            );
            hideActionDrawer();
          },
        },
        {
          label: "Lihat Daftar Supplier",
          icon: "UsersGroupRounded",
          onPress: () => {
            router.push(
              `/(main)/management/product-category-brand/product/suppliers/${productId}`,
            );
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
        header="DETAIL PRODUK"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
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
          {!!product?.sellPrices.length && (
            <VStack space="md" className="p-10 pt-4">
              <Text className="font-bold text-center">List Harga</Text>
              <Grid
                _extra={{ className: "grid-cols-2" }}
                className="border border-background-200 rounded-md shadow bg-info-50 p-4 gap-4"
              >
                <GridItem
                  _extra={{
                    className: !!product?.sellPrices.filter(
                      (f) => f.type === "WHOLESALE",
                    ).length
                      ? "col-span-1"
                      : "col-span-2",
                  }}
                  className="items-center"
                >
                  <Text className="font-bold pb-2">Harga Retail</Text>
                  {product?.sellPrices
                    .filter((f) => f.type === "RETAIL")
                    .sort((a, b) => b.price - a.price)
                    ?.map((price, index) => (
                      <Text key={index}>{`${
                        product.type === "MULTIUNIT"
                          ? `${product.variants.find((f) => f.name === price.label)?.netto || 0} ${unitSuffixHelper(product.unit)}`
                          : `${price.minimumPurchase}@`
                      } Rp ${price.price.toLocaleString("id-ID")}`}</Text>
                    ))}
                </GridItem>
                {!!product?.sellPrices.filter((f) => f.type === "WHOLESALE")
                  .length && (
                  <GridItem
                    _extra={{ className: "col-span-1" }}
                    className="items-center"
                  >
                    <Text className="font-bold pb-2">{`Harga Grosir${product.type === "MULTIUNIT" ? ` (1 ${unitSuffixHelper(product.unit)})` : ""}`}</Text>
                    {product?.sellPrices
                      .filter((f) => f.type === "WHOLESALE")
                      ?.map((price, index) => (
                        <Text key={index}>{`${
                          price.minimumPurchase
                        }@ Rp ${price.price.toLocaleString("id-ID")}`}</Text>
                      ))}
                  </GridItem>
                )}
              </Grid>
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-background-0 border border-brand-primary"
          onPress={() => {
            router.navigate(
              `/(main)/management/product-category-brand/product/edit/${product?.id}`,
            );
          }}
        >
          <Text size="sm" className="text-brand-primary font-bold">
            EDIT PRODUK
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
