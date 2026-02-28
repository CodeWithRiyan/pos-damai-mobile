import Header from "@/components/header";
import {
  Heading,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { useProducts } from "@/lib/api/products";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import ReturnPurchasingConfirmForm from "./form";
import PopupAddProduct from "./popup-add";

export default function ReturnPurchasingInput() {
  const { cart, setAddProduct, setOpenConfirm } = useReturnPurchasingStore();
  const [search, setSearch] = useState<string>("");
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const { data: products = [], isLoading: isLoadingProduct } = useProducts({
    forceParent: true,
    supplierId,
    search,
  });

  console.log("supplierId", supplierId);
  console.log("products", products);

  const isLoading = isLoadingProduct;

  return (
    <Box className="flex-1 bg-white">
      <Header header="RETUR PEMBELIAN" isGoBack />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari nama atau kode"
                onChangeText={setSearch}
              />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {isLoading ? (
                <VStack className="items-center py-10">
                  <Spinner />
                </VStack>
              ) : !products.length ? (
                <VStack className="items-center py-10">
                  <Text className="text-gray-400">
                    Tidak ada produk yang dibeli dari supplier ini
                  </Text>
                </VStack>
              ) : (
                products.map((item, index) => {
                  return (
                    <Pressable
                      key={index}
                      className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                      onPress={() => setAddProduct(item)}
                    >
                      <HStack className="justify-between items-center">
                        <HStack space="md" className="items-center">
                          <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                            <Heading className="text-primary-500 font-bold">
                              {item.name?.charAt(0).toUpperCase() || "?"}
                            </Heading>
                          </Box>
                          <VStack className="flex-1">
                            <Heading size="sm" className="line-clamp-2">
                              {item.name || "Unknown"}
                            </Heading>
                            <Text size="xs" className="text-slate-500">
                              {`Rp ${item.purchasePrice?.toLocaleString("id-ID") || 0}`}
                            </Text>
                          </VStack>
                          <HStack space="sm">
                            <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                              <Text className="font-bold">
                                {cart?.find((f) => f.product.id === item.id)
                                  ?.quantity || 0}
                              </Text>
                            </Box>
                            <Box className="h-10 min-w-10 items-center justify-center bg-primary-500 px-2 rounded-lg">
                              <Text className="text-typography-0 font-bold">
                                {item.stock}
                              </Text>
                            </Box>
                          </HStack>
                        </HStack>
                      </HStack>
                    </Pressable>
                  );
                })
              )}
            </VStack>
          </ScrollView>
        </VStack>
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {cart?.map((item, index) => (
                <Pressable
                  key={item.product.id}
                  className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                  onPress={() => setAddProduct(item.product)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="size-6 justify-center items-center">
                        <Heading size="md">{index + 1}</Heading>
                      </Box>
                      <VStack className="flex-1">
                        <Heading size="md" className="line-clamp-2">
                          {item.product.name}
                        </Heading>
                        <Text size="sm" className="text-slate-500">
                          {item.quantity} x Rp{" "}
                          {item.product.purchasePrice?.toLocaleString("id-ID")}{" "}
                          = Rp{" "}
                          {(
                            item.quantity * (item.product.purchasePrice || 0)
                          ).toLocaleString("id-ID")}
                        </Text>
                        {item.note && (
                          <Text size="sm" className="text-slate-500">
                            {item.note}
                          </Text>
                        )}
                      </VStack>
                      <HStack space="sm">
                        <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                          <Text className="font-bold">{item.quantity}</Text>
                        </Box>
                      </HStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </ScrollView>
          {!!cart.length && (
            <HStack space="md" className="w-full p-4">
              <Pressable
                className="flex-1 flex-row items-center justify-between h-16 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                onPress={() => setOpenConfirm(true)}
              >
                <HStack space="md" className="items-center">
                  <Text size="4xl" className="text-white font-bold">
                    {cart
                      .reduce((total, item) => total + item.quantity, 0)
                      .toLocaleString("id-ID")}
                  </Text>
                  <Text size="lg" className="text-white font-bold">
                    ITEM
                  </Text>
                </HStack>
                <Text size="lg" className="text-white font-bold">
                  LANJUT
                </Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddProduct />
      <ReturnPurchasingConfirmForm />
    </Box>
  );
}
