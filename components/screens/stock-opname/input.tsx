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
import { useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeleteStockOpname, StockOpname, useStockOpname } from "@/lib/api/purchasing";
import { useProducts } from "@/lib/api/products";
import { useStockOpnameStore } from "@/stores/stock-opname";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import StockOpnameConfirmForm from "./form";
import PopupAddStockOpname from "./popup-add";

export default function StockOpnameInput() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { cart, setAddProduct, setOpenConfirm } = useStockOpnameStore();
  const { data: products } = useProducts();
  const router = useRouter();

  const toast = useToast();

  return (
    <Box className="flex-1 bg-white">
      <Header header="INPUT BARANG" isGoBack />
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
                          {product.code}
                        </Text>
                      </VStack>
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
                          {item.product.code}
                        </Text>
                      </VStack>
                      <HStack space="sm">
                        <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                          <Text className="font-bold">
                            {item.physicalStock}
                          </Text>
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
                className="flex-1 flex-row items-center justify-center h-16 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                onPress={() => setOpenConfirm(true)}
              >
                <Text size="lg" className="text-white font-bold">
                  SIMPAN STOCK OPNAME
                </Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddStockOpname />
      <StockOpnameConfirmForm />
    </Box>
  );
}
