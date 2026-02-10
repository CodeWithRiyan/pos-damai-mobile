import Header from "@/components/header";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { useTransaction } from "@/lib/api/transactions";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function TransactionReceipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id || "");
  const profile = useAuthStore((state) => state.profile);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PENJUALAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!transaction) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PENJUALAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data transaksi tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = transaction.createdAt ? dayjs(transaction.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header header="STRUK PENJUALAN BARANG" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="p-4 flex-1">
          <VStack className="flex-1 bg-background-0 p-6 shadow">
            <VStack className="items-center">
              <Heading size="xl">
                {profile?.selectedOrganization?.name || "Toko Damai"}
              </Heading>
              <Text className="text-typography-500 text-center">
                {profile?.selectedOrganization?.address ||
                  "Pekalongan Timur, Pekalongan"}
              </Text>
              <Text className="text-typography-500">## Struk Penjualan ##</Text>
              {transaction.status === "DRAFT" && (
                <Text className="text-red-500 font-bold mt-1">(DRAFT)</Text>
              )}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">
                  {date.format("DD/MM/YYYY")}
                </Text>
                <Text className="text-typography-500">
                  Admin: {profile?.name || "Admin"}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">
                  {date.format("HH:mm:ss")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Pelanggan: {transaction.customerName}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Ref: {transaction.local_ref_id || transaction.id}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              {transaction.items?.map((item) => (
                <HStack key={item.id} className="justify-between items-center">
                  <VStack className="flex-1 mr-2">
                    <Heading size="sm">{item.productName}{item.variantName ? ` - ${item.variantName}` : ""}</Heading>
                    <Text className="text-typography-500 text-sm">
                      {item.quantity} x Rp{" "}
                      {(item.sellPrice || 0).toLocaleString("id-ID")}
                    </Text>
                  </VStack>
                  <Text className="text-typography-500 font-bold">
                    Rp{" "}
                    {(item.quantity * (item.sellPrice || 0)).toLocaleString(
                      "id-ID",
                    )}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">
                  Rp {transaction.totalAmount.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Metode Pembayaran</Text>
                <Text className="text-typography-500">
                  {transaction.paymentTypeName}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack className="items-center py-2">
              <Text className="text-typography-500">
                Terima kasih atas pembelian Anda
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
