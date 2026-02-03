import Header from "@/components/header";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { usePurchase } from "@/lib/api/purchasing";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function PurchasingReceipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: purchase, isLoading } = usePurchase(id || "");
  const profile = useAuthStore((state) => state.profile);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PEMBELIAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!purchase) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PEMBELIAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data pembelian tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = purchase.createdAt ? dayjs(purchase.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header header="STRUK PEMBELIAN BARANG" isGoBack />
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
              <Text className="text-typography-500">## Struk Pembelian ##</Text>
              {purchase.status === "DRAFT" && (
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
                  Supplier: {purchase.supplierName}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Ref: {purchase.local_ref_id || purchase.id}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              {purchase.items?.map((item) => (
                <HStack key={item.id} className="justify-between items-center">
                  <VStack className="flex-1 mr-2">
                    <Heading size="sm">{item.productName}</Heading>
                    <Text className="text-typography-500 text-sm">
                      {item.quantity} x Rp{" "}
                      {(item.purchasePrice || 0).toLocaleString("id-ID")}
                    </Text>
                  </VStack>
                  <Text className="text-typography-500 font-bold">
                    Rp{" "}
                    {(item.quantity * (item.purchasePrice || 0)).toLocaleString(
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
                  Rp {purchase.totalAmount.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Tipe Pembayaran</Text>
                <Text className="text-typography-500">
                  {purchase.paymentType === "CASH" ? "Tunai" : "Hutang"}
                </Text>
              </HStack>
              {purchase.paymentType === "DEBT" && purchase.dueDate && (
                <HStack className="justify-between items-center">
                  <Text className="text-typography-500">Jatuh Tempo</Text>
                  <Text className="text-typography-500">
                    {dayjs(purchase.dueDate).format("DD/MM/YYYY")}
                  </Text>
                </HStack>
              )}
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
