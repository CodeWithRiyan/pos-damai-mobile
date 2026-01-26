import Header from "@/components/header";
import {
  Heading,
  Icon,
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
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeleteTransaction, Transaction, useTransaction } from "@/lib/api/transaction";
import SelectModal from "@/components/ui/select/select-modal";
import { useCustomers } from "@/lib/api/customers";
import { useProducts } from "@/lib/api/products";
import { findSellPrice } from "@/lib/price";
import { useTransactionStore } from "@/stores/transaction";
import { useRouter } from "expo-router";
import { Plus, PlusIcon } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import PopupAddProduct from "./popup-add";

export default function TransactionList() {
  const { cart, customer, setCustomer, setAddProduct, setStatus } =
    useTransactionStore();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const router = useRouter();

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="TRANSAKSI PENJUALAN"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate("/(main)/transaction/draft")}
            >
              <SolarIconBold name="ClipboardList" size={20} color="#FDFBF9" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate("/(main)/transaction/history")}
            >
              <SolarIconBold name="History" size={20} color="#FDFBF9" />
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <HStack space="md" className="p-4 pb-0">
            <Pressable
              className="size-10 rounded-full bg-primary-500 items-center justify-center"
              onPress={() =>
                router.push("/(main)/management/customer-supplier/customer/add")
              }
            >
              <Icon as={PlusIcon} color="white" />
            </Pressable>
            <SelectModal
              value={customer?.id || ""}
              placeholder="Pilih Pelanggan"
              options={
                customers?.map((customer) => ({
                  label: customer.name,
                  value: customer.id,
                })) || []
              }
              className="flex-1"
              onChange={(v) => {
                if (v) {
                  setCustomer(
                    customers?.find((customer) => customer.id === v) || null,
                  );
                } else {
                  setCustomer(null);
                }
              }}
            />
          </HStack>
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
              <VStack className="p-4">
                <Pressable
                  className="w-full rounded-md h-10 flex-row justify-center items-center gap-4 bg-primary-100 border border-primary-500 active:bg-primary-200"
                  onPress={() =>
                    router.navigate(
                      "/(main)/management/product-category-brand/product/add",
                    )
                  }
                >
                  <Icon as={Plus} size="sm" color="#3d2117" />
                  <Text size="sm" className="text-brand-primary font-bold">
                    Tambah Barang
                  </Text>
                </Pressable>
              </VStack>
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
                          {cart?.find((f) => f.product.id === product.id)
                            ?.tempSellPrice ||
                            `Rp ${findSellPrice({
                              sellPrices: product.sellPrices,
                              type: customer?.category,
                              quantity:
                                cart?.find((f) => f.product.id === product.id)
                                  ?.quantity || 0,
                            }).toLocaleString("id-ID")}`}
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
                          {`${item.quantity} x Rp ${
                            item.tempSellPrice
                              ? item.tempSellPrice.toLocaleString("id-ID")
                              : findSellPrice({
                                  sellPrices: item.product.sellPrices,
                                  type: customer?.category,
                                  quantity: item.quantity,
                                }).toLocaleString("id-ID")
                          } = Rp ${(item.tempSellPrice
                            ? item.tempSellPrice
                            : findSellPrice({
                                sellPrices: item.product.sellPrices,
                                type: customer?.category,
                                quantity: item.quantity,
                              }) * item.quantity
                          ).toLocaleString("id-ID")}`}
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
                  router.navigate("/(main)/transaction/checkout");
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
                  router.navigate("/(main)/transaction/checkout");
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
