import { HStack, Pressable, Text, VStack } from "@/components/ui";
import { ScrollView } from "react-native";

export default function HistoryShift() {
  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Pressable
          className="flex-row items-center gap-4 p-4 bg--white active:bg-gray-50"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <VStack space="md" className="flex-1">
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Kasir</Text>
                <Text>John Doe</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Mulai</Text>
                <Text>27-12-2025 13:48</Text>
              </VStack>
            </HStack>
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Catatan</Text>
                <Text>Aman Terkendali</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Berakhir</Text>
                <Text>27-12-2025 21:56</Text>
              </VStack>
            </HStack>
          </VStack>
          <Text className="text-gray-400 text-lg">›</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-4 p-4 bg--white active:bg-gray-50"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <VStack space="md" className="flex-1">
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Kasir</Text>
                <Text>John Doe</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Mulai</Text>
                <Text>27-12-2025 13:48</Text>
              </VStack>
            </HStack>
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Catatan</Text>
                <Text>Aman Terkendali</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Berakhir</Text>
                <Text>27-12-2025 21:56</Text>
              </VStack>
            </HStack>
          </VStack>
          <Text className="text-gray-400 text-lg">›</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-4 p-4 bg--white active:bg-gray-50"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <VStack space="md" className="flex-1">
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Kasir</Text>
                <Text>John Doe</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Mulai</Text>
                <Text>27-12-2025 13:48</Text>
              </VStack>
            </HStack>
            <HStack className="flex-1">
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Catatan</Text>
                <Text>Aman Terkendali</Text>
              </VStack>
              <VStack className="w-1/2">
                <Text className="text-gray-500 font-bold">Berakhir</Text>
                <Text>27-12-2025 21:56</Text>
              </VStack>
            </HStack>
          </VStack>
          <Text className="text-gray-400 text-lg">›</Text>
        </Pressable>
      </ScrollView>
    </VStack>
  );
}
