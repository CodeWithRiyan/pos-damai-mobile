import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { PermissionGuard } from '@/components/permission-guard';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/db/client';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import {
  CustomerWithStats,
  useBulkDeleteCustomer,
  useBulkResetCustomerPoints,
  useCreateCustomer,
  useCustomers,
} from '@/hooks/use-customer';
import { useItemSelection } from '@/hooks/use-item-selection';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useCustomerStore } from '@/stores/customer';
import { bulkDeleteConfirm } from '@/utils/delete-confirm';
import { exportCustomers, importCustomers } from '@/utils/excel';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { formatNumber } from '@/utils/format';
export default function CustomerList({ isReport }: { isReport?: boolean }) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useCustomers();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<CustomerWithStats>();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const customers = data || [];

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(useCustomerStore, handleVersionChange);

  const deleteMutation = useBulkDeleteCustomer();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Pelanggan berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });
  const resetPointMutation = useBulkResetCustomerPoints();
  const createMutation = useCreateCustomer();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportCustomers(customers);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importCustomers();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      showSuccessToast(toast, `${successCount} pelanggan berhasil diimpor`);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleAdd = () => {
    clearSelection();
    router.push('/(main)/management/customer-supplier/customer/add');
  };

  const handleResetPointPress = () => {
    const ids = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: 'RESET POIN PELANGGAN',
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin me-reset poin milik `}
          <Text className="font-bold text-slate-900">{ids?.length}</Text>
          {` pelanggan? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'RESET',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => confirmResetPoint(ids),
      loading: resetPointMutation.isPending,
    });
  };

  const confirmResetPoint = async (ids: string[]) => {
    if (!ids.length) return;

    resetPointMutation.mutate(ids, {
      onSuccess: () => {
        clearSelection();
        hidePopUpConfirm();
        refetch();

        showSuccessToast(toast, 'Poin Pelanggan berhasil direset');
      },
      onError: (error: Error) => {
        showErrorToast(toast, error);
        hidePopUpConfirm();
      },
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={isReport ? 'LAPORAN PELANGGAN' : 'PELANGGAN'}
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Pelanggan terpilih"
        onCancelSelectedItems={clearSelection}
        action={
          !isReport && (
            <HStack space="sm" className="w-[72px]">
              {hasSelection ? (
                isBulkDeleting ? (
                  <Box className="p-6">
                    <Spinner size="small" color="#FFFFFF" />
                  </Box>
                ) : (
                  <PermissionGuard permissions={['customers:delete', 'customers:delete-poin']}>
                    <Pressable
                      className="p-6"
                      onPress={() =>
                        showActionDrawer({
                          actions: [
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
                                triggerBulkDelete(bulkDeleteConfirm('pelanggan', selectedItems));
                                hideActionDrawer();
                              },
                            },
                          ],
                        })
                      }
                    >
                      <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                    </Pressable>
                  </PermissionGuard>
                )
              ) : (
                <Pressable
                  className="p-6"
                  onPress={() => {
                    showActionDrawer({
                      actions: [
                        {
                          label: 'Export Data',
                          icon: 'Export',
                          onPress: handleExport,
                        },
                        {
                          label: 'Import Data',
                          icon: 'Import',
                          onPress: handleImport,
                        },
                      ],
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
              )}
            </HStack>
          )
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <FlashList
            data={customers}
            className="flex-1"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className={`p-4 rounded-lg border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(item) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(item);
                  } else {
                    router.push(
                      `/(main)/management/customer-supplier/customer/detail/${item.id}` as any,
                    );
                    clearSelection();
                  }
                }}
                onLongPress={() => !isReport && handleItemPress(item)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                      <Text className="text-brand-primary font-bold">
                        {item.name.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{item.name}</Heading>
                      <Text size="xs" className="text-slate-500">
                        {item.code}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <Text className="text-brand-primary text-sm font-bold">
                      {item.points || 0} Poin
                    </Text>
                    <Text className="text-xs">Total Transaksi: {item.totalTransactions || 0}</Text>
                    <Text className="text-xs">
                      Total Omset: Rp {formatNumber(item.totalRevenue || 0)}
                    </Text>
                    <Text className="text-xs">
                      Total Keuntungan: Rp {formatNumber(item.totalProfit || 0)}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Tidak ada pelanggan</Text>
              </Box>
            }
          />
          {!isReport && (
            <HStack className="w-full p-4">
              <PermissionGuard permissions="customers:create">
                <Button
                  size="sm"
                  className="w-full rounded-lg bg-brand-primary active:bg-brand-primary/90"
                  onPress={handleAdd}
                >
                  <ButtonText className="text-white">TAMBAH PELANGGAN</ButtonText>
                </Button>
              </PermissionGuard>
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
