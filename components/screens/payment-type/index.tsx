import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import { useItemSelection } from '@/hooks/use-item-selection';
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
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/lib/api/client';
import {
  PaymentType,
  useBulkDeletePaymentType,
  useCreatePaymentType,
  usePaymentTypes,
} from '@/lib/api/payment-types';
import { bulkDeleteConfirm } from '@/lib/utils/delete-confirm';
import { exportPaymentTypes, importPaymentTypes } from '@/lib/utils/excel';
import { usePaymentTypeStore } from '@/stores/payment-type';
import { useRouter } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import React from 'react';
import { FlatList } from 'react-native';

import { formatRp, formatNumber } from '@/lib/utils/format';
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

  const createMutation = useCreatePaymentType();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportPaymentTypes(paymentTypes);
    } catch (e) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(e)}</ToastTitle>
          </Toast>
        ),
      });
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
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>{`${successCount} jenis pembayaran berhasil diimpor`}</ToastTitle>
          </Toast>
        ),
      });
    } catch (e) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(e)}</ToastTitle>
          </Toast>
        ),
      });
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
                <Pressable
                  className="p-6"
                  onPress={() =>
                    triggerBulkDelete(bulkDeleteConfirm('jenis pembayaran', selectedItems))
                  }
                >
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
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
          <FlatList
            data={paymentTypes}
            className="flex-1"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(item) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(item);
                  } else {
                    router.navigate(`/(main)/management/payment-type/detail/${item.id}` as any);
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(item)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="sm">
                    <Heading size="sm">{item.name}</Heading>
                    {item.isDefault && (
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
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Tidak ada paymentType</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH JENIS PEMBAYARAN</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
