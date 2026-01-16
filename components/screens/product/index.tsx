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
// import { useBulkDeleteProduct, Product, useProducts } from "@/lib/api/products";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export interface Price {
  id: string;
  type: "RETAIL" | "WHOLESALE";
  minimumPurchase: number;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  retailPoint: number;
  wholesalePoint: number;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Discount {
  id: string;
  name: string;
  discount: number;
  type: "PERCENT" | "FIXED";
  startDate: string;
  endDate: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  type: "DEFAULT" | "MULTIUNIT" | "VARIANTS";
  unit?: "KILOGRAM" | "LITER" | null;
  code: string;
  categoryId?: string | null;
  category?: Category | null;
  brandId?: string | null;
  brand?: Brand | null;
  purchasePrice: number;
  stock: number;
  minimumStock: number;
  variants?: ProductVariant[] | null;
  sellPrices: Price[];
  discountId?: string | null;
  discount?: Discount | null;
  isActive: boolean;
  description?: string | null;
}

export const dataProducts: Product[] = [
  {
    id: "1",
    name: "Daia Rose 800gr",
    type: "DEFAULT",
    unit: null,
    code: "DAIAROSE800GR",
    category: {
      id: "1",
      name: "Deterjen",
      retailPoint: 1,
      wholesalePoint: 1.5,
    },
    brand: {
      id: "1",
      name: "WINGS",
    },
    purchasePrice: 14000,
    stock: 40,
    minimumStock: 10,
    sellPrices: [
      {
        id: "1",
        type: "RETAIL",
        minimumPurchase: 1,
        price: 16000,
      },
      {
        id: "2",
        type: "RETAIL",
        minimumPurchase: 3,
        price: 15500,
      },
      {
        id: "3",
        type: "WHOLESALE",
        minimumPurchase: 10,
        price: 15000,
      },
      {
        id: "4",
        type: "WHOLESALE",
        minimumPurchase: 20,
        price: 14500,
      },
    ],
    discount: null,
    isActive: true,
    description: null,
  },
  {
    id: "2",
    name: "Gula Pasir 1kg",
    type: "MULTIUNIT",
    unit: "KILOGRAM",
    code: "GULA1KG",
    category: {
      id: "2",
      name: "Bahan Pokok",
      retailPoint: 1,
      wholesalePoint: 1.5,
    },
    brand: null,
    purchasePrice: 15000,
    stock: 50,
    minimumStock: 0,
    sellPrices: [
      {
        id: "1",
        type: "RETAIL",
        minimumPurchase: 1,
        price: 17500,
      },
      {
        id: "2",
        type: "RETAIL",
        minimumPurchase: 3,
        price: 17000,
      },
      {
        id: "3",
        type: "RETAIL",
        minimumPurchase: 5,
        price: 16500,
      },
      {
        id: "4",
        type: "WHOLESALE",
        minimumPurchase: 10,
        price: 16000,
      },
      {
        id: "5",
        type: "WHOLESALE",
        minimumPurchase: 20,
        price: 15500,
      },
    ],
    discount: null,
    isActive: true,
    description: null,
  },
  {
    id: "3",
    name: "Ultramilk 750gr",
    code: "ULTRA750GR",
    type: "VARIANTS",
    unit: null,
    category: {
      id: "2",
      name: "Bahan Pokok",
      retailPoint: 1,
      wholesalePoint: 1.5,
    },
    brand: null,
    purchasePrice: 15000,
    stock: 50,
    minimumStock: 0,
    variants: [
      {
        id: "1",
        name: "Ultramilk Strawberry 750gr",
        code: "ULTRASTRAWBERRY750GR",
      },
      {
        id: "2",
        name: "Ultramilk Vanilla 750gr",
        code: "ULTRAVANILLA750GR",
      },
      {
        id: "3",
        name: "Ultramilk Chocolate 750gr",
        code: "ULTRACHOCOLATE750GR",
      },
    ],
    sellPrices: [
      {
        id: "1",
        type: "RETAIL",
        minimumPurchase: 1,
        price: 17500,
      },
      {
        id: "2",
        type: "RETAIL",
        minimumPurchase: 3,
        price: 17000,
      },
      {
        id: "3",
        type: "RETAIL",
        minimumPurchase: 5,
        price: 16500,
      },
      {
        id: "4",
        type: "WHOLESALE",
        minimumPurchase: 10,
        price: 16000,
      },
      {
        id: "5",
        type: "WHOLESALE",
        minimumPurchase: 20,
        price: 15500,
      },
    ],
    discount: null,
    isActive: true,
    description: null,
  },
];

export default function ProductList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  // const { data, isLoading, refetch } = useProducts();
  const [selectedItems, setSelectedItems] = useState<Product[] | null>(
    null
  );

  const products = dataProducts || [];

  // const deleteMutation = useBulkDeleteProduct();
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
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (productIds: string[]) => {
    if (!productIds.length) return;

    // deleteMutation.mutate(
    //   { ids: productIds },
    //   {
    //     onSuccess: () => {
    //       setSelectedItems(null);
    //       hidePopUpConfirm();
    //       refetch();

    //       toast.show({
    //         placement: "top",
    //         render: ({ id }) => (
    //           <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //             <ToastTitle>Produk berhasil dihapus</ToastTitle>
    //           </Toast>
    //         ),
    //       });
    //     },
    //     onError: (error) => {
    //       showErrorToast(error);
    //       hidePopUpConfirm();
    //     },
    //   }
    // );
  };

  // if (isLoading) {
  //   return (
  //     <Box className="flex-1 justify-center items-center">
  //       <Spinner size="large" />
  //     </Box>
  //   );
  // }

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
            // deleteMutation.isPending
            false ? (
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
                        `/(main)/management/product-category-brand/product/detail/${product.id}`
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handlePress(product)}
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
              {products?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No products found
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
