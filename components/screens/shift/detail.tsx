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
        income: 0,
        payableRealization: 0,
        supplies: 0,
        equipment1: 0,
        equipment2: 0,
        cashDeposit: 0,
        otherExpenses: 0,
        finalBalance: 0,
      };

    return detailShift.transactionHistory.reduce(
      (acc, trx) => {
        if (trx.type === "INITIAL") return acc;

        if (trx.type === "SALES") {
          acc.sales += trx.nominal;
        } else if (trx.type === "INCOME") {
          acc.income += trx.nominal;
        } else if (trx.type === "PAYABLE_REALIZATION") {
          acc.payableRealization += trx.nominal;
        } else if (trx.type === "SUPPLIES") {
          acc.supplies += trx.nominal;
        } else if (
          trx.type === "EQUIPMENT" &&
          trx.note.includes("Perlengkapan:")
        ) {
          acc.equipment1 += trx.nominal;
        } else if (
          trx.type === "EQUIPMENT" &&
          trx.note.includes("Peralatan:")
        ) {
          acc.equipment2 += trx.nominal;
        } else if (trx.type === "CASH_DEPOSIT") {
          acc.cashDeposit += trx.nominal;
        } else if (trx.type === "OTHER_EXPENSES") {
          acc.otherExpenses += trx.nominal;
        }

        acc.finalBalance =
          acc.sales +
          acc.income -
          acc.payableRealization -
          acc.supplies -
          acc.equipment1 -
          acc.equipment2 -
          acc.cashDeposit -
          acc.otherExpenses;
        return acc;
      },
      {
        sales: 0,
        income: 0,
        payableRealization: 0,
        supplies: 0,
        equipment1: 0,
        equipment2: 0,
        cashDeposit: 0,
        otherExpenses: 0,
        finalBalance: 0,
      },
    );
  }, [detailShift]);

  console.log("totals", totals);
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
            <Text className="font-bold">{detailShift?.cashDrawer}</Text>
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
            <Text className="text-typography-600">Transaksi Penjualan</Text>
            <Text className="font-bold">{`Rp ${totals.sales.toLocaleString("id")}`}</Text>
          </HStack>
          {!!totals.income && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Pemasukkan</Text>
              <Text className="font-bold">{`Rp ${totals.income.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.payableRealization && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Pembayaran Hutang</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.payableRealization.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.supplies && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Beli Barang</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.supplies.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.equipment1 && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Perlengkapan</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.equipment1.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.equipment2 && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Peralatan</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.equipment2.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.cashDeposit && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Setor Tunai</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.cashDeposit.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          {!!totals.otherExpenses && (
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-600">Pengeluaran Lainnya</Text>
              <Text className="font-bold text-error-500">{`Rp ${totals.otherExpenses.toLocaleString("id")}`}</Text>
            </HStack>
          )}
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-background-100">
            <Text className="text-typography-600">Subtotal</Text>
            <Text className="font-bold">{`Rp ${totals.finalBalance.toLocaleString("id")}`}</Text>
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
            <Text className="font-bold">{`Rp ${totals.finalBalance.toLocaleString("id")}`}</Text>
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
          <Text className="font-bold">{detailShift?.note}</Text>
        </VStack>
      </ScrollView>
      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
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
