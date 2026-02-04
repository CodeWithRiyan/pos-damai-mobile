import { HStack, Pressable, Text, VStack } from "@/components/ui";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

export interface ShiftTransactionHistory {
  id: string;
  transactionId: string | null;
  ref: string | null;
  transactionDate: string;
  type: "INITIAL" | "SALES" | "INCOME" | "PURCHASES" | "EXPENSES";
  nominal: number;
  note: string;
}

export interface HistoryShiftProps {
  id: string;
  note: string;
  startShift: string;
  endShift: string;
  cashier: string;
  transactionHistory: ShiftTransactionHistory[];
}

export const dummyData: HistoryShiftProps[] = [
  {
    id: "1",
    note: "Aman Terkendali",
    startShift: "27-12-2025 06:56",
    endShift: "27-12-2025 15:48",
    cashier: "Jane Doe",
    transactionHistory: [
      {
        id: "1",
        transactionId: null,
        ref: null,
        nominal: 100000,
        type: "INITIAL",
        transactionDate: "27-12-2025 06:56",
        note: "Saldo Awal", // TODO: `Saldo Awal`
      },
      {
        id: "2",
        transactionId: "1",
        ref: "1",
        nominal: 55000,
        type: "SALES",
        transactionDate: "27-12-2025 06:56",
        note: "Transaksi Penjualan (1)", // TODO: `Transaksi Penjualan (${ref})`
      },
      {
        id: "3",
        transactionId: "1",
        ref: "1",
        nominal: 100000,
        type: "INCOME",
        transactionDate: "27-12-2025 06:56",
        note: "Bagi hasil parkir", // TODO: get from finance.note
      },
      {
        id: "4",
        transactionId: "2",
        ref: "2",
        nominal: 500000,
        type: "EXPENSES",
        transactionDate: "27-12-2025 06:56",
        note: "Beli rak display", // TODO: get from finance.note
      },
    ],
  },
  {
    id: "2",
    note: "Aman Terkendali",
    startShift: "27-12-2025 13:48",
    endShift: "27-12-2025 21:56",
    cashier: "John Doe",
    transactionHistory: [],
  },
];
export default function HistoryShift() {
  const router = useRouter();

  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack className="flex-1">
          {dummyData.map((item) => (
            <Pressable
              key={item.id}
              className="flex-row items-center gap-4 p-4 bg--white active:bg-gray-50"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "rgba(0, 0, 0, 0.1)",
              }}
              onPress={() => {
                router.push(`/shift/detail-history/${item.id}`);
              }}
            >
              <VStack space="md" className="flex-1">
                <HStack className="flex-1">
                  <VStack className="w-1/2">
                    <Text className="text-gray-500 font-bold">Kasir</Text>
                    <Text>{item.cashier}</Text>
                  </VStack>
                  <VStack className="w-1/2">
                    <Text className="text-gray-500 font-bold">Mulai</Text>
                    <Text>{item.startShift}</Text>
                  </VStack>
                </HStack>
                <HStack className="flex-1">
                  <VStack className="w-1/2">
                    <Text className="text-gray-500 font-bold">Catatan</Text>
                    <Text>{item.note}</Text>
                  </VStack>
                  <VStack className="w-1/2">
                    <Text className="text-gray-500 font-bold">Berakhir</Text>
                    <Text>{item.endShift}</Text>
                  </VStack>
                </HStack>
              </VStack>
              <Text className="text-gray-400 text-lg">›</Text>
            </Pressable>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
