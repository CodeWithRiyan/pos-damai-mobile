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
import { usePurchase } from "@/lib/api/purchasing";
import { formatDisplayRefId } from "@/lib/utils/reference";
import { useAuthStore } from "@/stores/auth";
import classNames from "classnames";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Printer } from "lucide-react-native";
import { ScrollView } from "react-native";

import { PaymentMethod, Status } from "@/lib/constants";
import { formatNumber, formatRp } from "@/lib/utils/format";
import { getReceiptActions } from "@/lib/utils/receipt-actions";
export default function PurchasingReceipt() {
  const router = useRouter();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const { id, isSuccess } = useLocalSearchParams<{
    id: string;
    isSuccess: string;
  }>();
  const { data: purchase, isLoading } = usePurchase(id || "");
  const profile = useAuthStore((state) => state.profile);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PEMBELIAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!purchase) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PEMBELIAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Text>Data pembelian tidak ditemukan</Text>
        </Box>
      </VStack>
    );
  }

  const date = purchase.createdAt ? dayjs(purchase.createdAt) : dayjs();

  return (
    <VStack className="flex-1 bg-primary-200">
      <Header
        header="STRUK PEMBELIAN BARANG"
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
              <Text className="text-typography-500">## Struk Pembelian ##</Text>
              {purchase.status === Status.DRAFT && (
                <Text className="text-red-500 font-bold mt-1">(DRAFT)</Text>
              )}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="xs">
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Ref</Text>
                <Text className="text-typography-500">
                  {formatDisplayRefId(purchase.local_ref_id) || purchase.id}
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
                <Text className="text-typography-500">Supplier</Text>
                <Text className="text-typography-500">
                  {purchase.supplierName}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Metode Pembayaran</Text>
                <Text className="text-typography-500">
                  {purchase.paymentTypeName ||
                    (purchase.paymentType === PaymentMethod.CASH
                      ? "Tunai"
                      : "Hutang")}
                </Text>
              </HStack>
              {purchase.paymentType === PaymentMethod.DEBT &&
                purchase.dueDate && (
                  <HStack className="justify-between items-center">
                    <Text className="text-typography-500">Jatuh Tempo</Text>
                    <Text className="text-typography-500">
                      {dayjs(purchase.dueDate).format("DD/MM/YYYY")}
                    </Text>
                  </HStack>
                )}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="md">
              {purchase.items?.map((item) => (
                <HStack key={item.id} className="justify-between items-center">
                  <VStack className="flex-1 mr-2">
                    <Heading size="sm">{item.productName}</Heading>
                    {item.note ? (
                      <Text className="text-typography-500 text-xs italic">
                        {item.note}
                      </Text>
                    ) : null}
                    <Text className="text-typography-500 text-sm">
                      {item.quantity} x Rp{" "}
                      {formatNumber(item.purchasePrice || 0)}
                    </Text>
                  </VStack>
                  <Text className="text-typography-500 font-bold">
                    Rp {formatNumber(item.quantity * (item.purchasePrice || 0))}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Subtotal</Text>
                <Text className="font-bold">
                  {formatRp(purchase.totalAmount - (purchase.commission || 0))}
                </Text>
              </HStack>
              {purchase.commission ? (
                <HStack className="justify-between items-center">
                  <Text className="text-typography-500">
                    Biaya Layanan/Admin
                  </Text>
                  <Text className="text-typography-500">
                    Rp {formatNumber(purchase.commission)}
                  </Text>
                </HStack>
              ) : null}
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total Tagihan</Text>
                <Text className="font-bold">
                  Rp {formatNumber(purchase.totalAmount)}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">Uang Dibayarkan</Text>
                <Text className="font-bold">
                  Rp {formatNumber(purchase.totalPaid ?? 0)}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="font-bold">
                  {!!purchase.dueDate ? "Kekurangan" : "Kembalian"}
                </Text>
                <Text
                  className={classNames(
                    "font-bold",
                    !!purchase.dueDate && "text-error-500",
                  )}
                >
                  Rp{" "}
                  {!!purchase.dueDate
                    ? formatNumber(purchase.totalAmount - purchase.totalPaid)
                    : formatNumber(purchase.totalPaid - purchase.totalAmount)}
                </Text>
              </HStack>
            </VStack>
            {purchase.note ? (
              <>
                <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
                <VStack space="sm">
                  <Text className="text-typography-500 font-bold">
                    Catatan:
                  </Text>
                  <Text className="text-typography-500 text-sm">
                    {purchase.note}
                  </Text>
                </VStack>
              </>
            ) : null}
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
