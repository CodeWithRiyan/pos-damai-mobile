import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import {
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
import { findSellPrice } from "@/lib/price";
import { unitSuffixHelper } from "@/lib/unit";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";

export default function ProductDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = decodeURIComponent(id as string);
  console.log(`[DETAIL] productId from URL (decoded): "${productId}"`);
  const dummy = {
    _dirty: false,
    _syncedAt: "2026-02-27T00:52:37.000Z",
    barcode: "Idmlk",
    brand: { id: "brand_1771805613440_2xg86mbdz", name: "Indomilk" },
    brandId: "brand_1771805613440_2xg86mbdz",
    category: { id: "cat_1771805551659_m44wqzl6k", name: "Minuman" },
    categoryId: "cat_1771805551659_m44wqzl6k",
    code: "Idmlk",
    createdAt: "2026-02-23T23:58:21.000Z",
    createdBy: "user_owner_001",
    deletedAt: null,
    description: "",
    discount: undefined,
    discountId: null,
    id: "prod_1771807377410_ma11p17c4",
    isActive: true,
    isFavorite: false,
    isVariant: false,
    minimumStock: 100,
    name: "Indomilk",
    organizationId: "org_default_001",
    purchasePrice: 3000,
    sellPrices: [
      {
        _dirty: false,
        _syncedAt: "2026-02-27T00:52:38.000Z",
        createdAt: "2026-02-23T23:58:21.000Z",
        createdBy: "user_owner_001",
        deletedAt: null,
        id: "price_1771807407336_48b3teg6e",
        label: "Retail",
        minimumPurchase: 1,
        organizationId: "org_default_001",
        price: 4000,
        productId: "prod_1771807377410_ma11p17c4",
        type: "RETAIL",
        updatedAt: "2026-02-23T23:58:21.000Z",
        updatedBy: "user_owner_001",
      },
      {
        _dirty: false,
        _syncedAt: "2026-02-27T00:52:38.000Z",
        createdAt: "2026-02-23T23:58:21.000Z",
        createdBy: "user_owner_001",
        deletedAt: null,
        id: "price_1771807407340_x2gfdq7zo",
        label: "Grosir",
        minimumPurchase: 1,
        organizationId: "org_default_001",
        price: 3000,
        productId: "prod_1771807377410_ma11p17c4",
        type: "WHOLESALE",
        updatedAt: "2026-02-23T23:58:21.000Z",
        updatedBy: "user_owner_001",
      },
    ],
    stock: 108,
    supplierId: null,
    type: "VARIANTS",
    unit: null,
    updatedAt: "2026-02-23T23:58:21.000Z",
    updatedBy: "user_owner_001",
    variantData: undefined,
    variants: [
      {
        _dirty: false,
        _syncedAt: "2026-02-27T00:52:39.000Z",
        code: "Mrh",
        createdAt: "2026-02-23T23:58:21.000Z",
        createdBy: null,
        deletedAt: null,
        id: "var_1771807407353_ic0qbny2t",
        name: "Merah",
        netto: 1,
        organizationId: "org_default_001",
        productId: "prod_1771807377410_ma11p17c4",
        updatedAt: "2026-02-23T23:58:21.000Z",
        updatedBy: null,
      },
      {
        _dirty: false,
        _syncedAt: "2026-02-27T00:52:39.000Z",
        code: "Br",
        createdAt: "2026-02-23T23:58:21.000Z",
        createdBy: null,
        deletedAt: null,
        id: "var_1771807407357_0nox8eth6",
        name: "Biru",
        netto: 1,
        organizationId: "org_default_001",
        productId: "prod_1771807377410_ma11p17c4",
        updatedAt: "2026-02-23T23:58:21.000Z",
        updatedBy: null,
      },
    ],
  };

  const { refetch: refetchProducts } = useProducts();
  const { data: product, refetch: refetchProduct } = useProduct(
    productId || "",
  );
  const deleteMutation = useDeleteProduct();
  const toast = useToast();

  const onRefetch = () => {
    refetchProducts();
    refetchProduct();
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchProducts();
    await refetchProduct();
    setRefreshing(false);
  }, [refetchProducts, refetchProduct]);

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
          label: "Hapus",
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack>
          <VStack className="w-full p-4 border-b border-background-300">
            <Text size="xl" className="font-bold">
              {product?.name}
            </Text>
            <Text className="text-gray-500">{product?.code || "-"}</Text>
          </VStack>
          <Grid
            _extra={{ className: "grid-cols-2" }}
            className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300"
          >
            {/* Stok Terkini - Highlighted */}
            <GridItem
              _extra={{ className: "col-span-2" }}
              className="mb-2 p-3 bg-primary-50 border border-primary-200 rounded-md"
            >
              <Text className="text-primary-600 text-sm">Stok Terkini</Text>
              <Text className="font-bold text-2xl text-primary-700">
                {product?.stock ?? 0} {product?.unit || "pcs"}
              </Text>
            </GridItem>

            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Jenis Produk</Text>
              <Text className="font-bold">{product?.type || "-"}</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Harga Beli</Text>
              <Text className="font-bold">{`Rp ${product?.purchasePrice?.toLocaleString("id-ID")}`}</Text>
            </GridItem>
            {product?.unit && (
              <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
                <Text className="text-gray-500">Satuan</Text>
                <Text className="font-bold">{product?.unit}</Text>
              </GridItem>
            )}
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Kategori</Text>
              <Text className="font-bold">
                {product?.category?.name || "-"}
              </Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Brand</Text>
              <Text className="font-bold">{product?.brand?.name || "-"}</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Diskon</Text>
              <Text className="font-bold">
                {product?.discount?.name || "-"}
              </Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Minimum Stok</Text>
              <Text className="font-bold">{product?.minimumStock || "-"}</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Status</Text>
              <Text className="font-bold">
                {product?.isActive
                  ? "Tampil di transaksi"
                  : "Tidak tampil di transaksi"}
              </Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Keterangan</Text>
              <Text className="font-bold">{product?.description || "-"}</Text>
            </GridItem>
            {product?.type === "VARIANTS" && (
              <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
                <Text className="text-gray-500">Varian Barcode</Text>
                {!!product?.variants.length ? (
                  product?.variants.map((variant, index) => (
                    <Text key={index} className="font-bold">
                      {variant.code}
                    </Text>
                  ))
                ) : (
                  <Text className="font-bold">-</Text>
                )}
              </GridItem>
            )}
            <GridItem _extra={{ className: "col-span-1" }} className="pr-4">
              <Text className="text-gray-500">Perkiraan Keuntungan</Text>
              <Text className="text-success-500 font-bold">
                {`Rp ${(
                  findSellPrice({
                    sellPrices: product?.sellPrices,
                    type: "RETAIL",
                    quantity: 1,
                    unitVariant:
                      product?.type === "MULTIUNIT"
                        ? product?.variants.find((v) => v.netto === 1)
                        : undefined,
                  }) - (product?.purchasePrice || 0)
                ).toLocaleString("id-ID")}`}
              </Text>
            </GridItem>
          </Grid>
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
