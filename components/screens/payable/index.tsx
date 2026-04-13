import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Icon,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold, SolarIconBoldDuotone } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/db/client';
import { PayableBySupplier, useBulkDeletePayable, usePayableList } from '@/hooks/use-payable';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { usePayableStore } from '@/stores/payable';
import { exportPayables } from '@/utils/excel';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from '@shopify/flash-list';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';

import { formatRp } from '@/utils/format';
import { Grid, GridItem } from '../../ui/grid';
export default function PayableList({ isReport }: { isReport?: boolean }) {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data: payableBySupplier = [], isLoading: isLoadingFetch, refetch } = usePayableList();
  const deleteMutation = useBulkDeletePayable();

  const isLoading = isLoadingFetch || deleteMutation.isPending;
  const [selectedItems, setSelectedItems] = useState<PayableBySupplier[] | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(['Lunas', 'Belum Lunas']);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(usePayableStore, handleVersionChange);

  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportPayables(payableBySupplier);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handlePayablePress = (payable: PayableBySupplier) => {
    setSelectedItems((prev) => {
      if (prev?.some((r) => r.supplierId === payable.supplierId)) {
        return prev.filter((r) => r.supplierId !== payable.supplierId);
      }
      return [...(prev ?? []), payable];
    });
  };

  const handleDeletePress = () => {
    const supplierIds = selectedItems?.map((m) => m.supplierId) || [];

    showPopUpConfirm({
      title: 'HAPUS HUTANG',
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{supplierIds?.length}</Text>
          {` hutang? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'HAPUS',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => confirmDelete(supplierIds),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (supplierIds: string[]) => {
    if (!supplierIds.length) return;

    // Get all payable IDs from selected suppliers
    const payableIds = selectedItems?.flatMap((item) => item.payables.map((p) => p.id)) || [];

    deleteMutation.mutate(payableIds, {
      onSuccess: () => {
        setSelectedItems(null);
        hidePopUpConfirm();
        refetch();

        showSuccessToast(toast, 'Hutang berhasil dihapus');
      },
      onError: (error) => {
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
    <Box
      className="flex-1 bg-white"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width || 0)}
    >
      <Header
        header={isReport ? 'LAPORAN HUTANG' : 'HUTANG'}
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Hutang terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          !isReport && (
            <HStack space="sm" className="w-[72px]">
              {!!selectedItems?.length ? (
                isLoading ? (
                  <Box className="p-6">
                    <Spinner size="small" color="#FFFFFF" />
                  </Box>
                ) : (
                  <Pressable className="p-6" onPress={() => handleDeletePress()}>
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
                    style={{ transform: [{ rotate: '90deg' }] }}
                  />
                </Pressable>
              )}
            </HStack>
          )
        }
      />
      <Box className="flex-1 bg-white">
        <VStack className="flex-1">
          <VStack
            space="md"
            className="p-4 shadow-lg bg-background-0 border-b border-background-200"
          >
            <Grid _extra={{ className: 'grid-cols-2' }} className="gap-2">
              <GridItem _extra={{ className: containerWidth > 768 ? 'col-span-1' : 'col-span-2' }}>
                <Input className="border border-background-300 rounded-lg h-10">
                  <InputSlot className="pl-3">
                    <InputIcon as={SearchIcon} />
                  </InputSlot>
                  <InputField
                    placeholder="Cari nama supplier"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </Input>
              </GridItem>
              <GridItem _extra={{ className: containerWidth > 768 ? 'col-span-1' : 'col-span-2' }}>
                <Pressable
                  onPress={() => setShowDueDatePicker(true)}
                  className={`border border-background-300 px-3 h-10 rounded-lg justify-center`}
                >
                  <HStack className="items-center justify-between">
                    <Text>
                      {dueDate instanceof Date
                        ? dayjs(dueDate).format('DD/MM/YYYY')
                        : 'Jatuh Tempo'}
                    </Text>
                    <Icon as={CalendarIcon} size="md" className="mr-2" />
                  </HStack>
                </Pressable>
                {showDueDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={dueDate instanceof Date ? dueDate : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDueDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        setDueDate(selectedDate);
                      }
                    }}
                  />
                )}
              </GridItem>
            </Grid>
            <HStack space="lg" className="rounded-lg bg-error-100 p-4">
              <SolarIconBoldDuotone name="Card" size={40} color="#ef4444" />
              <VStack className="flex-1">
                <Text className="text-typography-500 text-sm">Total Belum Lunas</Text>
                <Heading size="xl" className="text-error-500">
                  {formatRp(payableBySupplier.reduce((acc, curr) => acc + curr.totalPayable, 0))}
                </Heading>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">
                  {containerWidth > 768 ? 'Jumlah Transaksi Belum Lunas' : 'Jumlah Transaksi'}
                </Text>
                <Text className="text-error-500 font-bold">
                  {payableBySupplier.filter((f) => f.totalPayable > 0).length}
                </Text>
              </VStack>
            </HStack>
            <HStack space="sm">
              <Checkbox
                value={statuses.some((s) => s === 'Belum Lunas').toString()}
                isChecked={statuses.some((s) => s === 'Belum Lunas')}
                size="md"
                onChange={(v) => {
                  setStatuses(
                    v ? [...statuses, 'Belum Lunas'] : statuses.filter((s) => s !== 'Belum Lunas'),
                  );
                }}
              >
                <CheckboxIndicator className="w-[16px] h-[16px] border-[1px] rounded-md">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel className="text-sm">Belum Lunas</CheckboxLabel>
              </Checkbox>
              <Checkbox
                value={statuses.some((s) => s === 'Lunas').toString()}
                isChecked={statuses.some((s) => s === 'Lunas')}
                size="md"
                onChange={(v) => {
                  setStatuses(v ? [...statuses, 'Lunas'] : statuses.filter((s) => s !== 'Lunas'));
                }}
              >
                <CheckboxIndicator className="w-[16px] h-[16px] border-[1px] rounded-md">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel className="text-sm">Lunas</CheckboxLabel>
              </Checkbox>
            </HStack>
          </VStack>
          <FlashList
            data={payableBySupplier
              ?.filter((r) => statuses.includes(r.totalPayable > 0 ? 'Belum Lunas' : 'Lunas'))
              ?.filter((r) => r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))}
            className="flex-1"
            keyExtractor={(payable) => payable.supplierId}
            renderItem={({ item: payable }) => (
              <Pressable
                className={`p-4 rounded-lg border-b border-gray-300 active:bg-gray-100 ${
                  selectedItems?.some((r) => r.supplierId === payable.supplierId)
                    ? 'bg-gray-100'
                    : ''
                }`}
                onPress={() => {
                  if (!!selectedItems?.length) {
                    handlePayablePress(payable);
                  } else {
                    router.push(
                      `/(main)/management/payable-receivable/payable/detail/${payable.supplierId}` as any,
                    );
                    setSelectedItems(null);
                  }
                }}
                onLongPress={() => !isReport && handlePayablePress(payable)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                      <Text className="text-brand-primary font-bold">
                        {payable.supplierName.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{payable.supplierName}</Heading>
                      <Text size="xs" className="text-slate-500">
                        {dayjs(payable.nearestDueDate).format('DD/MM/YYYY')}
                      </Text>
                      <Text size="xs" className="text-blue-500">
                        {formatRp(payable.totalNominal)}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Box
                        className={`w-2 h-2 rounded-full${payable.totalPayable > 0 ? ' bg-red-500' : ' bg-green-500'}`}
                      />
                      <Text size="xs" className="text-brand-primary text-sm font-bold">
                        {payable.totalPayable > 0 ? 'Belum Lunas' : 'Lunas'}
                      </Text>
                    </HStack>
                    {payable.totalPayable > 0 && (
                      <Text size="xs" className="font-bold text-error-500">
                        {formatRp(payable.totalPayable)}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No payable found</Text>
              </Box>
            }
          />
        </VStack>
      </Box>
    </Box>
  );
}
