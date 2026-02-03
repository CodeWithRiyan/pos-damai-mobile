import {
  Button,
  ButtonText,
  Heading,
  HStack,
  Text,
  VStack,
} from "@/components/ui";
import { Shift, useEndShift } from "@/lib/api/shifts";
import dayjs from "dayjs";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";

interface ActiveShiftDisplayProps {
  shift: Shift;
}

export default function ActiveShiftDisplay({ shift }: ActiveShiftDisplayProps) {
  const router = useRouter();
  const endShiftMutation = useEndShift();

  const handleEndShift = () => {
    // For now, just end with the initial balance
    // TODO: Add proper final balance input dialog
    endShiftMutation.mutate({
      id: shift.id,
      finalBalance: shift.initialBalance,
      note: "Shift ditutup",
    }, {
      onSuccess: () => {
        // Stay on this screen, it will show the start shift form
      },
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* Cashdrawer Info Card */}
          <VStack space="sm" className="p-4 bg-gray-50 rounded-lg">
            <Heading size="sm" className="text-typography-900">
              Shift Aktif
            </Heading>
            <VStack space="xs">
              <HStack className="justify-between">
                <Text className="text-typography-500">Cashdrawer</Text>
                <Text className="text-typography-900 font-semibold">
                  {shift.cashDrawerName}
                </Text>
              </HStack>
              <HStack className="justify-between">
                <Text className="text-typography-500">Dimulai</Text>
                <Text className="text-typography-900">
                  {dayjs(shift.startTime).format("DD/MM/YYYY HH:mm")}
                </Text>
              </HStack>
              <HStack className="justify-between">
                <Text className="text-typography-500">Kasir</Text>
                <Text className="text-typography-900">
                  {shift.userName}
                </Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Balance Information */}
          <VStack space="sm" className="p-4 bg-white border border-gray-200 rounded-lg">
            <Heading size="sm" className="text-typography-900">
              Informasi Saldo
            </Heading>
            <VStack space="xs">
              <HStack className="justify-between py-2 border-b border-gray-100">
                <Text className="text-typography-500">Saldo Awal</Text>
                <Text className="text-typography-900 font-medium">
                  Rp {shift.initialBalance.toLocaleString("id-ID")}
                </Text>
              </HStack>
              {/* TODO: Add transaction totals */}
              <HStack className="justify-between py-2 border-b border-gray-100">
                <Text className="text-typography-500">Total Masuk</Text>
                <Text className="text-success-600 font-medium">
                  Rp 0
                </Text>
              </HStack>
              <HStack className="justify-between py-2 border-b border-gray-100">
                <Text className="text-typography-500">Total Keluar</Text>
                <Text className="text-error-600 font-medium">
                  Rp 0
                </Text>
              </HStack>
              <HStack className="justify-between py-3 bg-primary-50 rounded px-2 mt-2">
                <Text className="text-typography-900 font-semibold">
                  Saldo Saat Ini
                </Text>
                <Text className="text-primary-600 font-bold text-lg">
                  Rp {shift.initialBalance.toLocaleString("id-ID")}
                </Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Note */}
          {shift.note && (
            <VStack space="xs" className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-typography-500 text-sm">Catatan:</Text>
              <Text className="text-typography-900">{shift.note}</Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>

      {/* End Shift Button */}
      <HStack className="w-full p-4 gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-sm bg-brand-primary active:bg-brand-primary/90"
          onPress={() => router.push("/(main)")}
        >
          <ButtonText className="text-white font-bold">
            MASUK KE MENU TRANSAKSI
          </ButtonText>
        </Button>
        <Button
          size="sm"
          className="flex-1 rounded-sm bg-error-500 active:bg-error-600"
          onPress={handleEndShift}
          disabled={endShiftMutation.isPending}
        >
          <ButtonText className="text-white">
            {endShiftMutation.isPending ? "MENUTUP SHIFT..." : "TUTUP SHIFT"}
          </ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
}
