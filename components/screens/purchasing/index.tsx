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
import {
  SolarIconBold,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeletePurchasing, Purchasing, usePurchasing } from "@/lib/api/purchasing";
import { useProducts } from "@/lib/api/products";
import { usePurchasingStore } from "@/stores/purchasing";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import PopupAddProduct from "./popup-add";

export default function PurchasingList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { cart, setAddProduct, setStatus } = usePurchasingStore();
  const { data: products } = useProducts();
  const router = useRouter();

  const toast = useToast();

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PEMBELIAN BARANG"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconBold name="ClipboardList" size={20} color="#FDFBF9" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconBold name="History" size={20} color="#FDFBF9" />
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconLinear name="Bell" size={20} color="#3d2117" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconLinear name="Filter" size={20} color="#3d2117" />
            </Pressable>
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama atau kode" />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {products?.map((product, index) => (
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
                            {product.stock}
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
                          {item.newPurchasePrice.toLocaleString("id-ID")} = Rp{" "}
                          {(
                            item.quantity * item.newPurchasePrice
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
                onPress={() => {
                  router.navigate("/(main)/purchasing/checkout");
                  setStatus("COMPLETED");
                }}
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
              <Pressable
                className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                onPress={() => {
                  router.navigate("/(main)/purchasing/checkout");
                  setStatus("DRAFT");
                }}
              >
                <SolarIconBold name="ClipboardAdd" size={32} color="#3d2117" />
              </Pressable>
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddProduct />
    </Box>
  );
}
