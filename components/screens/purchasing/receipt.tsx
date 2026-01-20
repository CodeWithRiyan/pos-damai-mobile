import Header from "@/components/header";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { ScrollView } from "react-native";

export default function PurchasingReceipt() {
  return (
    <VStack className="flex-1 bg-primary-200">
      <Header header="STRUK PEMBELIAN" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="p-4 flex-1">
          <VStack className="flex-1 bg-background-0 p-6 shadow">
            <VStack className="items-center">
              <Heading size="xl">Toko Damai</Heading>
              <Text className="text-typography-500 text-sm">
                Pekalongan Timur, Pekalongan
              </Text>
              <Text className="text-typography-500 text-sm">
                ## Struk Pembelian ##
              </Text>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500 text-sm">20/01/2026</Text>
                <Text className="text-typography-500 text-sm">
                  Admin: John Doe
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500 text-sm">07:30:01</Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <VStack>
                  <Heading size="md">Pepsodent</Heading>
                  <Text className="text-typography-500 text-sm">
                    2 x Rp 10.000
                  </Text>
                </VStack>
                <Text className="text-typography-500 text-sm">Rp 20.000</Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total</Text>
                <Text className="text-typography-500 text-sm">Rp 20.000</Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500 text-sm">
                  Bayar (Cash)
                </Text>
                <Text className="text-typography-500 text-sm">Rp 20.000</Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500 text-sm">Kembalian</Text>
                <Text className="text-typography-500 text-sm">Rp 0</Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
