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
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { usePurchases } from "@/lib/api/purchasing";
import { useSupplier } from "@/lib/api/suppliers";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

export default function ReturnPurchasingSupplierTransactions() {
  const { resetCart } = useReturnPurchasingStore();
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const { data: purchases, isLoading: loadingPurchases } = usePurchases();
  const { data: supplier, isLoading: loadingSupplier } = useSupplier(
    supplierId || "",
  );
  const [search, setSearch] = useState("");
  const router = useRouter();
  const isLoading = loadingPurchases || loadingSupplier;

  // Reset state when component mounts (navigating to this screen)
  useEffect(() => {
    resetCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPurchases = purchases
    ?.filter((p) => p.supplierId === supplier?.id)
    ?.filter((p) => !search || p.local_ref_id?.includes(search));

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={`PILIH TRANSAKSI - ${supplier?.name.toUpperCase()}`}
        isGoBack
        action={
          <Pressable
            className="p-6"
            onPress={() =>
              router.navigate(
                `/(main)/management/return/purchasing/history?supplierId=${supplier?.id}`,
              )
            }
          >
            <SolarIconBold name="History" size={20} color="#FDFBF9" />
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
        <ScrollView className="flex-1">
          {isLoading ? (
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
            filteredPurchases.map((p) => (
              <Pressable
                key={p.id}
                className="px-4 py-4 border-b border-gray-200 active:bg-gray-100"
                onPress={() =>
                  router.push(
                    `/(main)/management/return/purchasing/input?purchaseId=${p.id}`,
                  )
                }
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
