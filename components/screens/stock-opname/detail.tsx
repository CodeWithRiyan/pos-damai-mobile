import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Box, HStack, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import useBreakpoint from "@/hooks/use-breakpoint";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { _data } from ".";

export default function StockOpnameDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const stockOpnameId = id as string;

  const { sm } = useBreakpoint();
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  // const { data: stockOpname, refetch: refetchStockOpname } = useStockOpname(stockOpnameId || "");
  const stockOpname = _data.find((so) => so.id === stockOpnameId);

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
            <Text className="text-gray-500">Nama Karyawan</Text>
            <Text className="font-bold">{stockOpname?.createdBy}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Tanggal</Text>
            <Text className="font-bold">{stockOpname?.date}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Keterangan</Text>
            <Text className="font-bold">{stockOpname?.note}</Text>
          </VStack>
        </Box>
        <VStack space="md" className="w-full">
          {stockOpname?.products.map((product, index) => (
            <Pressable
              key={index}
              className="px-4 py-2 border-b border-background-300 active:bg-gray-100"
            >
              <Grid _extra={{ className: "grid-cols-3" }} className="gap-y-2">
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Nama Barang</Text>
                  <Text className="font-bold">{product?.name || "-"}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Kode Barang</Text>
                  <Text className="font-bold">{product?.code || "-"}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Tipe Produk</Text>
                  <Text className="font-bold">{product?.type || "-"}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Stok Sistem</Text>
                  <Text className="font-bold">
                    {product?.quantitySystem || "-"}
                  </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Stok Fisik</Text>
                  <Text className="font-bold">
                    {product?.quantityPhysical || "-"}
                  </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text className="text-gray-500">Selisih</Text>
                  <Text className="font-bold">
                    {product?.quantityPhysical - product?.quantitySystem}
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
