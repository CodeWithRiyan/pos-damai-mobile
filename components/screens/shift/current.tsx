import { HStack, Icon, Pressable, Text, VStack } from "@/components/ui";
import { useCurrentShift } from "@/lib/api/shifts";
import { formatRp } from "@/lib/utils/format";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { PlusCircle } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";
import CashDepositForm from "./form-cash-deposit";
import EndShiftForm from "./form-end-shift";

export default function CurrentShift() {
  const router = useRouter();
  const { data: currentShift } = useCurrentShift();
  const [openEndShift, setOpenEndShift] = useState(false);
  const [openCashDeposit, setOpenCashDeposit] = useState(false);

  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="sm" className="p-4 border-b border-background-300">
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Nama Karyawan</Text>
            <Text className="font-bold">{currentShift?.userName}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Cashdrawer</Text>
            <Text className="font-bold">{currentShift?.cashDrawerName}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Shift Mulai</Text>
            <Text className="font-bold">
              {dayjs(currentShift?.startTime).format("DD-MM-YYYY HH:mm:ss")}
            </Text>
          </HStack>
        </VStack>
        <VStack space="sm" className="px-8 py-4">
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Transaksi Penjualan</Text>
            <Text className="font-bold">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pemasukkan</Text>
            <Text className="font-bold">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pembayaran Hutang</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Beli Barang</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Perlengkapan</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Peralatan</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Setor Tunai</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-background-100">
            <Text className="text-typography-600">Subtotal</Text>
            <Text className="font-bold">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4">
            <HStack space="sm" className="items-center">
              <Icon as={PlusCircle} size="md" />
              <Text className="text-typography-600">Saldo Awal</Text>
            </HStack>
            <Text className="font-bold">
              {formatRp(currentShift?.initialBalance ?? 0)}
            </Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-blue-100">
            <Text className="text-typography-600 font-bold">
              Total pendapatan dari sistem
            </Text>
            <Text className="font-bold">
              {formatRp(currentShift?.initialBalance ?? 0)}
            </Text>
          </HStack>
        </VStack>
      </ScrollView>
      <VStack space="md" className="w-full p-4">
        <HStack space="md">
          <Pressable
            className="flex-1 rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
            onPress={() => router.push("/(main)/transaction")}
          >
            <Text size="sm" className="text-typography-0 font-bold">
              MASUK KE MENU TRANSAKSI
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-sm h-10 flex justify-center items-center bg-primary-100 border border-primary-500"
            onPress={() => setOpenCashDeposit(true)}
          >
            <Text size="sm" className="text-primary-500 font-bold">
              SETOR TUNAI
            </Text>
          </Pressable>
        </HStack>
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-error-100 border border-error-500"
          onPress={() => setOpenEndShift(true)}
        >
          <Text size="sm" className="text-error-500 font-bold">
            AKHIRI SHIFT
          </Text>
        </Pressable>
      </VStack>
      <EndShiftForm open={openEndShift} setOpen={setOpenEndShift} />
      <CashDepositForm open={openCashDeposit} setOpen={setOpenCashDeposit} />
    </VStack>
  );
}
