import { HStack, Icon, Pressable, Text, VStack } from "@/components/ui";
import { useCurrentShift, useEndShift } from "@/lib/api/shifts";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { PlusCircle } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function CurrentShift() {
  const router = useRouter();
  const { data: currentShift } = useCurrentShift();
  const endShiftMutation = useEndShift();

  const handleEndShift = () => {
    endShiftMutation.mutate({
      id: currentShift?.id || "",
      finalBalance: currentShift?.initialBalance || 0,
      note: "Shift ditutup",
    });
  };

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
            <Text className="text-typography-600">Penjualan</Text>
            <Text className="font-bold">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pemasukkan Lain</Text>
            <Text className="font-bold">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pelunasan Hutang</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between">
            <Text className="text-typography-600">Pengeluaran Lain</Text>
            <Text className="font-bold text-error-500">Rp 0</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-background-100">
            <Text className="text-typography-600">Subtotal</Text>
            <Text className="font-bold">{`Rp ${(currentShift?.expectedBalance || 0).toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4">
            <HStack space="sm" className="items-center">
              <Icon as={PlusCircle} size="md" />
              <Text className="text-typography-600">Saldo Awal</Text>
            </HStack>
            <Text className="font-bold">{`Rp ${currentShift?.initialBalance.toLocaleString("id")}`}</Text>
          </HStack>
          <HStack className="w-full flex-row justify-between px-4 py-1 rounded-md bg-blue-100">
            <Text className="text-typography-600 font-bold">
              Total pendapatan dari sistem
            </Text>
            <Text className="font-bold">{`Rp ${(currentShift?.finalBalance || 0).toLocaleString("id")}`}</Text>
          </HStack>
        </VStack>
      </ScrollView>
      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => router.push("/(main)/transaction")}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            MASUK KE MENU TRANSAKSI
          </Text>
        </Pressable>
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-error-100 border border-error-500"
          onPress={handleEndShift}
        >
          <Text size="sm" className="text-error-500 font-bold">
            AKHIRI SHIFT
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
