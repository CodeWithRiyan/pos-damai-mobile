import Header from "@/components/header";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useFinance } from "@/lib/api/finances";
import { formatDisplayRefId } from "@/lib/utils/reference";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function FinanceTransactionReceipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: finance, isLoading } = useFinance(id || "");

  const profile = useAuthStore((state) => state.profile);

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK TRANSAKSI KEUANGAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!finance) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK TRANSAKSI KEUANGAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data pembelian tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = finance.createdAt ? dayjs(finance.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header header="STRUK TRANSAKSI KEUANGAN" isGoBack />
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
              <Text className="text-typography-500">
                ## Struk Transaksi Keuangan ##
              </Text>
              {finance.status === "DRAFT" && (
                <Text className="text-red-500 font-bold mt-1">(DRAFT)</Text>
              )}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text
                  className={`font-bold ${
                    finance.type === "INCOME"
                      ? "text-success-500"
                      : "text-error-500"
                  }`}
                >
                  {finance.type === "INCOME"
                    ? "Transaksi Masuk"
                    : "Transaksi Keluar"}
                </Text>
                <Text className="text-typography-500">
                  {`Oleh: ${profile?.name || ""}`}
                </Text>
              </HStack>
              {finance.expensesType && (
                <HStack className="justify-between items-center">
                  <Text className="font-bold">{finance.expensesType}</Text>
                </HStack>
              )}
              <HStack className="justify-between items-center mt-2">
                <Text className="text-typography-500">
                  {date.format("DD/MM/YYYY")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">
                  {date.format("HH:mm:ss")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-2">
                <Text className="text-typography-500">
                  Ref: {formatDisplayRefId(finance.local_ref_id) || finance.id}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              <HStack className="justify-between items-center">
                <VStack className="flex-1 mr-2">
                  <Heading size="sm">{finance.note}</Heading>
                  <Text className="text-typography-500 text-sm">
                    {`1 x Rp ${finance.nominal.toLocaleString("id-ID")}`}
                  </Text>
                </VStack>
                <Text className="text-typography-500 font-bold">
                  Rp {finance.nominal.toLocaleString("id-ID")}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">
                  Rp {finance.nominal.toLocaleString("id-ID")}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
