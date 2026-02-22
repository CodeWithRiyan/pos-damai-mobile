import Header from "@/components/header";
import {
  Heading,
  HStack,
  Icon,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { CalendarIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";
import { useFinances } from "@/lib/api/finances";
import { formatDisplayRefId } from "@/lib/utils/reference";

export default function FinanceHistory() {
  const router = useRouter();
  const [showTransactionDatePicker, setShowTransactionDatePicker] =
    useState<boolean>(false);
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);

  const { data, isLoading } = useFinances();
  const finance = data?.filter((f) => f.status === "COMPLETED") || [];

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="HISTORI TANSAKSI KEUANGAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="HISTORI TANSAKSI KEUANGAN" isGoBack />
      <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
        <Input className="flex-1 border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField placeholder="Cari no transaksi" />
        </Input>
        <>
          <Pressable
            onPress={() => setShowTransactionDatePicker(true)}
            className={`flex-1 border border-background-300 px-3 h-10 rounded-lg justify-center`}
          >
            <HStack className="items-center justify-between">
              <Text>
                {transactionDate instanceof Date
                  ? dayjs(transactionDate).format("DD/MM/YYYY")
                  : "Pilih tanggal transaksi"}
              </Text>
              <Icon as={CalendarIcon} size="md" className="mr-2" />
            </HStack>
          </Pressable>
          {showTransactionDatePicker && (
            <DateTimePicker
              mode="date"
              value={
                transactionDate instanceof Date ? transactionDate : new Date()
              }
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowTransactionDatePicker(false);
                if (event.type === "set" && selectedDate) {
                  setTransactionDate(selectedDate);
                }
              }}
            />
          )}
        </>
      </HStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!finance || finance.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">
              Belum ada histori transaksi keuangan
            </Text>
          </Box>
        ) : (
          finance.map((purchase) => {
            const date = purchase.createdAt
              ? dayjs(purchase.createdAt)
              : dayjs();
            return (
              <Pressable
                key={purchase.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.navigate({
                    pathname: "/(main)/finance/receipt/[id]",
                    params: { id: purchase.id },
                  })
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
                    <HStack className="w-1/2 justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Jenis Transaksi
                        </Text>
                        <Text
                          className={`font-bold ${purchase.type === "INCOME" ? "text-success-500" : "text-error-500"}`}
                        >
                          {purchase.type === "INCOME"
                            ? "Pemasukkan"
                            : "Pengeluaran"}
                        </Text>
                      </VStack>
                      {purchase.expensesType && (
                        <VStack>
                          <Text className="text-typography-400 text-xs">
                            Jenis Pengeluaran
                          </Text>
                          <Text className="font-bold">
                            {purchase.expensesType}
                          </Text>
                        </VStack>
                      )}
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">
                        No: {formatDisplayRefId(purchase.local_ref_id) || purchase.id}
                      </Text>
                    </HStack>
                  </VStack>
                  <HStack space="xl" className="items-center">
                    <VStack>
                      <Text className="text-typography-400 text-xs">
                        Total Transaksi
                      </Text>
                      <Text className="font-bold">
                        Rp {purchase.nominal.toLocaleString("id-ID")}
                      </Text>
                    </VStack>
                    <Text className="text-typography-400 text-lg">›</Text>
                  </HStack>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
