import { Box, Heading, HStack, Icon, Text, VStack } from "@/components/ui";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { useTransactionReturn } from "@/lib/api/return-transaction";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Printer } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function ReturnTransactionSuccess() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: returnData } = useTransactionReturn(id || "");
  const totalAmount = returnData?.items.reduce(
    (acc, item) => acc + item.quantity * (item.sellPrice || 0),
    0,
  );

  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack className="items-center py-8">
          <Heading size="xl" className="text-success-600 font-extrabold">
            Transaksi Berhasil
          </Heading>
          <Image
            className="my-6 w-40 h-40"
            source={{
              uri: require("../../../assets/images/thumb-up.gif"),
            }}
            alt="image"
          />
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">
                Total Nilai Pengembalian
              </Text>
              <Text className="font-bold text-lg">
                Rp {totalAmount?.toLocaleString()}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">
                Tipe Pengembalian
              </Text>
              <Text className="font-bold text-lg">
                {returnData?.returnType === "CASH" ? "Uang" : "Tukar Barang"}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">
                Alasan Pengembalian
              </Text>
              <Text className="font-bold text-lg">
                {returnData?.note || "Tidak ada alasan"}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">Kasir / Admin</Text>
              <Text className="font-bold text-lg">
                {returnData?.createdByName || "Admin"}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">Customer</Text>
              <Text className="font-bold text-lg">
                {returnData?.customerName}
              </Text>
            </HStack>
          </Box>
          <VStack space="md" className="w-full p-4">
            <Pressable
              className="w-full rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-background-0 border border-primary-500 active:bg-primary-100"
              onPress={() => {
                router.replace(
                  `/(main)/management/return/purchasing/receipt/${id}`,
                );
              }}
            >
              <Icon as={Printer} size="xl" color="#3d2117" />
              <Text size="md" className="text-brand-primary font-bold">
                LIHAT STRUK
              </Text>
            </Pressable>
            <Pressable
              className="w-full rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-primary-500 border border-primary-500 active:bg-primary-400"
              onPress={() => {
                router.back();
              }}
            >
              <Icon as={ArrowLeft} size="xl" color="#ffffff" />
              <Text size="md" className="text-typography-0 font-bold">
                KEMBALI
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
