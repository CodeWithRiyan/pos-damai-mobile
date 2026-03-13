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
import { Spinner } from "@/components/ui/spinner";
import { useTransactionReturns } from "@/lib/api/return-transaction";
import { formatDisplayRefId } from "@/lib/utils/reference";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function ReturnTransactionHistory({
  isReport,
}: {
  isReport?: boolean;
}) {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const { data: returns, isLoading } = useTransactionReturns({ customerId });

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={
          isReport
            ? "LAPORAN RETUR TRANSAKSI PENJUALAN"
            : "RIWAYAT RETUR TRANSAKSI PENJUALAN"
        }
        isGoBack
      />
      <VStack space="sm" className="p-4 shadow-lg bg-background-0">
        <Input className="border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            placeholder={`Cari no transaksi${!customerId ? " atau nama customer" : ""}`}
          />
        </Input>
      </VStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <VStack className="items-center py-10">
            <Spinner />
          </VStack>
        ) : !returns?.length ? (
          <VStack className="items-center py-10">
            <Text className="text-typography-400">Belum ada riwayat retur</Text>
          </VStack>
        ) : (
          returns.map((ret: any) => {
            const date = dayjs(ret.createdAt);
            return (
              <Pressable
                key={ret.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.push(
                    `/(main)/management/return/transaction/receipt/${ret.id}`,
                  )
                }
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">
                      {date.format("HH:mm:ss")}
                    </Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.date()}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">
                          {date.format("MMM")}
                        </Text>
                        <Text className="text-typography-500 font-bold">
                          {date.year()}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack className="justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Jumlah Retur
                        </Text>
                        <Text className="font-bold">
                          Rp {ret.totalAmount.toLocaleString("id-ID")}
                        </Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Customer
                        </Text>
                        <Text className="font-bold">{ret.customerName}</Text>
                      </VStack>
                      <VStack />
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">
                        No: {formatDisplayRefId(ret.local_ref_id)}
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
