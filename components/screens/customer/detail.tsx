import { useCallback, useState } from 'react';
import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import { Box, HStack, Text, useToast, VStack } from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import {
  useCustomers,
  useDeleteCustomer,
  useResetCustomerPoints,
  refetchCustomerById,
  CustomerWithStats,
} from '@/hooks/use-customer';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { helperCustomerCategory } from '@/utils/customer-category';
import { useDeleteEntity } from '@/hooks/use-delete-entity';
import { singleDeleteConfirm } from '@/utils/delete-confirm';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useCustomerStore } from '@/stores/customer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { formatNumber } from '@/utils/format';
export default function CustomerDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const customerId = id as string;

  const [customer, setCustomer] = useState<CustomerWithStats | null>(null);

  const { refetch: refetchCustomers } = useCustomers();
  const deleteMutation = useDeleteCustomer();
  const resetPointMutation = useResetCustomerPoints();
  const toast = useToast();

  const onRefetch = useCallback(async () => {
    if (customerId) {
      const freshCustomer = await refetchCustomerById(customerId);
      setCustomer(freshCustomer);
    }
    refetchCustomers();
  }, [customerId, refetchCustomers]);

  useStoreVersionSync(useCustomerStore, onRefetch);

  const { triggerDelete } = useDeleteEntity({
    successMessage: 'Pelanggan berhasil dihapus',
    deleteMutation,
    onSuccess: () => {
      useCustomerStore.getState().incrementVersion();
      onRefetch();
    },
  });

  const handleResetPointPress = () => {
    showPopUpConfirm({
      title: 'RESET POIN PELANGGAN',
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin me-reset poin pelanggan `}
          <Text className="font-bold text-slate-900">{customer?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'RESET',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => confirmResetPoint(),
      loading: resetPointMutation.isPending,
    });
  };

  const confirmResetPoint = async () => {
    if (!customer) return;

    resetPointMutation.mutate(customer.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();

        showSuccessToast(toast, 'Poin Pelanggan berhasil direset');
      },
      onError: (error: Error) => {
        showErrorToast(toast, error);
        hidePopUpConfirm();
      },
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: 'Edit',
          icon: 'Pen',
          onPress: () => {
            router.navigate(`/(main)/management/customer-supplier/customer/edit/${customer?.id}`);
            hideActionDrawer();
          },
        },
        {
          label: 'Reset Poin',
          icon: 'RestartCircle',
          theme: 'red',
          onPress: () => {
            handleResetPointPress();
            hideActionDrawer();
          },
        },
        {
          label: 'Hapus Pelanggan',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            triggerDelete(singleDeleteConfirm('pelanggan', customer?.id || '', customer?.name));
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL CUSTOMER"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Name</Text>
              <Text className="font-bold">{customer?.name || '-'}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Kode</Text>
              <Text className="font-bold">{customer?.code || '-'}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Kategori</Text>
              <Text className="font-bold">{helperCustomerCategory(customer?.category)}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">No. Handphone</Text>
              <Text className="font-bold">{customer?.phone || '-'}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Alamat</Text>
              <Text className="font-bold">{customer?.address || '-'}</Text>
            </VStack>
          </Box>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Poin</Text>
              <Text className="font-bold">{customer?.points || 0}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Transaksi</Text>
              <Text className="font-bold">{customer?.totalTransactions || 0}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Omset</Text>
              <Text className="font-bold">Rp {formatNumber(customer?.totalRevenue || 0)}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Keuntungan</Text>
              <Text className="font-bold">Rp {formatNumber(customer?.totalProfit || 0)}</Text>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => {
            router.navigate(`/(main)/transaction/history?customerId=${customer?.id}`);
          }}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            RIWAYAT TRANSAKSI
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
