import {
  Button,
  ButtonText,
  Heading,
  HStack,
  Text,
  VStack,
  Input,
  InputField,
} from "@/components/ui";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Shift, useEndShift, useShiftDetail } from "@/lib/api/shifts";
import dayjs from "dayjs";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";

interface ActiveShiftDisplayProps {
  shift: Shift;
}

export default function ActiveShiftDisplay({ shift }: ActiveShiftDisplayProps) {
  const router = useRouter();
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [finalBalance, setFinalBalance] = useState<string>(shift.initialBalance.toString());
  const [note, setNote] = useState<string>("Shift ditutup");
  
  const { data: detail, isLoading } = useShiftDetail(shift.id);
  const endShiftMutation = useEndShift();

  const totals = useMemo(() => {
    if (!detail?.transactionHistory) return { in: 0, out: 0 };
    
    return detail.transactionHistory.reduce((acc, trx) => {
      if (trx.type === "INITIAL") return acc;
      
      if (trx.type === "SALES" || trx.type === "INCOME") {
        acc.in += trx.nominal;
      } else if (trx.type === "PURCHASES" || trx.type === "EXPENSES") {
        acc.out += trx.nominal;
      }
      return acc;
    }, { in: 0, out: 0 });
  }, [detail]);

  const currentBalance = shift.initialBalance + totals.in - totals.out;

  const handleEndShift = () => {
    endShiftMutation.mutate({
      id: shift.id,
      finalBalance: parseFloat(finalBalance) || 0,
      note: note,
    }, {
      onSuccess: () => {
        setShowEndShiftModal(false);
      },
    });
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white items-center justify-center">
        <Spinner size="large" />
        <Text className="mt-2 text-typography-500">Memuat data shift...</Text>
      </VStack>
    );
  }

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
              <HStack className="justify-between py-2 border-b border-gray-100">
                <Text className="text-typography-500">Total Masuk</Text>
                <Text className="text-success-600 font-medium">
                  Rp {totals.in.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between py-2 border-b border-gray-100">
                <Text className="text-typography-500">Total Keluar</Text>
                <Text className="text-error-600 font-medium">
                  Rp {totals.out.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between py-3 bg-primary-50 rounded px-2 mt-2">
                <Text className="text-typography-900 font-semibold">
                  Saldo Saat Ini
                </Text>
                <Text className="text-primary-600 font-bold text-lg">
                  Rp {currentBalance.toLocaleString("id-ID")}
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
      <VStack className="p-4 gap-2">
        <Button
          size="md"
          className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
          onPress={() => router.push("/(main)/transaction")}
        >
          <ButtonText className="text-white font-bold uppercase">
            Masuk Ke Menu Transaksi
          </ButtonText>
        </Button>
        <Button
          size="md"
          variant="outline"
          className="w-full rounded-sm border-error-500 active:bg-error-50"
          onPress={() => setShowEndShiftModal(true)}
        >
          <ButtonText className="text-error-500 font-bold uppercase">
            Tutup Shift
          </ButtonText>
        </Button>
      </VStack>

      {/* End Shift Modal */}
      <Modal
        isOpen={showEndShiftModal}
        onClose={() => setShowEndShiftModal(false)}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">Tutup Shift</Heading>
          </ModalHeader>
          <ModalBody>
            <VStack space="md" className="py-4">
              <Text className="text-typography-500">
                Masukkan saldo akhir uang tunai yang ada di laci kasir (cash drawer).
              </Text>
              
              <VStack space="xs">
                <Text className="text-typography-900 font-bold">Saldo Akhir</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="0"
                    keyboardType="numeric"
                    value={finalBalance}
                    onChangeText={setFinalBalance}
                  />
                </Input>
                <HStack className="justify-between">
                   <Text className="text-xs text-typography-500">Saldo Seharusnya:</Text>
                   <Text className="text-xs font-bold">Rp {currentBalance.toLocaleString("id-ID")}</Text>
                </HStack>
              </VStack>

              <VStack space="xs">
                <Text className="text-typography-900 font-bold">Catatan</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="Contoh: Aman terkendali"
                    value={note}
                    onChangeText={setNote}
                  />
                </Input>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              action="secondary"
              onPress={() => setShowEndShiftModal(false)}
              className="mr-2"
            >
              <ButtonText>BATAL</ButtonText>
            </Button>
            <Button
              size="sm"
              action="negative"
              onPress={handleEndShift}
              disabled={endShiftMutation.isPending}
            >
              <ButtonText>
                {endShiftMutation.isPending ? "MEMPROSES..." : "KONFIRMASI TUTUP SHIFT"}
              </ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
