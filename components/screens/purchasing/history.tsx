import Header from "@/components/header";
import { Heading, HStack, Pressable, Text, VStack } from "@/components/ui";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function PurchasingHistory() {
  const router = useRouter();
  return (
    <VStack className="flex-1 bg-white">
      <Header header="HISTORI PEMBELIAN" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Pressable
          className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
          onPress={() => router.navigate("/(main)/purchasing/receipt")}
        >
          <HStack space="xl" className="items-center">
            <VStack>
              <Text className="text-typography-500 font-bold">07:30:01</Text>
              <HStack space="sm" className="items-center">
                <Heading size="4xl">20</Heading>
                <VStack>
                  <Text className="text-typography-500 font-bold">Jan</Text>
                  <Text className="text-typography-500 font-bold">2026</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack space="sm" className="flex-1">
              <HStack className="justify-between">
                <VStack>
                  <Text className="text-typography-400 text-xs">
                    Pengeluaran
                  </Text>
                  <Text className="font-bold">Rp 20.000</Text>
                </VStack>
                <VStack>
                  <Text className="text-typography-400 text-xs">Supplier</Text>
                  <Text className="font-bold">Eko</Text>
                </VStack>
                <VStack />
              </HStack>
              <HStack className="justify-between">
                <Text className="text-typography-400 font-bold">
                  No: 260958520260120070459
                </Text>
              </HStack>
            </VStack>
            <Text className="text-typography-400 text-lg">›</Text>
          </HStack>
        </Pressable>
      </ScrollView>
    </VStack>
  );
}
