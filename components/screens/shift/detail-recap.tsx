import Header from '@/components/header';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Heading,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  SearchIcon,
  Text,
  VStack,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Grid, GridItem } from '@/components/ui/grid';
import { Spinner } from '@/components/ui/spinner';
import { ShiftTransactionHistory, useShiftDetail } from '@/hooks/use-shift';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react';
import { ScrollView } from 'react-native';

import { formatNumber } from '@/utils/format';
type TypeState = 'IN' | 'OUT';

export const helperInOut = (type: ShiftTransactionHistory['type']): TypeState => {
  if (type === 'INITIAL') return 'IN';
  if (type === 'SALES') return 'IN';
  if (type === 'INCOME') return 'IN';

  return 'OUT';
};

const typesOption: { label: string; value: TypeState }[] = [
  {
    label: 'Pemasukkan',
    value: 'IN',
  },
  {
    label: 'Pengeluaran',
    value: 'OUT',
  },
];

export default function ShiftDetailRecap() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [types, setTypes] = useState<TypeState[]>(['IN', 'OUT']);

  const { data: detailShift, isLoading } = useShiftDetail(id || '');

  const transactionHistory = (detailShift?.transactionHistory || []).filter(
    (f: { type: string }) => {
      return types.some((s) => s === helperInOut(f.type as ShiftTransactionHistory['type']));
    },
  );

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DETAIL REKAP SHIFT" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DETAIL REKAP SHIFT" isGoBack />
      <VStack space="md" className="p-4 shadow-lg bg-background-0 items-center">
        <HStack space="sm">
          <Input className="flex-1 border border-background-300 rounded-lg h-10">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField placeholder="Cari no transaksi" />
          </Input>
        </HStack>
        <Grid _extra={{ className: 'grid-cols-2' }}>
          {typesOption.map((t) => (
            <GridItem key={t.value} _extra={{ className: 'col-span-1' }} className="items-start">
              <Checkbox
                value={types.some((s) => s === t.value).toString()}
                isChecked={types.some((s) => s === t.value)}
                size="md"
                onChange={(v) => {
                  setTypes(v ? [...types, t.value] : types.filter((s) => s !== t.value));
                }}
              >
                <CheckboxIndicator className="w-[16px] h-[16px] border-[1px] rounded-md">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel className="text-sm">{t.label}</CheckboxLabel>
              </Checkbox>
            </GridItem>
          ))}
        </Grid>
      </VStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!transactionHistory || transactionHistory?.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Belum ada histori transaksi shift</Text>
          </Box>
        ) : (
          transactionHistory?.map(
            (trx: {
              transactionDate: string | number | Date | dayjs.Dayjs | null | undefined;
              id: Key | null | undefined;
              type: string;
              transactionId: any;
              note:
                | string
                | number
                | bigint
                | boolean
                | ReactElement<unknown, string | JSXElementConstructor<any>>
                | Iterable<ReactNode>
                | ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactPortal
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              ref: any;
              nominal: number;
            }) => {
              const date = trx.transactionDate ? dayjs(trx.transactionDate) : dayjs();
              return (
                <Pressable
                  key={trx.id}
                  className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                  onPress={() => {
                    if (trx.type === 'INITIAL') return;

                    router.push({
                      pathname: (trx.type === 'SALES' || trx.type === 'PURCHASES'
                        ? `/transaction/receipt/${trx.transactionId}`
                        : `/finance/receipt/${trx.transactionId}`) as any,
                      params: { id: trx.id as string },
                    });
                  }}
                >
                  <HStack space="xl" className="items-center">
                    <VStack>
                      <Text className="text-typography-500 font-bold">
                        {date.format('HH:mm:ss')}
                      </Text>
                      <HStack space="sm" className="items-center">
                        <Heading size="4xl">{date.format('DD')}</Heading>
                        <VStack>
                          <Text className="text-typography-500 font-bold">
                            {date.format('MMM')}
                          </Text>
                          <Text className="text-typography-500 font-bold">
                            {date.format('YYYY')}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                    <VStack space="sm" className="flex-1">
                      <HStack space="sm" className="items-center">
                        <Box
                          className={`w-4 h-4 rounded-full ${helperInOut(trx.type as ShiftTransactionHistory['type']) === 'IN' ? 'bg-success-500' : 'bg-error-500'}`}
                        ></Box>
                        <Text
                          className={`font-bold ${helperInOut(trx.type as ShiftTransactionHistory['type']) === 'IN' ? 'text-success-500' : 'text-error-500'}`}
                        >
                          {helperInOut(trx.type as ShiftTransactionHistory['type']) === 'IN'
                            ? 'PEMASUKKAN'
                            : 'PENGELUARAN'}
                        </Text>
                      </HStack>
                      <Text className="font-bold">{trx.note}</Text>
                      <Text className="text-typography-400 font-bold">
                        Ref: {trx.ref || trx.id}
                      </Text>
                    </VStack>
                    <HStack space="xl" className="items-center">
                      <VStack>
                        <Text className="text-typography-400 text-xs">Total Transaksi</Text>
                        <Text className="font-bold">Rp {formatNumber(trx.nominal)}</Text>
                      </VStack>
                      {trx.type !== 'INITIAL' ? (
                        <Text className="text-typography-400 text-lg">›</Text>
                      ) : (
                        <Text className="text-typography-400 text-lg"></Text>
                      )}
                    </HStack>
                  </HStack>
                </Pressable>
              );
            },
          )
        )}
      </ScrollView>
    </VStack>
  );
}
