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
  SolarIconBold
} from "@/components/ui/solar-icon-wrapper";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeleteTransaction, Transaction, useTransaction } from "@/lib/api/transaction";
import { Button, ButtonText } from "@/components/ui/button";
import SelectModal from "@/components/ui/select/select-modal";
import { Spinner } from "@/components/ui/spinner";
import { useCustomers } from "@/lib/api/customers";
import { useProducts } from "@/lib/api/products";
import { useCurrentShift } from "@/lib/api/shifts";
import { findSellPrice } from "@/lib/price";
import { useTransactionStore } from "@/stores/transaction";
import { useRouter } from "expo-router";
import { AlertCircle, PlusIcon } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import PopupAddProduct from "./popup-add";

export default function TransactionList() {
  const { cart, customer, setCustomer, setAddProduct, setStatus } =
    useTransactionStore();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: currentShift, isLoading: isLoadingShift } = useCurrentShift();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoadingShift) {
    return (
      <Box className="flex-1 bg-white justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!currentShift) {
    return (
      <Box className="flex-1 bg-white">
        <Header header="TRANSAKSI PENJUALAN" />
        <VStack className="flex-1 justify-center items-center p-8" space="lg">
          <Icon as={AlertCircle} size="xl" color="#f59e0b" />
          <Heading size="lg" className="text-center">
            Shift Belum Dibuka
          </Heading>
          <Text className="text-center text-typography-500">
            Anda harus membuka shift sebelum dapat melakukan transaksi
            penjualan.
          </Text>
          <Button
            className="mt-4 bg-primary-500 rounded-lg"
            onPress={() => router.push("/(main)/shift/(tab)/current")}
          >
            <ButtonText>BUKA SHIFT SEKARANG</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

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
                  value: customer.id,
                  label: customer.name,
                  desc: customer.code || "",
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
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari nama atau kode"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {filteredProducts?.map((product, index) => {
                const productInChart = cart?.find(
                  (f) => f.product.id === product.id,
                );
                return (
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
                            {`Rp ${product.sellPrices[0].price.toLocaleString(
                              "id-ID",
                            )}`}
                          </Text>
                        </VStack>
                        <HStack space="sm">
                          <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                            <Text className="font-bold">
                              {(productInChart?.quantity || 0) *
                                (productInChart?.unitWeight || 0)}
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
                );
              })}
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
                          {`${item.product.name}${item.variant ? ` - ${item.variant.name}` : ""}${item.product.type === "MULTIUNIT" ? ` (${item.unitWeight} ${item.product.unit})` : ""}`}
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
                            ? item.tempSellPrice * item.quantity
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
                          <Text className="font-bold">
                            {item.quantity * (item.unitWeight || 1)}
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
