import Header from "@/components/header";
import { Box, HStack, Spinner, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
// import { useStoreSuppliesDetail } from "@/lib/api/store-supplies";
import dayjs from "dayjs";

// TODO: hapus dummy jika integrasi sudah selesai
const refetch = async () => {};
const isLoading = false;
const storeSupplies = {
  items: [
    {
      productName: "Beras",
      productUnit: "kg",
      createdBy: "12345",
      updatedBy: "12345",
      _dirty: true,
      _syncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
      id: "1",
      storeSuppliesId: "1",
      productId: "1",
      quantity: 2,
      purchasePrice: 15000,
      organizationId: "1",
    },
  ],
  createdBy: "12345",
  updatedBy: "12345",
  _dirty: true,
  _syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: new Date(),
  id: "1",
  local_ref_id: "1",
  date: new Date(),
  note: "catatan",
  status: "COMPLETED",
  totalAmount: 0,
  organizationId: "1",
};

export default function StoreSuppliesDetail() {
  const { id } = useLocalSearchParams();
  const storeSuppliesId = id as string;

  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  // TODO: uncomment jika sudah dibuatkan servicenya
  // const { data: storeSupplies, isLoading, refetch } = useStoreSuppliesDetail(storeSuppliesId);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!storeSupplies) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Text>Data not found</Text>
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL KEBUTUHAN TOKO"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={() => setShowActionsheet(true)}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Dibuat Oleh</Text>
            <Text className="font-bold">{storeSupplies.createdBy || "-"}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Tanggal</Text>
            <Text className="font-bold">
              {dayjs(storeSupplies.date).format("DD MMM YYYY HH:mm")}
            </Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Keterangan</Text>
            <Text className="font-bold">{storeSupplies.note || "-"}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Total Pengurangan Modal</Text>
            <Text className="font-bold text-error-500">
              {formatMoney(storeSupplies.totalAmount || 0)}
            </Text>
          </VStack>
        </Box>
        <VStack space="md" className="w-full">
          <Text className="text-center text-lg font-bold pt-4">
            Daftar Barang
          </Text>
          {storeSupplies.items?.map((item, index: number) => (
            <Pressable
              key={index}
              className="px-4 py-2 border-b border-background-300 active:bg-gray-100"
            >
              <Grid _extra={{ className: "grid-cols-2 gap-4" }}>
                <GridItem _extra={{ className: "col-span-2" }}>
                  <Text className="font-bold text-lg">
                    {item.productName || "-"}
                  </Text>
                </GridItem>

                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Jumlah Dibutuhkan</Text>
                  <Text className="font-bold">{item.quantity}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Pengurangan Modal</Text>
                  <Text className="font-bold text-error-500">
                    {formatMoney(Math.abs(item.purchasePrice * item.quantity))}
                  </Text>
                </GridItem>
              </Grid>
            </Pressable>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
