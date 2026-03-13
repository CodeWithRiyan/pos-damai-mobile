import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import {
  Box,
  Heading,
  HStack,
  Icon,
  Pressable,
  Text,
  VStack,
} from "@/components/ui";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useTransactionReturn } from "@/lib/api/return-transaction";
import { TransactionItem, useTransaction } from "@/lib/api/transactions";
import { formatDisplayRefId } from "@/lib/utils/reference";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Printer, Send } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

export default function ReturnTransactionReceipt() {
  const router = useRouter();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const { id, isSuccess } = useLocalSearchParams<{
    id: string;
    isSuccess: string;
  }>();
  const {
    data: returnData,
    isLoading: isLoadingReturnData,
    refetch: refetchReturnData,
  } = useTransactionReturn(id || "");
  const {
    data: transaction,
    isLoading: isLoadingTransaction,
    refetch: refetchTransaction,
  } = useTransaction(id || "", { useReturnId: true });
  console.log("transaction: ", transaction?.items);
  const profile = useAuthStore((state) => state.profile);
  const isLoading = isLoadingReturnData || isLoadingTransaction;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchReturnData();
    await refetchTransaction();
    setRefreshing(false);
  }, [refetchReturnData, refetchTransaction]);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK RETUR TRANSAKSI PENJUALAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!returnData) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK TRANSAKSI PENJUALAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data retur tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = returnData.createdAt ? dayjs(returnData.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header
        header="STRUK RETUR TRANSAKSI PENJUALAN"
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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space="md" className="p-4 flex-1">
          {returnData.returnType === "ITEM" && !transaction && (
            <Pressable
              className="flex-1 rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-primary-500 border border-primary-500 active:bg-primary-400"
              onPress={() => {
                router.push({
                  pathname: "/(main)/transaction",
                  params: {
                    returnCustomerId: returnData.customerId,
                    returnId: returnData.id,
                  },
                });
              }}
            >
              <Icon as={Send} size="xl" color="#ffffff" />
              <Text size="md" className="text-typography-0 font-bold">
                LANJUT TUKAR BARANG
              </Text>
            </Pressable>
          )}

          {isSuccess === "true" && (
            <HStack space="md" className="w-full">
              <Pressable
                className="flex-1 rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-background-0 border border-primary-500 active:bg-primary-100"
                onPress={() => router.back()}
              >
                <Icon as={Check} size="xl" color="#ffffff" />
                <Text size="md" className="text-typography-0 font-bold">
                  SELESAI
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-background-0 border border-primary-500 active:bg-primary-100"
                onPress={() => {}}
              >
                <Icon as={Printer} size="xl" color="#3d2117" />
                <Text size="md" className="text-brand-primary font-bold">
                  CETAK ULANG STRUK
                </Text>
              </Pressable>
            </HStack>
          )}
          <VStack className="flex-1 bg-background-0 p-6 shadow">
            <VStack className="items-center">
              <Heading size="xl">
                {profile?.selectedOrganization?.name || "Toko Damai"}
              </Heading>
              <Text className="text-typography-500 text-center">
                {profile?.selectedOrganization?.address ||
                  "Pekalongan Timur, Pekalongan"}
              </Text>
              <Text className="text-typography-500">
                ## Struk Retur Penjualan ##
              </Text>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">
                  {date.format("DD/MM/YYYY")}
                </Text>
                <Text className="text-typography-500">
                  Admin: {profile?.name || "Admin"}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">
                  {date.format("HH:mm:ss")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Pelanggan: {returnData.customerName}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">
                  Ref: {returnData.local_ref_id || returnData.id}
                </Text>
              </HStack>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              {returnData.items?.map((item) => (
                <HStack key={item.id} className="justify-between items-center">
                  <VStack className="flex-1 mr-2">
                    <Heading size="sm">{item.productName}</Heading>
                    <Text className="text-typography-500 text-sm">
                      {item.quantity} x Rp{" "}
                      <Text className="text-[10px]">
                        {(item.sellPrice || 0).toLocaleString("id-ID")}
                      </Text>
                    </Text>
                  </VStack>
                  <VStack className="items-end min-w-[50px]">
                    <Text>
                      Rp{" "}
                      {(item.quantity * (item.sellPrice || 0)).toLocaleString(
                        "id-ID",
                      )}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total Retur</Text>
                <Text className="font-bold">
                  Rp {returnData.totalAmount.toLocaleString("id-ID")}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">Tipe Pengembalian</Text>
                <Text className="text-typography-500">
                  {returnData.returnType === "CASH" ? "Uang" : "Tukar Barang"}
                </Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">Alasan Pengembalian</Text>
                <Text className="text-typography-500">
                  {returnData.note || "Tidak ada alasan"}
                </Text>
              </HStack>
            </VStack>
            {returnData.returnType === "ITEM" && transaction && (
              <VStack
                space="sm"
                className="p-4 mt-4 border border-background-300 border-dashed rounded-md "
              >
                <VStack className="items-center">
                  <Text className="text-typography-500">
                    ## Tukar Barang ##
                  </Text>
                  <HStack className="justify-between items-center">
                    <Text className="text-typography-500">Ref</Text>
                    <Text className="text-typography-500">
                      {formatDisplayRefId(transaction.local_ref_id) ||
                        transaction.id}
                    </Text>
                  </HStack>
                </VStack>
                <Box className="my-2 w-full h-0 border-b border-background-300 border-dashed" />
                <VStack space="md">
                  {(() => {
                    // Group items by productId and variantId
                    const groupedItemsMap: Record<
                      string,
                      TransactionItem & {
                        quantity: number;
                        total: number;
                      }
                    > = {};
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
                      groupedItemsMap[key].total +=
                        item.quantity * (item.sellPrice || 0);
                    });

                    return Object.values(groupedItemsMap).map((group) => {
                      // Collect all sell prices for this product group
                      const groupPrices = transaction.items
                        ?.filter(
                          (i) =>
                            i.productId === group.productId &&
                            i.variantId === group.variantId,
                        )
                        .map((i) => i.sellPrice || 0) || [0];

                      const regularPrice = Math.max(...groupPrices);
                      const minPrice = Math.min(...groupPrices);

                      // Only show a discount if the item was actually split into
                      // rows with different prices (i.e. a discount was applied)
                      const hasDiscount = minPrice < regularPrice;
                      const totalDiscount = hasDiscount
                        ? regularPrice * group.quantity - group.total
                        : 0;

                      return (
                        <VStack key={group.id} space="xs" className="mb-2">
                          <HStack className="justify-between items-center">
                            <VStack className="flex-1 mr-2">
                              <Heading size="sm">
                                {group.productName}
                                {group.productType === "MULTIUNIT" &&
                                group.variantName
                                  ? ` - ${group.variantName}`
                                  : ""}
                              </Heading>
                              <Text className="text-typography-500 text-sm">
                                {group.quantity} x Rp{" "}
                                {regularPrice.toLocaleString("id-ID")}
                              </Text>
                            </VStack>
                            <Text>
                              Rp {group.total.toLocaleString("id-ID")}
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
                <Box className="my-2 w-full h-0 border-b border-background-300 border-dashed" />
                <VStack space="sm">
                  {(() => {
                    // TODO: Jika ada perubahan di receipt transaction, maka sesuaikan juga receipt return-transaction.
                    // Pre-discount subtotal = maxPrice * qty per product group.
                    // Stored items use a split-row approach (1 discounted row +
                    // remaining rows at regular price), so maxPrice is the regular price.
                    const groupedMap: Record<
                      string,
                      { qty: number; maxPrice: number }
                    > = {};
                    transaction.items?.forEach((item) => {
                      const key = `${item.productId}-${item.variantId || "no-var"}`;
                      if (!groupedMap[key])
                        groupedMap[key] = { qty: 0, maxPrice: 0 };
                      groupedMap[key].qty += item.quantity;
                      groupedMap[key].maxPrice = Math.max(
                        groupedMap[key].maxPrice,
                        item.sellPrice || 0,
                      );
                    });
                    const subtotalGross = Object.values(groupedMap).reduce(
                      (sum, g) => sum + g.maxPrice * g.qty,
                      0,
                    );
                    const subtotalAfterDiscount =
                      transaction.totalAmount - (transaction.commission || 0);
                    const discountAmount =
                      subtotalGross - subtotalAfterDiscount;

                    return (
                      <>
                        <HStack className="justify-between items-center">
                          <Text className="font-bold">Subtotal</Text>
                          <Text>
                            {`Rp ${subtotalGross.toLocaleString("id-ID")}`}
                          </Text>
                        </HStack>
                        {discountAmount > 0 && (
                          <HStack className="justify-between items-center">
                            <Text className="text-error-500 font-bold">
                              Total Diskon
                            </Text>
                            <Text className="text-error-500">
                              {`- Rp ${discountAmount.toLocaleString("id-ID")}`}
                            </Text>
                          </HStack>
                        )}
                        {transaction.commission ? (
                          <HStack className="justify-between items-center">
                            <Text className="text-typography-500">
                              Biaya Layanan/Admin
                            </Text>
                            <Text className="text-typography-500">
                              {`Rp ${transaction.commission.toLocaleString("id-ID")}`}
                            </Text>
                          </HStack>
                        ) : null}
                        <HStack className="justify-between items-center">
                          <Text className="text-error-500 font-bold">
                            Total Retur
                          </Text>
                          <Text className="text-error-500">
                            {`- Rp ${returnData.totalAmount.toLocaleString("id-ID")}`}
                          </Text>
                        </HStack>
                        <HStack className="justify-between items-center">
                          <Text className="text-lg font-bold">
                            {`Total ${transaction.totalAmount - returnData.totalAmount <= 0 ? "Pengembalian Uang" : "Tagihan"}`}
                          </Text>
                          <Text className="text-lg font-bold">
                            {`Rp ${Math.abs(transaction.totalAmount - returnData.totalAmount).toLocaleString("id-ID")}`}
                          </Text>
                        </HStack>
                        {transaction.totalAmount - returnData.totalAmount >
                          0 && (
                          <>
                            <HStack className="justify-between items-center">
                              <Text className="font-bold">Uang Dibayarkan</Text>
                              <Text>
                                {`Rp ${(transaction.totalPaid - returnData.totalAmount).toLocaleString("id-ID")}`}
                              </Text>
                            </HStack>
                            <HStack className="justify-between items-center">
                              <Text className="font-bold">Kembalian</Text>
                              <Text>
                                {`Rp ${(transaction.totalPaid - transaction.totalAmount).toLocaleString("id-ID")}`}
                              </Text>
                            </HStack>
                          </>
                        )}
                      </>
                    );
                  })()}
                </VStack>
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
