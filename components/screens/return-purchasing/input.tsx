import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Heading,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeletePurchasing, Purchasing, usePurchasing } from "@/lib/api/purchasing";
import { Product } from "@/lib/api/products";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import React from "react";
import { ScrollView } from "react-native";
import ReturnPurchasingConfirmForm from "./form";
import PopupAddProduct from "./popup-add";

export interface ProductWithQuantity extends Product {
  quantity: number;
}
export interface Purchasing {
  id: string;
  no: string;
  products: ProductWithQuantity[];
}
export const _data: Purchasing = {
  id: "1",
  no: "1234567890",
  products: [
    {
      barcode: "12jie7388",
      brandId: null,
      categoryId: "cat_1768409228040_8phxsa5a0",
      code: "12jie7388",
      createdAt: new Date("2026-01-14T16:48:01.000Z"),
      description: null,
      discountId: null,
      id: "prod_1768409281086_cbj5ntuae",
      isActive: true,
      isFavorite: false,
      minimumStock: 0,
      name: "Daia Rose 800gr",
      organizationId: "org_default_001",
      purchasePrice: 15000,
      sellPrices: [],
      stock: 0,
      supplierId: null,
      type: "DEFAULT",
      unit: null,
      updatedAt: new Date("2026-01-14T16:48:01.000Z"),
      variants: [],
      quantity: 10,
    },
    {
      barcode: "ptn",
      brandId: "",
      categoryId: "",
      code: "ptn",
      createdAt: new Date("2026-01-19T06:23:09.000Z"),
      description: "",
      discountId: "",
      id: "prod_1768803789573_lo56lt593",
      isActive: true,
      isFavorite: false,
      minimumStock: 10,
      name: "Pantine",
      organizationId: "org_default_001",
      purchasePrice: 9000,
      sellPrices: [],
      stock: 0,
      supplierId: null,
      type: "DEFAULT",
      unit: null,
      updatedAt: new Date("2026-01-19T06:23:09.000Z"),
      variants: [],
      quantity: 10,
    },
  ],
};

export default function PurchasingList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { cart, setAddProduct, setOpenConfirm } = useReturnPurchasingStore();
  // const { data: products } = useProducts();

  const purchasing = _data;

  return (
    <Box className="flex-1 bg-white">
      <Header header="RETUR PEMBELIAN BARANG" isGoBack />
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
              <InputField placeholder="Cari nama atau kode" />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {purchasing.products?.map((product, index) => (
                <Pressable
                  key={index}
                  className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                  onPress={() => setAddProduct(product)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                        <Heading className="text-primary-500 font-bold">
                          {product.name.charAt(0).toUpperCase()}
                        </Heading>
                      </Box>
                      <VStack className="flex-1">
                        <Heading size="md" className="line-clamp-2">
                          {product.name}
                        </Heading>
                        <Text size="sm" className="text-slate-500">
                          {`Rp ${product.purchasePrice.toLocaleString("id-ID")}`}
                        </Text>
                      </VStack>
                      <HStack space="sm">
                        <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                          <Text className="font-bold">
                            {cart?.find((f) => f.product.id === product.id)
                              ?.quantity || 0}
                          </Text>
                        </Box>
                        <Box className="h-10 min-w-10 items-center justify-center bg-primary-500 px-2 rounded-lg">
                          <Text className="text-typography-0 font-bold">
                            {product.quantity}
                          </Text>
                        </Box>
                      </HStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
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
                          {item.product.purchasePrice.toLocaleString("id-ID")} =
                          Rp{" "}
                          {(
                            item.quantity * item.product.purchasePrice
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
