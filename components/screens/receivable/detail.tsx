import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import {
  Box,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import {
  SolarIconBold,
  SolarIconBoldDuotone,
  SolarIconLinear,
} from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Receivable, useReceivableByUser } from '@/lib/api/receivable';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { formatRp } from '@/lib/utils/format';
export default function ReceivableDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const { data: receivableList = [], isLoading } = useReceivableByUser(userId);

  const [selectedItems, setSelectedItems] = useState<Receivable[] | null>(null);
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState<boolean>(false);
  const [transactionDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(['Lunas', 'Belum Lunas']);

  const receivable = receivableList[0];

  const handleReceivablePress = (receivable: Receivable) => {
    setSelectedItems((prev) => {
      if (prev?.some((r) => r.id === receivable.id)) {
        return prev.filter((r) => r.id !== receivable.id);
      }
      return [...(prev ?? []), receivable];
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: 'Delete All',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            hideActionDrawer();
          },
        },
      ],
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
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL PIUTANG"
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Piutang terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={() => setSelectedItems([])}
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
        <VStack space="md" className="flex-1">
          <VStack className="p-4">
            <HStack space="lg" className="relative rounded-lg bg-error-100 px-4 pt-4 pb-6 mb-4">
              <VStack className="flex-1">
                <HStack space="md">
                  <SolarIconBoldDuotone name="UserCircle" size={20} color="#3b82f6" />
                  <Text className="text-typography-500 text-sm">
                    {receivable?.user?.firstName || receivable?.user?.username || 'Unknown User'}
                  </Text>
                </HStack>
                <VStack className="mt-2">
                  <Text className="text-typography-500 text-sm">Total Belum Lunas</Text>
                  <Text className="text-error-500 font-bold">
                    {formatRp(
                      receivableList?.reduce(
                        (acc, curr) => acc + (curr.nominal - curr.totalRealization),
                        0,
                      ) ?? 0,
                    )}
                  </Text>
                </VStack>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">Jumlah Transaksi Belum Lunas</Text>
                <Text className="text-error-500 font-bold">
                  {receivableList?.filter((f) => f.totalRealization !== f.nominal).length}
                </Text>
              </VStack>
              <HStack className="absolute -bottom-4 right-0 left-0 justify-center">
                <Pressable
                  className="items-center justify-center h-10 px-10 rounded-lg bg-primary-500 active:bg-primary-500/90"
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/payable-receivable/receivable/detail/${userId}/realization/add?receivableIds=${receivableList?.map((m) => m.id).join('-')}` as any,
                    );
                  }}
                >
                  <Text size="lg" className="text-sm text-white font-bold">
                    LUNASI SEKARANG
                  </Text>
                </Pressable>
              </HStack>
            </HStack>
          </VStack>
        </VStack>
        <VStack space="md" className="px-4 mb-4 mt-4">
          <HStack space="sm" className="items-center">
            <Pressable className="size-10 items-center justify-center" onPress={() => {}}>
              <SolarIconLinear name="Sort" size={20} color="#3d2117" />
            </Pressable>
            <>
              <Pressable
                onPress={() => setShowTransactionDatePicker(true)}
                className={`flex-1 border border-background-300 rounded px-3 py-2`}
              >
                <HStack className="items-center justify-between">
                  <Text>
                    {transactionDate instanceof Date
                      ? dayjs(transactionDate).format('DD/MM/YYYY')
                      : 'Pilih Tanggal'}
                  </Text>
                  <Icon as={CalendarIcon} size="md" className="mr-2" />
                </HStack>
              </Pressable>
              {showTransactionDatePicker && (
                <DateTimePicker
                  mode="date"
                  value={transactionDate instanceof Date ? transactionDate : new Date()}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowTransactionDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setDueDate(selectedDate);
                    }
                  }}
                />
              )}
            </>
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
        <VStack>
          {receivableList
            ?.filter((r) =>
              statuses.includes(r.nominal - r.totalRealization > 0 ? 'Belum Lunas' : 'Lunas'),
            )
            ?.map((receivable) => (
              <Pressable
                key={receivable.id}
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  selectedItems?.some((r) => r.id === receivable.id) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (!!selectedItems?.length) {
                    handleReceivablePress(receivable);
                  } else {
                    router.navigate(
                      `/(main)/management/payable-receivable/receivable/detail/${userId}/realization/detail?receivableIds=${receivable?.id}` as any,
                    );
                    setSelectedItems(null);
                  }
                }}
                onLongPress={() => handleReceivablePress(receivable)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    {!!selectedItems?.length && (
                      <Checkbox
                        value={selectedItems?.some((r) => r.id === receivable.id).toString()}
                        isChecked={selectedItems?.some((r) => r.id === receivable.id)}
                        size="md"
                        onChange={() => handleReceivablePress(receivable)}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                      </Checkbox>
                    )}
                    <VStack>
                      <Heading size="sm">
                        {dayjs(receivable.createdAt).format('DD/MM/YYYY')}
                      </Heading>
                      <Text size="xs" className="text-blue-500 font-bold">
                        {formatRp(receivable.nominal)}
                      </Text>
                      <Text size="xs" className="text-slate-500">
                        {`JT: ${dayjs(receivable.dueDate).format('DD/MM/YYYY')}`}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Box
                        className={`w-2 h-2 rounded-full${receivable.totalRealization < receivable.nominal ? ' bg-red-500' : ' bg-green-500'}`}
                      />
                      <Text size="xs" className="text-primary-500 text-sm font-bold">
                        {receivable.totalRealization < receivable.nominal ? 'Belum Lunas' : 'Lunas'}
                      </Text>
                    </HStack>
                    {receivable.totalRealization < receivable.nominal && (
                      <Text size="xs" className="font-bold text-error-500">
                        {formatRp(receivable.nominal - receivable.totalRealization)}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            ))}
          {receivableList?.length === 0 && (
            <Box className="p-8 items-center">
              <Text className="text-slate-400 italic">No receivable found</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        {!!selectedItems?.length ? (
          <Pressable
            className="w-full rounded-md h-10 flex justify-center items-center bg-primary-500 active:bg-primary-500/90"
            onPress={() => {
              router.navigate(
                `/(main)/management/payable-receivable/receivable/detail/${userId}/realization/add?receivableIds=${selectedItems?.map((m) => m.id).join('-')}` as any,
              );
            }}
          >
            <Text size="sm" className="text-typography-0 font-bold">
              {selectedItems?.length === 1
                ? 'TERIMA PIUTANG'
                : `TERIMA ${selectedItems?.length} PIUTANG`}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            className="w-full rounded-sm h-10 flex justify-center items-center bg-error-50 border border-error-500"
            onPress={() => {
              router.navigate(`/(main)/management/payable-receivable/receivable/add` as any);
            }}
          >
            <Text size="sm" className="text-error-500 font-bold">
              TAMBAH PIUTANG
            </Text>
          </Pressable>
        )}
      </VStack>
    </VStack>
  );
}
