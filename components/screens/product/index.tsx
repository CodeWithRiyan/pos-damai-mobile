import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconBold,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import {
  Product,
  ShowByStock,
  useBulkDeleteProduct,
  useProducts,
} from "@/lib/api/products";
import { useFocusEffect, useRouter } from "expo-router";
import { debounce } from "lodash";
import { SearchIcon } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import ProductFilter from "./filter";
import ProductNotification from "./notification";

export default function ProductList() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();

  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<ShowByStock>("ALL_STOCK");

  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const activeFilterCount = [brandId, categoryId].filter(Boolean).length;

  const [search, setSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data, isLoading, refetch } = useProducts({
    search: searchQuery,
    showByStock: stockFilter,
    brandId,
    categoryId,
    forceParent: true,
  });
  const [selectedItems, setSelectedItems] = useState<Product[] | null>(null);

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    [],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
    if (!productIds.length) return;

    Alert.alert(
      "HAPUS PRODUK",
      `Apakah Anda yakin ingin menghapus ${productIds.length} produk? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: "BATAL", style: "cancel" },
        {
          text: "HAPUS",
          style: "destructive",
          onPress: () => {
            console.log(
              `[LIST DELETE] Deleting ids: ${JSON.stringify(productIds)}`,
            );
            deleteMutation.mutate(
              { ids: productIds },
              {
                onSuccess: () => {
                  setSelectedItems(null);
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
              },
            );
          },
        },
      ],
    );
  };

  const PopUp = () => {
    return (
      <>
        <ProductNotification
          open={openNotification}
          setOpen={setOpenNotification}
          value={stockFilter}
          onChange={(v) => setStockFilter(v as ShowByStock)}
        />
        <ProductFilter
          open={openFilter}
          setOpen={setOpenFilter}
          brandId={brandId || ""}
          setBrandId={setBrandId}
          categoryId={categoryId || ""}
          setCategoryId={setCategoryId}
        />
      </>
    );
  };

  return (
    <Box className="flex-1 bg-white">
      {isLoading && (
        <Box className="absolute inset-0 bg-black/40 justify-center items-center z-[100]">
          <Spinner size="large" />
        </Box>
      )}
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
            <Pressable
              className="p-6"
              onPress={() => {
                showActionDrawer({
                  actions: [
                    {
                      label: "Export Data",
                      icon: "Export",
                      onPress: () => {
                        hideActionDrawer();
                      },
                    },
                    {
                      label: "Import Data",
                      icon: "Import",
                      onPress: () => {
                        hideActionDrawer();
                      },
                    },
                  ],
                });
              }}
            >
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
        <VStack className="flex-1">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => setOpenNotification(true)}
            >
              <SolarIconLinear name="Bell" size={20} color="#3d2117" />
            </Pressable>
            <Pressable
              className="relative size-10 items-center justify-center"
              onPress={() => setOpenFilter(true)}
            >
              <SolarIconLinear name="Filter" size={20} color="#3d2117" />
              {!!activeFilterCount && (
                <Box className="absolute top-0 right-0 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <Text size="xs" className="text-white font-bold">
                    {activeFilterCount}
                  </Text>
                </Box>
              )}
            </Pressable>
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari nama atau kode"
                value={search}
                onChangeText={handleSearchChange} // ← Gunakan handler baru
              />
            </Input>
          </HStack>
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
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
                        `/(main)/management/product-category-brand/product/detail/${encodeURIComponent(product.id)}` as any,
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
                        <HStack>
                          <Badge size="sm" variant="solid" action="muted">
                            <BadgeText className="text-xs">{`Harga Beli: Rp ${(
                              product.purchasePrice ?? 0
                            ).toLocaleString("id-ID")}`}</BadgeText>
                          </Badge>
                        </HStack>
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
              <ButtonText className="text-white">{`TAMBAH PRODUK `}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
      <PopUp />
    </Box>
  );
}
