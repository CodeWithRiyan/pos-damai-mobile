import { Box, Heading, HStack, Icon, Text, VStack } from "@/components/ui";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { useSupplier } from "@/lib/api/suppliers";
import { usePurchasingStore } from "@/stores/purchasing";
import { useRouter } from "expo-router";
import { ArrowLeft, Printer } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function PurchasingSuccess() {
  const router = useRouter();
  const { checkoutData, setCheckoutData, resetCart } = usePurchasingStore();
  const { data: supplier } = useSupplier(checkoutData?.supplierId || "");

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
                Total Transaksi
              </Text>
              <Text className="font-bold text-lg">
                Rp {checkoutData?.totalPurchase?.toLocaleString()}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">
                Uang Dibayarkan
              </Text>
              <Text className="font-bold text-lg">
                Rp{" "}
                {parseFloat(checkoutData?.totalPaid || "0").toLocaleString(
                  "id-ID",
                )}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">Kembalian</Text>
              <Text className="font-bold text-lg">
                Rp{" "}
                {checkoutData?.totalPaid && checkoutData?.totalPurchase
                  ? (
                      parseFloat(checkoutData.totalPaid) -
                      checkoutData?.totalPurchase
                    ).toLocaleString()
                  : "0"}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500 text-lg">Kasir / Admin</Text>
              <Text className="font-bold text-lg">
                {checkoutData?.createdByName}
              </Text>
            </HStack>
            {supplier && (
              <HStack className="w-full flex-row justify-between">
                <Text className="text-typography-500 text-lg">Supplier</Text>
                <Text className="font-bold text-lg">{supplier.name}</Text>
              </HStack>
            )}
          </Box>
          <VStack space="md" className="w-full p-4">
            <Pressable
              className="w-full rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-background-0 border border-primary-500 active:bg-primary-100"
              onPress={() => {
                resetCart();
                const id = checkoutData?.id;
                setCheckoutData(null);
                if (id) {
                  router.replace({
                    pathname: "/(main)/purchasing/receipt/[id]",
                    params: { id },
                  });
                } else {
                  router.replace("/(main)/purchasing");
                }
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
                resetCart();
                setCheckoutData(null);
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
