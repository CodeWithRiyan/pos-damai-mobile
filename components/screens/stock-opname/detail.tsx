import Header from "@/components/header";
import { Box, HStack, Text, VStack, Spinner } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { useStockOpname } from "@/lib/api/stock-opname";
import dayjs from "dayjs";

export default function StockOpnameDetail() {
  const { id } = useLocalSearchParams();
  const stockOpnameId = id as string;

  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const { data: stockOpname, isLoading } = useStockOpname(stockOpnameId);

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

  if (!stockOpname) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Text>Data not found</Text>
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL STOCK OPNAME"
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
            <Text className="font-bold">{stockOpname.createdBy || "-"}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Tanggal</Text>
            <Text className="font-bold">{dayjs(stockOpname.date).format("DD MMM YYYY HH:mm")}</Text>
          </VStack>
          <VStack className="w-full pr-4">
            <Text className="text-gray-500">Keterangan</Text>
            <Text className="font-bold">{stockOpname.note || "-"}</Text>
          </VStack>
           <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Total Gain</Text>
            <Text className="font-bold text-success-600">{formatMoney(stockOpname.totalGain || 0)}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
             <Text className="text-gray-500">Total Loss</Text>
            <Text className="font-bold text-error-600">{formatMoney(stockOpname.totalLoss || 0)}</Text>
          </VStack>
        </Box>
        <VStack space="md" className="w-full">
          {stockOpname.items?.map((item: any, index: number) => (
            <Pressable
              key={index}
              className="px-4 py-2 border-b border-background-300 active:bg-gray-100"
            >
              <Grid _extra={{ className: "grid-cols-2 gap-4" }}>
                <GridItem _extra={{ className: "col-span-2" }}>
                  <Text className="font-bold text-lg">{item.productName || "-"}</Text>
                </GridItem>
                
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Stok Sistem</Text>
                  <Text className="font-bold">
                    {item.quantitySystem} {item.productUnit}
                  </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Stok Fisik</Text>
                  <Text className="font-bold">
                    {item.quantityPhysical} {item.productUnit}
                  </Text>
                </GridItem>
                
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Selisih</Text>
                  <Text className={`font-bold ${item.difference < 0 ? 'text-error-500' : 'text-success-500'}`}>
                    {item.difference > 0 ? '+' : ''}{item.difference}
                  </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Impact (Rp)</Text>
                  <Text className={`font-bold ${item.financialImpact < 0 ? 'text-error-500' : 'text-success-500'}`}>
                     {formatMoney(Math.abs(item.financialImpact || 0))}
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
