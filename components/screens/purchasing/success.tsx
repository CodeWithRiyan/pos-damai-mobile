import Header from "@/components/header";
import { Box, Heading, HStack, Icon, Text, VStack } from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import { useSupplier } from "@/lib/api/suppliers";
import { usePurchasingStore } from "@/stores/purchasing";
import { useRouter } from "expo-router";
import { Check, Printer } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function PurchasingSuccess() {
  const router = useRouter();
  const { checkoutData, setCheckoutData, resetCart } = usePurchasingStore();
  const { data: supplier } = useSupplier(checkoutData?.supplierId || "");

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="PEMBELIAN"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center border-primary-500 border rounded-lg bg-primary-100 active:bg-primary-200"
              onPress={() => {
                resetCart();
                setCheckoutData(null);
                router.back();
              }}
            >
              <Icon as={Check} size="md" color="#3d2117" />
            </Pressable>
          </HStack>
        }
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack className="items-center pt-14 pb-4">
          <Heading size="lg">Transaksi Berhasil</Heading>
          <Box className="items-center justify-center size-24 my-4 rounded-full bg-primary-100 border border-primary-500">
            <Icon as={Check} size="5xl" color="#3d2117" />
          </Box>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500">Total Transaksi</Text>
              <Text className="font-bold">
                Rp {checkoutData?.totalPurchase?.toLocaleString()}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500">Uang Dibayarkan</Text>
              <Text className="font-bold">
                Rp{" "}
                {parseFloat(checkoutData?.totalPaid || "0").toLocaleString(
                  "id-ID",
                )}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500">Kembalian</Text>
              <Text className="font-bold">
                Rp{" "}
                {checkoutData?.totalPaid && checkoutData?.totalPurchase
                  ? (
                      parseFloat(checkoutData.totalPaid) -
                      checkoutData.totalPurchase
                    ).toLocaleString()
                  : "0"}
              </Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500">Kasir / Admin</Text>
              <Text className="font-bold">{checkoutData?.createdByName}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="text-typography-500">Supplier</Text>
              <Text className="font-bold">{supplier?.name}</Text>
            </HStack>
          </Box>
          <VStack space="md" className="w-full p-4">
            <Pressable
              className="w-full rounded-lg h-12 px-4 flex-row gap-4 items-center justify-between bg-background-0 border border-primary-500 active:bg-primary-100"
              onPress={() => {
                resetCart();
                const id = checkoutData?.id;
                setCheckoutData(null);
                if (id) {
                  router.replace({
                    pathname: "/(main)/purchasing/receipt/[id]",
                    params: { id }
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
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
