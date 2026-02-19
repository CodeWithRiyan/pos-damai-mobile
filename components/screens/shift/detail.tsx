import Header from "@/components/header";
import { HStack, Icon, Pressable, Text, VStack } from "@/components/ui";
import { useShiftDetail } from "@/lib/api/shifts";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PlusCircle } from "lucide-react-native";
import { useMemo } from "react";
import { ScrollView } from "react-native";

export default function ShiftDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data: detailShift } = useShiftDetail(id || "");
  const totals = useMemo(() => {
    if (!detailShift?.transactionHistory)
      return {
        sales: 0,
        purchases: 0,
        income: 0,
        expenses: 0,
        finalBalance: 0,
      };

    return detailShift.transactionHistory.reduce(
      (acc, trx) => {
        if (trx.type === "INITIAL") return acc;

        if (trx.type === "SALES") {
          acc.sales += trx.nominal;
        } else if (trx.type === "PURCHASES") {
          acc.purchases += trx.nominal;
        } else if (trx.type === "INCOME") {
          acc.income += trx.nominal;
        } else if (trx.type === "EXPENSES") {
          acc.expenses += trx.nominal;
        }

        acc.finalBalance =
          acc.sales + acc.purchases + acc.income - acc.expenses;
        return acc;
      },
      { sales: 0, purchases: 0, income: 0, expenses: 0, finalBalance: 0 },
    );
  }, [detailShift]);

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DETAIL SHIFT" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="sm" className="p-4 border-b border-background-300">
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Nama Karyawan</Text>
            <Text className="font-bold">{detailShift?.cashier}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Cashdrawer</Text>
            {/* TODO: replace with cashdrawer name */}
            <Text className="font-bold">Laci 1</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Shift Mulai</Text>
            <Text className="font-bold">
              {dayjs(detailShift?.startShift).format("DD-MM-YYYY HH:mm:ss")}
            </Text>
          </HStack>
        </VStack>
        <VStack space="sm" className="p-4 border-b border-background-300">
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Penjualan</Text>
            <Text className="font-bold">{`Rp ${totals.sales.toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pemasukkan Lain</Text>
            <Text className="font-bold">{`Rp ${totals.income.toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pengeluaran Lain</Text>
            <Text className="font-bold text-error-500">{`Rp ${totals.expenses.toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-background-100">
            <Text className="text-typography-600">Subtotal</Text>
            <Text className="font-bold">{`Rp ${(totals.finalBalance - (detailShift?.initialBalance || 0)).toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4">
            <HStack space="sm" className="items-center">
              <Icon as={PlusCircle} size="md" />
              <Text className="text-typography-600">Saldo Awal</Text>
            </HStack>
            <Text className="font-bold">{`Rp ${detailShift?.initialBalance.toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-success-100">
            <Text className="text-typography-600 font-bold">
              Penerimaan Sistem
            </Text>
            <Text className="font-bold">{`Rp ${(detailShift?.finalBalance || 0).toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-warning-100">
            <Text className="text-typography-600 font-bold">
              Penerimaan Aktual
            </Text>
            <Text className="font-bold">{`Rp ${(detailShift?.actualBalance || 0).toLocaleString("id")}`}</Text>
          </HStack>
        </VStack>
        <VStack space="sm" className="p-4">
          <Text className="text-typography-600">Catatan</Text>
          {/* TODO: tambahkan catatan */}
          <Text className="font-bold">{detailShift?.note}</Text>
        </VStack>
      </ScrollView>
      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => router.navigate(`/(main)/shift/detail/${id}/recap`)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            LIHAT REKAP
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
