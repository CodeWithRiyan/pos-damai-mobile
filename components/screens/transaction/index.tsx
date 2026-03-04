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
  Toast,
  ToastTitle,
  useToast,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconBold,
  SolarIconOutline,
} from "@/components/ui/solar-icon-wrapper";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeleteTransaction, Transaction, useTransaction } from "@/lib/api/transaction";
import BarcodeScanner from "@/components/barcode-scanner";
import { Button, ButtonText } from "@/components/ui/button";
import { Grid, GridItem } from "@/components/ui/grid";
import GridProductLayout from "@/components/ui/layout/grid-product-layout";
import ListProductLayout from "@/components/ui/layout/list-product-layout";
import SelectModal from "@/components/ui/select/select-modal";
import { Spinner } from "@/components/ui/spinner";
import { useCustomers } from "@/lib/api/customers";
import { useProducts } from "@/lib/api/products";
import { useCurrentShift } from "@/lib/api/shifts";
import { findSellPrice } from "@/lib/price";
import { useTransactionStore } from "@/stores/transaction";
import classNames from "classnames";
import { useRouter } from "expo-router";
import { AlertCircle, PlusIcon } from "lucide-react-native";
import React from "react";
import { LayoutChangeEvent, ScrollView } from "react-native";
import PopupAddProduct from "./popup-add";

export default function TransactionList() {
  const [deleteItem, setDeleteItem] = React.useState<string | null>(null);
  const {
    cart,
    customer,
    setCustomer,
    setAddProduct,
    setStatus,
    removeCartItem,
    resetCart,
  } = useTransactionStore();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts({ forceParent: true });
  const { data: currentShift, isLoading: isLoadingShift } = useCurrentShift();
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [layout, setLayout] = React.useState<"list" | "grid">("list");

  const [deviceWidth, setDeviceWidth] = React.useState<number>(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setDeviceWidth(width);
    console.log("Device width:", width);
  };

  const optionsGroupCustomers =
    ["WHOLESALE", "RETAIL"].map((category) => ({
      label: category === "WHOLESALE" ? "GROSIR" : "RETAIL",
      options:
        customers
          ?.filter((c) => c.category === category)
          .map((c) => ({ label: c.name, value: c.id, desc: c.code || "" })) ||
        [],
    })) || [];

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some(
        (v) =>
          v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.code?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
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
  console.log("deviceWidth: ", deviceWidth);

  return (
    <Box className="flex-1 bg-white" onLayout={handleLayout}>
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
              optionsGroup={optionsGroupCustomers}
              className="flex-1"
              onChange={(v) => {
                if (v) {
                  setCustomer(
                    customers?.find((customer) => customer.id === v) || null,
                  );
                  resetCart();
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
            <Pressable
              className="relative size-10 items-center justify-center text-typography-500"
              onPress={() => setLayout(layout === "grid" ? "list" : "grid")}
            >
              <SolarIconOutline
                name={layout === "grid" ? "Widget" : "Server"}
                size={20}
                color="#6b7280"
              />
            </Pressable>
          </HStack>
          <ScrollView className="flex-1">
            {layout === "grid" && (
              <Grid
                _extra={{
                  className:
                    deviceWidth < 600
                      ? "grid-cols-2"
                      : deviceWidth < 1080
                        ? "grid-cols-3"
                        : "grid-cols-4",
                }}
                gap={16}
                className="flex-1 p-4"
              >
                {filteredProducts?.map((product, index) => {
                  const productInChart = cart?.find(
                    (f) => f.product.id === product.id,
                  );

                  return (
                    <GridItem key={index} _extra={{ className: "col-span-1" }}>
                      <GridProductLayout
                        name={product.name}
                        price={findSellPrice({
                          sellPrices: product.sellPrices,
                          type: customer?.category,
                          quantity: 1,
                        })}
                        quantityInCart={
                          product.type !== "MULTIUNIT"
                            ? productInChart?.quantity || 0
                            : cart
                                ?.filter((f) => f.product.id === product.id)
                                .map(
                                  (m) => m.quantity * (m.variant?.netto || 1),
                                )
                                .reduce((prev, curr) => prev + curr, 0)
                        }
                        stock={product.stock}
                        minStock={product.minimumStock}
                        onPressProduct={() => setAddProduct(product)}
                      />
                    </GridItem>
                  );
                })}
              </Grid>
            )}
            {layout === "list" && (
              <VStack className="flex-1">
                {filteredProducts?.map((product, index) => {
                  const productInChart = cart?.find(
                    (f) => f.product.id === product.id,
                  );

                  return (
                    <ListProductLayout
                      key={index}
                      name={product.name}
                      price={findSellPrice({
                        sellPrices: product.sellPrices,
                        type: customer?.category,
                        quantity: 1,
                      })}
                      quantityInCart={
                        product.type !== "MULTIUNIT"
                          ? productInChart?.quantity || 0
                          : cart
                              ?.filter((f) => f.product.id === product.id)
                              .map((m) => m.quantity * (m.variant?.netto || 1))
                              .reduce((prev, curr) => prev + curr, 0)
                      }
                      stock={product.stock}
                      onPressProduct={() => setAddProduct(product)}
                    />
                  );
                })}
              </VStack>
            )}
          </ScrollView>
        </VStack>
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {cart?.map((item, index) => (
                <Pressable
                  key={index}
                  className="relative px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                  onPress={() => {
                    setAddProduct(item.product, item.variant?.id);
                    setDeleteItem(null);
                  }}
                  onLongPress={() => {
                    const newDeleteItem =
                      item.product.type === "MULTIUNIT" &&
                      customer?.category !== "WHOLESALE"
                        ? item.variant?.id || ""
                        : item.product.id;

                    if (deleteItem === newDeleteItem) {
                      setDeleteItem(null);
                      return;
                    }
                    setDeleteItem(newDeleteItem);
                  }}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="size-6 justify-center items-center">
                        <Heading size="md">{index + 1}</Heading>
                      </Box>
                      <VStack className="flex-1">
                        <Heading size="md" className="line-clamp-2">
                          {item.variant && item.product.type === "MULTIUNIT"
                            ? `${item.product.name} - ${item.variant.name}`
                            : item.product.name}
                        </Heading>
                        <Text size="sm" className="text-slate-500">
                          {`${item.quantity} x Rp ${
                            item.tempSellPrice
                              ? item.tempSellPrice.toLocaleString("id-ID")
                              : findSellPrice({
                                  sellPrices: item.product.sellPrices,
                                  type: customer?.category,
                                  quantity: item.quantity,
                                  unitVariant: item.variant,
                                }).toLocaleString("id-ID")
                          } = Rp ${(item.tempSellPrice
                            ? item.tempSellPrice * item.quantity
                            : findSellPrice({
                                sellPrices: item.product.sellPrices,
                                type: customer?.category,
                                quantity: item.quantity,
                                unitVariant: item.variant,
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
                  <Pressable
                    className={classNames(
                      "absolute right-0 top-0 bottom-0 w-0 bg-error-500 items-center justify-center overflow-hidden transaction-all duration-300",
                      item.product.type !== "MULTIUNIT" &&
                        deleteItem === item.product.id &&
                        "w-16",
                      item.product.type === "MULTIUNIT" &&
                        customer?.category !== "WHOLESALE" &&
                        deleteItem === item.variant?.id &&
                        "w-16",
                      item.product.type === "MULTIUNIT" &&
                        customer?.category === "WHOLESALE" &&
                        deleteItem === item.product?.id &&
                        "w-16",
                    )}
                    onPress={() => {
                      removeCartItem(item.product?.id || "", item.variant?.id);
                      setDeleteItem(null);
                    }}
                  >
                    <SolarIconBold name="TrashBin2" size={20} color="white" />
                  </Pressable>
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
      <BarcodeScanner
        onBarcodeScanned={(result) => {
          const scannedData = result.data;

          let foundProduct = products?.find((p) => p.barcode === scannedData);

          // 2. Jika tidak ketemu, cari di dalam list variants milik semua produk
          if (!foundProduct) {
            foundProduct = products?.find((p) =>
              p.variants?.some((v) => v.code === scannedData),
            );
          }

          // 3. Validasi hasil pencarian
          if (!foundProduct) {
            toast.show({
              placement: "top",
              render: ({ id }) => (
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>
                    {`Produk dengan barcode ${scannedData} tidak ditemukan`}
                  </ToastTitle>
                </Toast>
              ),
            });
            return;
          }

          // 4. Set produk yang ditemukan (baik dari barcode utama maupun variant)
          setAddProduct(foundProduct);
        }}
      />
    </Box>
  );
}
