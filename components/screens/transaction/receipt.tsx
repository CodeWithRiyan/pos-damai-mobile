import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { Box, Heading, HStack, Pressable, Text, VStack } from "@/components/ui";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useTransaction } from "@/lib/api/transactions";
import { formatDisplayRefId } from "@/lib/utils/reference";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function TransactionReceipt() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id || "");
  const profile = useAuthStore((state) => state.profile);
  console.log("transaction:", transaction);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PENJUALAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!transaction) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PENJUALAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data transaksi tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = transaction.createdAt ? dayjs(transaction.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header
        header="STRUK PENJUALAN BARANG"
        isGoBack
        action={
          <Pressable
            className="p-6"
            onPress={() => {
              showActionDrawer({
                actions: [
                  {
                    label: "Cetak Struk",
                    icon: "Printer",
                    onPress: () => {
                      hideActionDrawer();
                    },
                  },
                  {
                    label: "Download",
                    icon: "Download",
                    onPress: () => {
                      hideActionDrawer();
                    },
                  },
                  {
                    label: "Share",
                    icon: "Share",
                    onPress: () => {
                      hideActionDrawer();
                    },
                  },
                ],
              });
            }}
          >
            <SolarIconBold
              name="MenuDots"
              size={20}
              color="#FDFBF9"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </Pressable>
        }
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="p-4 flex-1">
          <VStack className="flex-1 bg-background-0 p-6 shadow">
            <VStack className="items-center">
              <Heading size="xl">
                {profile?.selectedOrganization?.name || "Toko Damai"}
              </Heading>
              <Text className="text-typography-500 text-center">
                {profile?.selectedOrganization?.address ||
                  "Pekalongan Timur, Pekalongan"}
              </Text>
              <Text className="text-typography-500">## Struk Penjualan ##</Text>
              {transaction.status === "DRAFT" && (
                <Text className="text-red-500 font-bold mt-1">(DRAFT)</Text>
              )}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="xs">
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Ref</Text>
                <Text className="text-typography-500">
                  {formatDisplayRefId(transaction.local_ref_id) ||
                    transaction.id}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Tanggal</Text>
                <Text className="text-typography-500">
                  {date.format("DD/MM/YYYY HH:mm:ss")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Admin</Text>
                <Text className="text-typography-500">
                  {profile?.name || "Admin"}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Pelanggan</Text>
                <Text className="text-typography-500">
                  {transaction.customerName}
                </Text>
              </HStack>

              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Metode Pembayaran</Text>
                <Text className="text-typography-500">
                  {transaction.paymentTypeName}
                </Text>
              </HStack>
            </VStack>
            <VStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Pelanggan: {transaction.customerName}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              {(() => {
                // Group items by productId and variantId
                const groupedItemsMap: Record<string, any> = {};
                transaction.items?.forEach((item) => {
                  const key = `${item.productId}-${item.variantId || "no-var"}`;
                  if (!groupedItemsMap[key]) {
                    groupedItemsMap[key] = {
                      ...item,
                      quantity: 0,
                      total: 0,
                    };
                  }
                  groupedItemsMap[key].quantity += item.quantity;
                  groupedItemsMap[key].total += item.quantity * (item.sellPrice || 0);
                });

                return Object.values(groupedItemsMap).map((group) => {
                  const hasMultiplePrices = transaction.items?.some(i => 
                    i.productId === group.productId && 
                    i.variantId === group.variantId && 
                    i.sellPrice !== group.sellPrice
                  );
                  
                  // Regular price is the max price in this group (undiscounted)
                  const regularPrice = Math.max(...(transaction.items
                    ?.filter(i => i.productId === group.productId && i.variantId === group.variantId)
                    .map(i => i.sellPrice || 0) || [0]));
                  
                  const totalDiscount = (regularPrice * group.quantity) - group.total;

                  return (
                    <VStack key={group.id} space="xs" className="mb-2">
                      <HStack className="justify-between items-center">
                        <VStack className="flex-1 mr-2">
                          <Heading size="sm">
                            {group.productName}
                            {group.variantName ? ` - ${group.variantName}` : ""}
                          </Heading>
                          <Text className="text-typography-500 text-sm">
                            {group.quantity} x Rp {regularPrice.toLocaleString("id-ID")}
                          </Text>
                        </VStack>
                        <Text className="text-typography-500 font-bold">
                          Rp {(regularPrice * group.quantity).toLocaleString("id-ID")}
                        </Text>
                      </HStack>
                      {totalDiscount > 0 && (
                        <HStack className="justify-between items-center pl-2">
                          <Text className="text-error-500 text-sm italic">
                            Potongan Harga (Diskon)
                          </Text>
                          <Text className="text-error-500 text-sm italic">
                            - Rp {totalDiscount.toLocaleString("id-ID")}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  );
                });
              })()}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Subtotal</Text>
                <Text className="font-bold">
                  {`Rp ${(transaction.totalAmount - (transaction.commission || 0)).toLocaleString("id-ID")}`}
                </Text>
              </HStack>
              {transaction.commission ? (
                <HStack className="justify-between items-center">
                  <Text className="text-typography-500">
                    Biaya Layanan/Admin
                  </Text>
                  <Text className="text-typography-500">
                    Rp {transaction.commission.toLocaleString("id-ID")}
                  </Text>
                </HStack>
              ) : null}
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total Tagihan</Text>
                <Text className="font-bold">
                  Rp {transaction.totalAmount.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Uang Dibayarkan</Text>
                <Text className="font-bold">
                  Rp {transaction.totalPaid.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Kembalian</Text>
                <Text className="font-bold">
                  {`Rp ${(transaction.totalPaid - transaction.totalAmount).toLocaleString("id-ID")}`}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack className="items-center py-2">
              <Text className="text-typography-500">
                Terima kasih atas pembelian Anda
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
