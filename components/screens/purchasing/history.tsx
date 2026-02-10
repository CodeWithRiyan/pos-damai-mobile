import Header from "@/components/header";
import {
  Heading,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { usePurchases } from "@/lib/api/purchasing";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function PurchasingHistory({
  isReport,
}: {
  isReport?: boolean;
}) {
  const header = isReport ? "LAPORAN PEMBELIAN" : "RIWAYAT PEMBELIAN";
  const router = useRouter();
  const { data: allPurchases, isLoading } = usePurchases();
  const purchases = allPurchases?.filter((p) => p.status === "COMPLETED") || [];

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header={header} isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header={header} isGoBack />
      <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
        <Input className="flex-1 border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField placeholder="Cari no transaksi atau nama supplier" />
        </Input>
      </HStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!purchases || purchases.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Belum ada histori pembelian</Text>
          </Box>
        ) : (
          purchases.map((purchase) => {
            const date = purchase.createdAt
              ? dayjs(purchase.createdAt)
              : dayjs();
            return (
              <Pressable
                key={purchase.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.navigate(`/(main)/purchasing/receipt/${purchase.id}`)
                }
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">
                      {date.format("HH:mm:ss")}
                    </Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.format("DD")}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">
                          {date.format("MMM")}
                        </Text>
                        <Text className="text-typography-500 font-bold">
                          {date.format("YYYY")}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack className="justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Pengeluaran
                        </Text>
                        <Text className="font-bold">
                          Rp {purchase.totalAmount.toLocaleString("id-ID")}
                        </Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Supplier
                        </Text>
                        <Text className="font-bold">
                          {purchase.supplierName}
                        </Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Tipe
                        </Text>
                        <Text className="font-bold">
                          {purchase.paymentType === "CASH" ? "Tunai" : "Hutang"}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">
                        No: {purchase.local_ref_id || purchase.id}
                      </Text>
                    </HStack>
                  </VStack>
                  <Text className="text-typography-400 text-lg">›</Text>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
