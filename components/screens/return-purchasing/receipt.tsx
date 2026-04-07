import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { Box, Heading, HStack, Pressable, Text, VStack } from '@/components/ui';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { usePurchaseReturn } from '@/hooks/use-supplier-return';
import { useAuthStore } from '@/stores/system/auth';
import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { getReceiptActions } from '@/utils/receipt-actions';
import { ReturnType } from '@/constants';
import { formatNumber, formatRp } from '@/utils/format';
export default function ReturnPurchasingReceipt() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: returnData, isLoading } = usePurchaseReturn(id || '');
  const profile = useAuthStore((state) => state.profile);

  if (isLoading || !id) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK RETUR PEMBELIAN BARANG" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  if (!returnData) {
    return (
      <VStack className="flex-1 bg-primary-200">
        <Header header="STRUK PENJUALAN BARANG" isGoBack />
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
        header="STRUK RETUR PEMBELIAN BARANG"
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
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </Pressable>
        }
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="p-4 flex-1">
          <VStack className="flex-1 bg-background-0 p-6 shadow">
            <VStack className="items-center">
              <Heading size="xl">{profile?.selectedOrganization?.name || 'Toko Damai'}</Heading>
              <Text className="text-typography-500 text-center">
                {profile?.selectedOrganization?.address || 'Pekalongan Timur, Pekalongan'}
              </Text>
              <Text className="text-typography-500">## Struk Penjualan ##</Text>
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">{date.format('DD/MM/YYYY')}</Text>
                <Text className="text-typography-500">Admin: {profile?.name || 'Admin'}</Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">{date.format('HH:mm:ss')}</Text>
              </HStack>
              <HStack className="justify-between items-center mt-1">
                <Text className="text-typography-500">Supplier: {returnData.supplierName}</Text>
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
                      {item.quantity} x {formatRp(item.purchasePrice || 0)}
                    </Text>
                  </VStack>
                  <Text className="text-typography-500 font-bold">
                    {formatRp(item.quantity * (item.purchasePrice || 0))}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Box className="my-4 w-full h-0 border-b border-background-300 border-dashed" />
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">Rp {formatNumber(returnData.totalAmount ?? 0)}</Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Tipe Pengembalian</Text>
                <Text className="text-typography-500">
                  {returnData.returnType === ReturnType.CASH ? 'Uang' : 'Tukar Barang'}
                </Text>
              </HStack>
              <HStack className="justify-between items-center">
                <Text className="text-typography-500">Alasan Pengembalian</Text>
                <Text className="text-typography-500">{returnData.note || 'Tidak ada alasan'}</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
