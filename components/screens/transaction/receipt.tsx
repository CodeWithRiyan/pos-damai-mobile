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
import { TransactionItem, useTransaction } from "@/lib/api/transactions";
import { formatDisplayRefId } from "@/lib/utils/reference";
import { getReceiptActions } from "@/lib/utils/receipt-actions";
import { ProductType, Status } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Printer } from "lucide-react-native";
import { useMemo } from "react";
import { ScrollView } from "react-native";

import { formatRp, formatNumber } from "@/lib/utils/format";
export default function TransactionReceipt() {
  const router = useRouter();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const { id, isSuccess } = useLocalSearchParams<{
    id: string;
    isSuccess: string;
  }>();
  const { data: transaction, isLoading } = useTransaction(id || "");

  const profile = useAuthStore((state) => state.profile);

  const groupedItems = useMemo(() => {
    if (!transaction?.items) return [];
    const groupedItemsMap: Record<
      string,
      TransactionItem & {
        quantity: number;
        total: number;
        totalDiscount: number;
        regularPrice: number;
      }
    > = {};
    transaction.items.forEach((item) => {
      const key = `${item.productId}-${item.variantId || "no-var"}`;
      if (!groupedItemsMap[key]) {
        groupedItemsMap[key] = {
          ...item,
          quantity: 0,
          total: 0,
          totalDiscount: 0,
          regularPrice: item.sellPrice,
        };
      }
      groupedItemsMap[key].quantity += item.quantity;
      groupedItemsMap[key].total += item.quantity * item.sellPrice;
      groupedItemsMap[key].totalDiscount += item.discountAmount ?? 0;
      if (item.sellPrice > groupedItemsMap[key].regularPrice) {
        groupedItemsMap[key].regularPrice = item.sellPrice;
      }
    });
    return Object.values(groupedItemsMap);
  }, [transaction?.items]);

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
  const totalDiscount = transaction.totalDiscount ?? 0;
  const subtotalGross = transaction.totalAmount + totalDiscount;

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header
        header={
          transaction?.returnId
            ? "STRUK PENUKARAN BARANG"
            : "STRUK PENJUALAN BARANG"
        }
        isGoBack
        action={
          <Pressable
            className="p-6"
            onPress={() => {
              showActionDrawer({
                actions: getReceiptActions(hideActionDrawer),
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
        <VStack space="md" className="p-4 flex-1">
          {isSuccess === "true" && (
            <HStack space="md" className="w-full">
              <Pressable
                className="flex-1 rounded-lg h-12 px-4 flex-row gap-4 items-center justify-center bg-primary-500 border border-primary-500 active:bg-primary-400"
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
                {`## Struk ${transaction?.returnId ? "Penukaran Barang" : "Penjualan"} ##`}
              </Text>
              {transaction.status === Status.DRAFT && (
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
              {groupedItems.map((group) => (
                <VStack key={group.id} space="xs" className="mb-2">
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1 mr-2">
                      <Heading size="sm">
                        {group.productName}
                        {group.productType === ProductType.MULTIUNIT && group.variantName
                          ? ` - ${group.variantName}`
                          : ""}
                      </Heading>
                      <Text className="text-typography-500 text-sm">
                        {group.quantity} x Rp{" "}
                        {(group.regularPrice ?? 0)}
                      </Text>
                    </VStack>
                    <Text className="text-typography-500 font-bold">
                      Rp {formatNumber(group.total ?? 0)}
                    </Text>
                  </HStack>
                  {group.totalDiscount > 0 && (
                    <HStack className="justify-between items-center pl-2">
                      <Text className="text-error-500 text-sm italic">
                        Potongan Harga (Diskon)
                      </Text>
                      <Text className="text-error-500 text-sm italic">
                        - Rp {formatNumber(group.totalDiscount ?? 0)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              ))}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Subtotal</Text>
                <Text className="font-bold">
                  Rp {formatNumber(subtotalGross)}
                </Text>
              </HStack>
              {totalDiscount > 0 && (
                <HStack className="justify-between items-center">
                  <Text className="text-success-600 font-bold">
                    Total Diskon
                  </Text>
                  <Text className="text-success-600 font-bold">
                    - Rp {formatNumber(totalDiscount)}
                  </Text>
                </HStack>
              )}
              {transaction.commission ? (
                <HStack className="justify-between items-center">
                  <Text className="text-typography-500">
                    Biaya Layanan/Admin
                  </Text>
                  <Text className="text-typography-500">
                    Rp {formatNumber(transaction.commission ?? 0)}
                  </Text>
                </HStack>
              ) : null}
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total Tagihan</Text>
                <Text className="font-bold">
                  Rp {formatNumber(transaction.totalAmount ?? 0)}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Uang Dibayarkan</Text>
                <Text className="font-bold">
                  Rp {formatNumber(transaction.totalPaid ?? 0)}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Kembalian</Text>
                <Text className="font-bold">
                  {formatRp((transaction.totalPaid ?? 0) - (transaction.totalAmount ?? 0))}
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
        </VStack>
      </ScrollView>
    </VStack>
  );
}
