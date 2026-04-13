import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { PermissionGuard } from '@/components/permission-guard';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold, SolarIconLinear } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { DEFAULT_PAYMENT_TYPE } from '@/constants';
import { getErrorMessage } from '@/db/client';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import { useItemSelection } from '@/hooks/use-item-selection';
import {
  PaymentType,
  useBulkDeletePaymentType,
  useCreatePaymentType,
  usePaymentTypes,
} from '@/hooks/use-payment-type';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { usePaymentTypeStore } from '@/stores/payment-type';
import { bulkDeleteConfirm } from '@/utils/delete-confirm';
import { exportPaymentTypes, importPaymentTypes } from '@/utils/excel';
import { showSuccessToast, showToast } from '@/utils/toast';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { formatNumber, formatRp } from '@/utils/format';
export default function PaymentTypeList() {
  const { setOpen, setData } = usePaymentTypeStore();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading: isLoadingPaymentTypes, refetch } = usePaymentTypes();
  const deleteMutation = useBulkDeletePaymentType();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<PaymentType>();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Jenis pembayaran berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });

  const isLoading = isLoadingPaymentTypes;
  const paymentTypes = data || [];

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(usePaymentTypeStore, handleVersionChange);

  const createMutation = useCreatePaymentType();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportPaymentTypes(paymentTypes);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importPaymentTypes();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      showSuccessToast(toast, `${successCount} jenis pembayaran berhasil diimpor`);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleAdd = () => {
    clearSelection();
    setData(null);
    setOpen(true, () => {
      refetch();
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
        header="JENIS PEMBAYARAN"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Jenis pembayaran terpilih"
        onCancelSelectedItems={clearSelection}
        action={
          <HStack space="sm" className="w-[72px]">
            {hasSelection ? (
              isBulkDeleting ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <PermissionGuard permissions="payment-types:delete">
                  <Pressable
                    className="p-6"
                    onPress={() => {
                      if (!selectedItems || selectedItems.length === 0) return;
                      const hasDefaultPayment = selectedItems.some(
                        (item) => item.name === DEFAULT_PAYMENT_TYPE,
                      );
                      if (hasDefaultPayment) {
                        showToast(toast, {
                          action: 'error',
                          message: 'Pembayaran default tidak dapat dihapus',
                        });
                        return;
                      }
                      triggerBulkDelete(bulkDeleteConfirm('jenis pembayaran', selectedItems));
                    }}
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
        }
      />
      <Box className="flex-1 bg-white">
        <VStack className="flex-1">
          <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
            <Pressable className="size-10 items-center justify-center" onPress={() => {}}>
              <SolarIconLinear name="Filter" size={20} color="#3d2117" />
            </Pressable>
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama pembayaran" />
            </Input>
          </HStack>
          <FlashList
            data={paymentTypes}
            className="flex-1"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isDefaultPayment = item.name === DEFAULT_PAYMENT_TYPE;
              return (
                <Pressable
                  className={`p-4 rounded-lg border-b border-gray-300 active:bg-gray-100 ${
                    isSelected(item) ? 'bg-gray-100' : ''
                  }`}
                  onPress={() => {
                    if (isDefaultPayment) {
                      showToast(toast, {
                        action: 'error',
                        message: 'Pembayaran default tidak dapat diubah',
                      });
                      return;
                    }
                    if (hasSelection) {
                      handleItemPress(item);
                    } else {
                      router.push(`/(main)/management/payment-type/detail/${item.id}` as any);
                      clearSelection();
                    }
                  }}
                  onLongPress={() => {
                    if (isDefaultPayment) {
                      showToast(toast, {
                        action: 'error',
                        message: 'Pembayaran default tidak dapat dihapus',
                      });
                      return;
                    }
                    handleItemPress(item);
                  }}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="sm">
                      <Heading size="sm">{item.name}</Heading>
                      {isDefaultPayment && (
                        <SolarIconLinear name="Lock" size={14} color="#3d2117" />
                      )}
                      {item.isDefault && !isDefaultPayment && (
                        <Badge size="sm" variant="solid" action="success">
                          <BadgeText className="text-xs">Default</BadgeText>
                        </Badge>
                      )}
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">Komisi</Text>
                      <VStack className="items-end">
                        <Text size="xs">
                          {item.commissionType === 'FLAT'
                            ? formatRp(item.commission ?? 0)
                            : `${item.commission ?? 0}%`}
                        </Text>
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">
                            Minimal: Rp {formatNumber(item.minimalAmount ?? 0)}
                          </BadgeText>
                        </Badge>
                      </VStack>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Tidak ada paymentType</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <PermissionGuard permissions="payment-types:create">
              <Button
                size="sm"
                className="w-full rounded-lg bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAdd}
              >
                <ButtonText className="text-white">TAMBAH JENIS PEMBAYARAN</ButtonText>
              </Button>
            </PermissionGuard>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
