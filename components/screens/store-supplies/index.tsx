import Header from "@/components/header";
import { Heading } from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useStoreSupplies } from "@/lib/api/store-supplies";
import { useStoreSuppliesStore } from "@/stores/store-supplies";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

export default function StoreSuppliesList({
  isReport,
}: {
  isReport?: boolean;
}) {
  const { cart } = useStoreSuppliesStore();
  const router = useRouter();
  const { data: storeSupplies, isLoading, refetch } = useStoreSupplies();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddStoreSupplies = () => {
    router.push("/(main)/management/stock-changes/store-supplies/input");
  };

  if (isLoading && !refreshing) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={isReport ? "LAPORAN KEBUTUHAN TOKO" : "KEBUTUHAN TOKO"}
        isGoBack
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <VStack>
              {storeSupplies?.map((so) => (
                <Pressable
                  key={so.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100${!!cart.find((item) => item.product.id === so.id) ? " bg-gray-100" : ""}`}
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/stock-changes/store-supplies/detail/${so.id}`,
                    );
                  }}
                >
                  <HStack className="flex-1">
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Tanggal</Text>
                      <Text>
                        {dayjs(so.date).format("DD-MM-YYYY HH:mm:ss")}
                      </Text>
                    </VStack>
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Nama</Text>
                      <Text>{so.createdBy || "-"}</Text>
                    </VStack>
                    <HStack className="absolute right-0 top-0 h-full">
                      <HStack className="h-full ml-4 items-center justify-center">
                        <Heading size="lg" className="text-gray-400">
                          ›
                        </Heading>
                      </HStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
              {storeSupplies?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Belum ada data kebutuhan toko
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          {!isReport && (
            <HStack className="w-full p-4">
              <Button
                size="sm"
                className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAddStoreSupplies}
              >
                <ButtonText className="text-white">
                  TAMBAH KEBUTUHAN TOKO
                </ButtonText>
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
