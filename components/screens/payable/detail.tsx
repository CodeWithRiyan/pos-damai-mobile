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
import { SolarIconBoldDuotone, SolarIconLinear } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Payable, usePayableBySupplier } from '@/hooks/use-payable';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { usePayableStore } from '@/stores/payable';
import DateTimePicker from '@react-native-community/datetimepicker';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';

import { useSupplier } from '@/hooks/use-supplier';
import { useBreakpointStore } from '@/stores/breakpoint';
import { formatRp } from '@/utils/format';
export default function PayableDetail({ isReport }: { isReport?: boolean }) {
  const { deviceWidth } = useBreakpointStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  const supplierId = params.supplierId as string;

  const { data: supplier, isLoading: isSupplierLoading } = useSupplier(supplierId);
  const {
    data: payableList = [],
    isLoading: isPayableLoading,
    refetch: refetchPayable,
  } = usePayableBySupplier(supplierId);

  const onRefetch = useCallback(() => {
    refetchPayable();
  }, [refetchPayable]);

  useStoreVersionSync(usePayableStore, onRefetch);

  useFocusEffect(
    useCallback(() => {
      refetchPayable();
    }, []),
  );

  const isLoading = isSupplierLoading || isPayableLoading;

  const [selectedItems, setSelectedItems] = useState<Payable[] | null>(null);
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState<boolean>(false);
  const [transactionDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(['Lunas', 'Belum Lunas']);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _payable = payableList[0];

  const handlePayablePress = (payable: Payable) => {
    setSelectedItems((prev) => {
      if (prev?.some((r) => r.id === payable.id)) {
        return prev.filter((r) => r.id !== payable.id);
      }
      return [...(prev ?? []), payable];
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
        header="DETAIL HUTANG"
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Hutang terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={() => setSelectedItems([])}
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="flex-1">
          <VStack className="p-4">
            <HStack
              space="lg"
              className={classNames(
                'relative rounded-lg bg-error-100 px-4 pt-4 pb-6 mb-4',
                isReport && 'pb-4 mb-0',
              )}
            >
              <VStack className="flex-1">
                <HStack space="md">
                  <SolarIconBoldDuotone name="UserCircle" size={20} color="#3b82f6" />
                  <Text className="text-typography-500 text-sm">
                    {supplier?.name || 'Unknown Supplier'}
                  </Text>
                </HStack>
                <VStack className="mt-2">
                  <Text className="text-typography-500 text-sm">Total Belum Lunas</Text>
                  <Text className="text-error-500 font-bold">
                    {formatRp(
                      payableList?.reduce(
                        (acc, curr) => acc + (curr.nominal - curr.totalRealization),
                        0,
                      ) ?? 0,
                    )}
                  </Text>
                </VStack>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">
                  {deviceWidth > 768 ? 'Jumlah Transaksi Belum Lunas' : 'Jumlah Transaksi'}
                </Text>
                <Text className="text-error-500 font-bold">
                  {payableList?.filter((f) => f.totalRealization !== f.nominal).length}
                </Text>
              </VStack>
              {!isReport && (
                <HStack className="absolute -bottom-4 right-0 left-0 justify-center">
                  <Pressable
                    className="items-center justify-center h-10 px-10 rounded-lg bg-primary-500 active:bg-primary-500/90"
                    onPress={() => {
                      router.push(
                        `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/add?payableIds=${payableList?.map((m) => m.id).join('-')}` as any,
                      );
                    }}
                  >
                    <Text size="lg" className="text-sm text-white font-bold">
                      LUNASI SEKARANG
                    </Text>
                  </Pressable>
                </HStack>
              )}
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
          {payableList
            ?.filter((r) =>
              statuses.includes(r.nominal - r.totalRealization > 0 ? 'Belum Lunas' : 'Lunas'),
            )
            ?.map((payable) => (
              <Pressable
                key={payable.id}
                className={`p-4 rounded-lg border-b border-gray-300 active:bg-gray-100 ${
                  selectedItems?.some((r) => r.id === payable.id) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (!!selectedItems?.length) {
                    handlePayablePress(payable);
                  } else {
                    router.push(
                      !isReport
                        ? `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/detail?payableIds=${payable?.id}`
                        : `/(main)/management/customer-supplier/supplier/payable/${supplierId}/realization/detail?payableIds=${payable?.id}`,
                    );
                    setSelectedItems(null);
                  }
                }}
                onLongPress={() => !isReport && handlePayablePress(payable)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    {!!selectedItems?.length && (
                      <Checkbox
                        value={selectedItems?.some((r) => r.id === payable.id).toString()}
                        isChecked={selectedItems?.some((r) => r.id === payable.id)}
                        size="md"
                        onChange={() => handlePayablePress(payable)}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                      </Checkbox>
                    )}
                    <VStack>
                      <Heading size="sm">{dayjs(payable.createdAt).format('DD/MM/YYYY')}</Heading>
                      <Text size="xs" className="text-blue-500 font-bold">
                        {formatRp(payable.nominal)}
                      </Text>
                      <Text size="xs" className="text-slate-500">
                        {`JT: ${dayjs(payable.dueDate).format('DD/MM/YYYY')}`}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Box
                        className={`w-2 h-2 rounded-full${payable.totalRealization < payable.nominal ? ' bg-red-500' : ' bg-green-500'}`}
                      />
                      <Text size="xs" className="text-primary-500 text-sm font-bold">
                        {payable.totalRealization < payable.nominal ? 'Belum Lunas' : 'Lunas'}
                      </Text>
                    </HStack>
                    {payable.totalRealization < payable.nominal && (
                      <Text size="xs" className="font-bold text-error-500">
                        {formatRp(payable.nominal - payable.totalRealization)}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            ))}
          {payableList?.length === 0 && (
            <Box className="p-8 items-center">
              <Text className="text-slate-400 italic">No payable found</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        {!!selectedItems?.length && !isReport && (
          <Pressable
            className="w-full rounded-md h-10 flex justify-center items-center bg-primary-500 active:bg-primary-500/90"
            onPress={() => {
              router.push(
                `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/add?payableIds=${selectedItems?.map((m) => m.id).join('-')}` as any,
              );
            }}
          >
            <Text size="sm" className="text-typography-0 font-bold">
              {selectedItems?.length === 1
                ? 'BAYAR HUTANG'
                : `BAYAR ${selectedItems?.length} HUTANG`}
            </Text>
          </Pressable>
        )}
      </VStack>
    </VStack>
  );
}
