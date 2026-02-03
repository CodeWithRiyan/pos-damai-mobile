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
import { usePurchase, usePurchases } from "@/lib/api/purchasing";
import { useSuppliers, Supplier } from "@/lib/api/suppliers";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import ReturnPurchasingConfirmForm from "./form";
import PopupAddProduct from "./popup-add";

export default function PurchasingList() {
  const {
    cart,
    setAddProduct,
    setOpenConfirm,
    selectedPurchase,
    setSelectedPurchase,
    resetCart,
  } = useReturnPurchasingStore();
  const { data: purchases, isLoading: loadingPurchases } = usePurchases();
  const { data: purchaseDetail, isLoading: loadingDetail } = usePurchase(
    selectedPurchase?.id || "",
  );
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const router = useRouter();

  // Reset state when component mounts (navigating to this screen)
  useEffect(() => {
    resetCart();
    setSelectedSupplier(null);
    setSelectedPurchase(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1: Select Supplier
  if (!selectedSupplier) {
    return (
      <Box className="flex-1 bg-white">
        <Header 
          header="PILIH SUPPLIER" 
          isGoBack
          action={
            <Pressable
              className="p-6"
              onPress={() => router.push("/(main)/management/return/purchasing/history" as any)}
            >
              <Text className="text-white font-bold">RIWAYAT</Text>
            </Pressable>
          }
        />
        <VStack className="flex-1">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari nama supplier..."
                value={search}
                onChangeText={setSearch}
              />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            {loadingSuppliers ? (
              <VStack className="items-center py-10">
                <Spinner />
              </VStack>
            ) : !suppliers?.length ? (
              <VStack className="items-center py-10">
                <Text className="text-gray-400">Belum ada supplier</Text>
              </VStack>
            ) : (
              suppliers
                ?.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
                .map((supplier) => (
                  <Pressable
                    key={supplier.id}
                    className="px-4 py-4 border-b border-gray-200 active:bg-gray-100"
                    onPress={() => {
                      setSelectedSupplier(supplier);
                      setSearch(""); // Reset search for next step
                    }}
                  >
                    <HStack className="justify-between items-center">
                      <VStack className="flex-1">
                        <Heading size="sm">{supplier.name}</Heading>
                        {supplier.phone && (
                          <Text size="xs" className="text-gray-500">
                            {supplier.phone}
                          </Text>
                        )}
                      </VStack>
                      <Text className="text-gray-400 text-lg">›</Text>
                    </HStack>
                  </Pressable>
                ))
            )}
          </ScrollView>
        </VStack>
      </Box>
    );
  }

  // Step 2: Select Purchase Invoice from Selected Supplier
  if (!selectedPurchase) {
    const filteredPurchases = purchases?.filter(
      (p) => p.supplierId === selectedSupplier.id
    );

    return (
      <Box className="flex-1 bg-white">
        <Header 
          header={`PILIH FAKTUR - ${selectedSupplier.name}`}
          isGoBack
          action={
            <Pressable
              className="p-6"
              onPress={() => router.push("/(main)/management/return/purchasing/history" as any)}
            >
              <Text className="text-white font-bold">RIWAYAT</Text>
            </Pressable>
          }
        />
        <VStack className="flex-1">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari no transaksi..."
                value={search}
                onChangeText={setSearch}
              />
            </Input>
          </HStack>
          <Pressable
            className="mx-4 mb-2 px-3 py-2 bg-gray-100 rounded-lg active:bg-gray-200"
            onPress={() => setSelectedSupplier(null)}
          >
            <Text size="sm" className="text-gray-600 text-center">
              ← Ganti Supplier
            </Text>
          </Pressable>
          <ScrollView className="flex-1">
            {loadingPurchases ? (
              <VStack className="items-center py-10">
                <Spinner />
              </VStack>
            ) : !filteredPurchases?.length ? (
              <VStack className="items-center py-10">
                <Text className="text-gray-400">
                  Belum ada pembelian dari supplier ini
                </Text>
              </VStack>
            ) : (
              filteredPurchases
                ?.filter((p) => !search || p.local_ref_id?.includes(search))
                .map((p) => (
                  <Pressable
                    key={p.id}
                    className="px-4 py-4 border-b border-gray-200 active:bg-gray-100"
                    onPress={() => setSelectedPurchase(p)}
                  >
                    <HStack className="justify-between items-center">
                      <VStack>
                        <Heading size="sm">No: {p.local_ref_id}</Heading>
                        <Text size="xs" className="text-gray-500">
                          {dayjs(p.createdAt).format("DD MMM YYYY HH:mm")}
                        </Text>
                      </VStack>
                      <Text className="font-bold">
                        Rp {p.totalAmount.toLocaleString("id-ID")}
                      </Text>
                    </HStack>
                  </Pressable>
                ))
            )}
          </ScrollView>
        </VStack>
      </Box>
    );
  }

  // Once purchase is selected, show items from that purchase
  const products = purchaseDetail?.items || [];

  return (
    <Box className="flex-1 bg-white">
      <Header header={`RETUR: ${selectedPurchase.local_ref_id}`} isGoBack />
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
              {loadingDetail ? (
                <VStack className="items-center py-10">
                  <Spinner />
                </VStack>
              ) : !products.length ? (
                <VStack className="items-center py-10">
                  <Text className="text-gray-400">
                    Tidak ada item dalam pembelian ini
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
                              {item.productName?.charAt(0).toUpperCase() || "?"}
                            </Heading>
                          </Box>
                          <VStack className="flex-1">
                            <Heading size="sm" className="line-clamp-2">
                              {item.productName || "Unknown"}
                            </Heading>
                            <Text size="xs" className="text-slate-500">
                              {`Rp ${item.purchasePrice?.toLocaleString("id-ID") || 0}`}
                            </Text>
                          </VStack>
                          <HStack space="sm">
                            <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                              <Text className="font-bold">
                                {cart?.find(
                                  (f) => f.product.id === item.productId,
                                )?.quantity || 0}
                              </Text>
                            </Box>
                            <Box className="h-10 min-w-10 items-center justify-center bg-primary-500 px-2 rounded-lg">
                              <Text className="text-typography-0 font-bold">
                                {item.quantity}
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
                          {item.product.productName}
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
