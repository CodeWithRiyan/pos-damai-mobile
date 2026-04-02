import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import {
  Button,
  ButtonText,
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
import {
  SolarIconBold,
  SolarIconBoldDuotone,
  SolarIconLinear,
} from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { showErrorToast } from '@/lib/utils/toast';
import {
  Receivable,
  useBulkDeleteReceivable,
  useReceivableList,
} from '@/lib/api/receivable';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlashList } from '@shopify/flash-list';

import { formatRp } from '@/lib/utils/format';
export default function ReceivableList({ isReport }: { isReport?: boolean }) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data: receivableByUser = [], isLoading: isLoadingFetch } = useReceivableList();
  const deleteMutation = useBulkDeleteReceivable();

  const isLoading = isLoadingFetch || deleteMutation.isPending;
  const [selectedItems, setSelectedItems] = useState<Receivable[] | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(['Lunas', 'Belum Lunas']);
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();

  const handleReceivablePress = (receivable: Receivable) => {
    setSelectedItems((prev) => {
      if (prev?.some((r) => r.userId === receivable.userId)) {
        return prev.filter((r) => r.userId !== receivable.userId);
      }
      return [...(prev ?? []), receivable];
    });
  };

  const handleAdd = () => {
    setSelectedItems(null);
    router.push('/(main)/management/payable-receivable/receivable/add' as any);
  };

  const handleDeletePress = () => {
    const userIds = selectedItems?.map((m) => m.userId) || [];

    showPopUpConfirm({
      title: 'HAPUS PIUTANG',
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{userIds?.length}</Text>
          {` piutang? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'HAPUS',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => confirmDelete(userIds),
    });
  };

  const confirmDelete = async (userIds: string[]) => {
    if (!userIds.length) return;
    // Get all receivable IDs from selected users
    const receivableIds = selectedItems?.map((item) => item.id) || [];
    deleteMutation.mutate(receivableIds, {
      onSuccess: () => {
        setSelectedItems(null);
        hidePopUpConfirm();
        // Since useReceivableList is a hook that likely uses queryKey ['receivables'],
        // the mutation should invalidate it. But adding refetch explicitly is safer if defined.

        toast.show({
          placement: 'top',
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Piutang berhasil dihapus</ToastTitle>
            </Toast>
          ),
        });
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
    <Box className="flex-1 bg-white">
      <Header
        header={isReport ? 'LAPORAN PIUTANG' : 'PIUTANG'}
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Piutang terpilih"
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
                <Pressable className="p-6" onPress={() => {}}>
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
            <HStack space="sm" className="items-center">
              <Pressable className="size-10 items-center justify-center" onPress={() => {}}>
                <SolarIconLinear name="Filter" size={20} color="#3d2117" />
              </Pressable>
              <Input className="flex-1 border border-background-300 rounded-lg h-10">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder="Cari nama user"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </Input>
              <>
                <Pressable
                  onPress={() => setShowDueDatePicker(true)}
                  className={`flex-1 border border-background-300 px-3 h-10 rounded-lg justify-center`}
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
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDueDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        setDueDate(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            </HStack>
            <HStack space="lg" className="rounded-lg bg-error-100 p-4">
              <SolarIconBoldDuotone name="Card" size={40} color="#ef4444" />
              <VStack className="flex-1">
                <Text className="text-typography-500 text-sm">Total Belum Lunas</Text>
                <Heading size="xl" className="text-error-500">
                  {formatRp(
                    receivableByUser.reduce(
                      (sum, r) => sum + (r.totalReceivable - r.totalRealization),
                      0,
                    ),
                  )}
                </Heading>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">Jumlah Transaksi Belum Lunas</Text>
                <Text className="text-error-500 font-bold">
                  {receivableByUser.filter((f) => f.totalRealization !== f.totalReceivable).length}
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
            data={receivableByUser
              ?.filter((r) =>
                statuses.includes(
                  r.totalReceivable - r.totalRealization > 0 ? 'Belum Lunas' : 'Lunas',
                ),
              )
              ?.filter((r) => (r.userName ?? '').toLowerCase().includes(searchQuery.toLowerCase()))}
            className="flex-1"
            keyExtractor={(receivable) => receivable.userId}
            renderItem={({ item: receivable }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  selectedItems?.some((r) => r.userId === receivable.userId) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (!!selectedItems?.length) {
                    handleReceivablePress(receivable);
                  } else {
                    router.navigate(
                      `/(main)/management/payable-receivable/receivable/detail/${receivable.userId}` as any,
                    );
                    setSelectedItems(null);
                  }
                }}
                onLongPress={() => !isReport && handleReceivablePress(receivable)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                      <Text className="text-brand-primary font-bold">
                        {receivable.userName?.substring(0, 1).toUpperCase() || '?'}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{receivable.userName}</Heading>
                      <Text size="xs" className="text-slate-500">
                        {receivable.nearestDueDate
                          ? dayjs(receivable.nearestDueDate).format('DD/MM/YYYY')
                          : '-'}
                      </Text>
                      <Text size="xs" className="text-blue-500">
                        {formatRp(receivable.totalReceivable)}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Box
                        className={`w-2 h-2 rounded-full${receivable.totalRealization < receivable.totalReceivable ? ' bg-red-500' : ' bg-green-500'}`}
                      />
                      <Text size="xs" className="text-brand-primary text-sm font-bold">
                        {receivable.totalRealization < receivable.totalReceivable
                          ? 'Belum Lunas'
                          : 'Lunas'}
                      </Text>
                    </HStack>
                    {receivable.totalRealization < receivable.totalReceivable && (
                      <Text size="xs" className="font-bold text-error-500">
                        {formatRp(receivable.totalReceivable - receivable.totalRealization)}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No receivable found</Text>
              </Box>
            }
          />
          {!isReport && (
            <HStack className="w-full p-4">
              <Button
                size="sm"
                className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAdd}
              >
                <ButtonText className="text-white">TAMBAH PIUTANG</ButtonText>
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
