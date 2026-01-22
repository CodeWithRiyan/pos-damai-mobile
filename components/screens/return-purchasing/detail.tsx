import Header from "@/components/header";
import {
  Heading,
  HStack,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { usePurchaseReturn } from "@/lib/api/return-purchasing";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import dayjs from "dayjs";

export default function ReturnPurchasingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: returnData, isLoading } = usePurchaseReturn(id || "");

  if (isLoading) {
    return (
      <Box className="flex-1 bg-white">
        <Header header="DETAIL RETUR" isGoBack />
        <VStack className="flex-1 items-center justify-center">
          <Spinner />
        </VStack>
      </Box>
    );
  }

  if (!returnData) {
    return (
      <Box className="flex-1 bg-white">
        <Header header="DETAIL RETUR" isGoBack />
        <VStack className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Data retur tidak ditemukan</Text>
        </VStack>
      </Box>
    );
  }

  const date = dayjs(returnData.createdAt);

  return (
    <Box className="flex-1 bg-white">
      <Header header="DETAIL RETUR" isGoBack />
      <ScrollView className="flex-1">
        <VStack className="p-4" space="lg">
          {/* Header Info */}
          <VStack className="bg-primary-50 p-4 rounded-lg" space="sm">
            <HStack className="justify-between">
              <Text className="text-gray-500">No Transaksi</Text>
              <Text className="font-bold">{returnData.local_ref_id}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text className="text-gray-500">Tanggal</Text>
              <Text className="font-bold">{date.format("DD MMM YYYY HH:mm")}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text className="text-gray-500">Supplier</Text>
              <Text className="font-bold">{returnData.supplierName || "-"}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text className="text-gray-500">Tipe Retur</Text>
              <Text className="font-bold">
                {returnData.returnType === "CASH" ? "Uang" : "Tukar Barang"}
              </Text>
            </HStack>
          </VStack>

          {/* Items */}
          <VStack space="md">
            <Heading size="md">Item Retur</Heading>
            {returnData.items?.length ? (
              returnData.items.map((item: any, index: number) => (
                <HStack
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg justify-between items-center"
                >
                  <VStack className="flex-1">
                    <Text className="font-bold">{item.productName || "Unknown"}</Text>
                    <Text className="text-gray-500 text-sm">
                      Rp {item.purchasePrice?.toLocaleString("id-ID") || 0} x {item.quantity}
                    </Text>
                  </VStack>
                  <Text className="font-bold">
                    Rp {((item.purchasePrice || 0) * (item.quantity || 0)).toLocaleString("id-ID")}
                  </Text>
                </HStack>
              ))
            ) : (
              <Text className="text-gray-400">Tidak ada item</Text>
            )}
          </VStack>

          {/* Total */}
          <HStack className="bg-primary-500 p-4 rounded-lg justify-between">
            <Heading size="md" className="text-white">
              Total Retur
            </Heading>
            <Heading size="md" className="text-white">
              Rp {returnData.totalAmount?.toLocaleString("id-ID") || 0}
            </Heading>
          </HStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
