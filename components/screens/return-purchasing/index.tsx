import Header from "@/components/header";
import {
  Heading,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { usePurchaseReturns } from "@/lib/api/return-purchasing";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import dayjs from "dayjs";

export default function ReturPurchasing() {
  const router = useRouter();
  const { data: returns, isLoading } = usePurchaseReturns();

  return (
    <VStack className="flex-1 bg-white">
      <Header header="RETUR PEMBELIAN BARANG" isGoBack />
      <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
        <Input className="flex-1 border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField placeholder="Cari no transaksi atau nama supplier" />
        </Input>
        <Pressable
          className="bg-primary-500 px-4 h-10 rounded-lg items-center justify-center"
          onPress={() => router.navigate("/(main)/management/return/purchasing/input")}
        >
          <Text className="text-white font-bold">+ Tambah</Text>
        </Pressable>
      </HStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <VStack className="items-center py-10">
            <Spinner />
          </VStack>
        ) : !returns?.length ? (
          <VStack className="items-center py-10">
            <Text className="text-typography-400">Belum ada riwayat retur</Text>
          </VStack>
        ) : (
          returns.map((ret: any) => {
            const date = dayjs(ret.createdAt);
            return (
              <Pressable
                key={ret.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.navigate({
                    pathname: "/(main)/management/return/purchasing/detail",
                    params: { id: ret.id }
                  })
                }
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">{date.format("HH:mm:ss")}</Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.date()}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">{date.format("MMM")}</Text>
                        <Text className="text-typography-500 font-bold">{date.year()}</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack className="justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Jumlah Retur
                        </Text>
                        <Text className="font-bold">Rp {ret.totalAmount.toLocaleString("id-ID")}</Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">Supplier</Text>
                        <Text className="font-bold">{ret.supplierName}</Text>
                      </VStack>
                      <VStack />
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">
                        No: {ret.local_ref_id}
                      </Text>
                    </HStack>
                  </VStack>
                  <Text className="text-typography-400 text-lg">›</Text>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
