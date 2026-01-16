import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
// import { useBulkDeleteProduct, Product, useProducts } from "@/lib/api/products";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { dataProducts, Product } from ".";

export default function SelectingProductList({ header, selectedItems, onSubmit }: { header: string, selectedItems?: Product[], onSubmit?: (value: Product[]) => void }) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const [newSelectedItems, setNewSelectedItems] = useState<Product[]>(selectedItems || []);
  
  // const { data, isLoading, refetch } = useProducts();
  const products = dataProducts || [];
  // const deleteMutation = useBulkDeleteProduct();

  const toast = useToast();

  const handlePress = (data: Product) => {
    if (newSelectedItems.some((r) => r.id === data.id)) {
      setNewSelectedItems(newSelectedItems.filter((r) => r.id !== data.id));
      return;
    }
    if (!newSelectedItems) {
      setNewSelectedItems([data]);
      return;
    }

    setNewSelectedItems([...newSelectedItems, data]);
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

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={header}
        isGoBack
        selectedItemsLength={newSelectedItems.length}
        selectedItemsSuffixLabel="Produk terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={() => setNewSelectedItems([])}
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {products?.map((product) => (
                <Pressable
                  key={product.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    newSelectedItems.some((r) => r.id === product.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!newSelectedItems.length) {
                      handlePress(product);
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
              onPress={() => onSubmit?.(newSelectedItems || [])}
            >
              <ButtonText className="text-white">SIMPAN</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
