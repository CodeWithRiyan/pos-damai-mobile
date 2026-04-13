import AreaChart from '@/components/area-chart';
import BarChart from '@/components/bar-chart';
import FilterAccordion from '@/components/filter-accordion';
import Header from '@/components/header';
import {
  Heading,
  HStack,
  Pressable,
  Radio,
  RadioGroup,
  RadioLabel,
  Text,
  VStack,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Grid, GridItem } from '@/components/ui/grid';
import { SolarIconBold, SolarIconBoldProps } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { DateFilterType, Status } from '@/constants';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useTransactions } from '@/hooks/use-transaction';
import { useTransactionStore } from '@/stores/transaction';
import { formatDisplayRefId } from '@/utils/reference';
import { FlashList } from '@shopify/flash-list';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import TransactionFilter, {
  TransactionFilterFormValues,
  transactionFilterInitialValues,
} from './filter';

import { formatNumber, formatRp } from '@/utils/format';
interface ChartCategory {
  name: string;
  code: string;
  type: string;
}

const chartCategoryDefinitions: ChartCategory[] = [
  { name: 'Total Transaksi', code: 'totalTransaction', type: 'fixed' },
  { name: 'Pendapatan', code: 'gmv', type: 'currency' },
  { name: 'Keuntungan', code: 'profit', type: 'currency' },
];

export default function TransactionHistory({ isReport }: { isReport?: boolean }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const header = isReport && !customerId ? 'LAPORAN PENJUALAN' : 'RIWAYAT TRANSAKSI';
  const router = useRouter();

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilterFormValues>(
    transactionFilterInitialValues,
  );
  const [chartCategory, setChartCategory] = useState('totalTransaction');
  const [chartType, setChartType] = useState('area-chart');
  const {
    data: allTransactions,
    isLoading,
    refetch,
  } = useTransactions({
    customerId,
    userId: transactionFilter.userId || undefined,
    paymentTypeNames: transactionFilter.paymentTypeNames || [],
    dateType: transactionFilter.dateType,
    startDate: transactionFilter.startDate,
    endDate: transactionFilter.endDate,
    search: transactionFilter.search || undefined,
  });

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(useTransactionStore, handleVersionChange);

  const completedTransactions = useMemo(
    () => allTransactions?.filter((t) => t.status === Status.COMPLETED) ?? [],
    [allTransactions],
  );

  const groupingChartData = useMemo(() => {
    const now = dayjs();
    const isToday = transactionFilter.dateType === DateFilterType.TODAY;
    const isThisYear = transactionFilter.dateType === DateFilterType.THIS_YEAR;

    // Build the full list of keys to display (filling gaps with 0)
    const allKeys: string[] = [];
    if (isToday) {
      const currentHour = now.hour();
      for (let h = 0; h <= currentHour; h++) {
        allKeys.push(now.startOf('day').add(h, 'hour').format('YYYY-MM-DD HH'));
      }
    } else if (isThisYear) {
      // For THIS_YEAR, use months (01-12)
      const currentMonth = now.month(); // 0-indexed (0 = January)
      for (let m = 0; m <= currentMonth; m++) {
        allKeys.push(now.startOf('year').add(m, 'month').format('YYYY-MM'));
      }
    } else {
      let start: dayjs.Dayjs;
      let end: dayjs.Dayjs;
      if (transactionFilter.dateType === DateFilterType.THIS_WEEK) {
        const day = now.day();
        const diff = day === 0 ? -6 : 1 - day;
        start = now.startOf('day').add(diff, 'day');
        end = now.startOf('day');
      } else if (transactionFilter.dateType === DateFilterType.THIS_MONTH) {
        start = now.startOf('month');
        end = now.startOf('day');
      } else if (
        transactionFilter.dateType === DateFilterType.CUSTOM &&
        transactionFilter.startDate &&
        transactionFilter.endDate
      ) {
        start = dayjs(transactionFilter.startDate).startOf('day');
        end = dayjs(transactionFilter.endDate).startOf('day');
        if (end.isAfter(now.startOf('day'))) end = now.startOf('day');
      } else {
        // No filter or unknown — just use whatever dates appear in the data
        start = dayjs(0);
        end = now.startOf('day');
      }
      let cursor = start;
      while (!cursor.isAfter(end)) {
        allKeys.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'day');
      }
    }

    // Aggregate transactions
    const grouped = new Map<string, { totalTransaction: number; gmv: number; profit: number }>();
    for (const t of completedTransactions) {
      const d = dayjs(t.createdAt ?? t.transactionDate);
      let key: string;
      if (isToday) {
        key = d.format('YYYY-MM-DD HH');
      } else if (isThisYear) {
        key = d.format('YYYY-MM');
      } else {
        key = d.format('YYYY-MM-DD');
      }
      const existing = grouped.get(key) ?? {
        totalTransaction: 0,
        gmv: 0,
        profit: 0,
      };
      grouped.set(key, {
        totalTransaction: existing.totalTransaction + 1,
        gmv: existing.gmv + t.totalAmount,
        profit: existing.profit + (t.totalProfit ?? 0),
      });
    }

    // If allKeys is empty (no-filter case), fall back to keys from data sorted
    const keys =
      allKeys.length > 0 ? allKeys : Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

    return keys.map((key) => ({
      date: key,
      ...(grouped.get(key) ?? { totalTransaction: 0, gmv: 0, profit: 0 }),
    }));
  }, [completedTransactions, transactionFilter]);

  const chartTypeOptions: {
    label: string;
    icon: SolarIconBoldProps['name'];
    value: string;
  }[] = [
    {
      label: 'Area Chart',
      icon: 'DiagramUp',
      value: 'area-chart',
    },
    { label: 'Bar Chart', icon: 'Chart', value: 'bar-chart' },
  ];

  const chartCategoryOptions = chartCategoryDefinitions.map((item) => {
    const totalGmv = completedTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalProfit = completedTransactions.reduce((sum, t) => sum + (t.totalProfit ?? 0), 0);

    const value = completedTransactions.reduce((sum, t) => {
      if (item.code === 'totalTransaction') return sum + 1;
      if (item.code === 'gmv') return sum + t.totalAmount;
      return sum + (t.totalProfit ?? 0);
    }, 0);

    const profitPercentage = totalGmv > 0 ? ((totalProfit / totalGmv) * 100).toFixed(1) : '0.0';

    return { ...item, value, profitPercentage };
  });

  const chartData = groupingChartData.map((d) => {
    const isToday = transactionFilter.dateType === DateFilterType.TODAY;
    const isThisYear = transactionFilter.dateType === DateFilterType.THIS_YEAR;

    // For TODAY keys are "YYYY-MM-DD HH"; for THIS_YEAR keys are "YYYY-MM"; for other types keys are "YYYY-MM-DD"
    const parsed = isToday
      ? dayjs(d.date, 'YYYY-MM-DD HH')
      : isThisYear
        ? dayjs(d.date, 'YYYY-MM')
        : dayjs(d.date, 'YYYY-MM-DD');

    return {
      value:
        chartCategory === 'totalTransaction'
          ? d.totalTransaction
          : chartCategory === 'gmv'
            ? d.gmv
            : d.profit,
      label: isToday
        ? parsed.format('HH')
        : isThisYear
          ? parsed.format('MM') // Show month number (01-12)
          : parsed.format('DD'),
      pointerLabel: isToday
        ? parsed.format('HH:00')
        : isThisYear
          ? parsed.format('MMMM YYYY') // Show "January 2026" in tooltip
          : parsed.format('DD MMM YYYY'),
      pointerValue:
        chartCategory === 'totalTransaction'
          ? formatNumber(d.totalTransaction)
          : chartCategory === 'gmv'
            ? formatRp(d.gmv)
            : formatRp(d.profit),
    };
  });

  const transactions = completedTransactions;

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header={header} isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack
      className="flex-1 bg-white"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Header header={header} isGoBack />
      <ScrollView
        className="bg-background-0 shadow-lg flex-none"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" className="p-4 items-center">
          <FilterAccordion
            title={isReport ? 'Filter Laporan Penjualan' : 'Filter Riwayat Transaksi'}
            isExpanded={isFilterExpanded}
            onToggle={() => setIsFilterExpanded((prev) => !prev)}
          >
            <TransactionFilter
              filterValues={transactionFilter}
              onFilter={(data) => {
                setTransactionFilter(data);
                setIsFilterExpanded(false);
              }}
            />
          </FilterAccordion>
        </VStack>
      </ScrollView>
      <Grid _extra={{ className: 'grid-cols-2' }} className="flex-1">
        {isReport ? (
          <GridItem _extra={{ className: containerWidth > 768 ? 'col-span-1' : 'col-span-2' }}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <VStack space="md" className="p-4">
                <RadioGroup
                  value={chartCategory}
                  onChange={setChartCategory}
                  className="w-full flex-row gap-2"
                >
                  {chartCategoryOptions.map((o) => (
                    <Radio
                      key={o.code}
                      value={o.code}
                      size="md"
                      isInvalid={false}
                      isDisabled={false}
                      className={classNames(
                        'flex-1 py-2 border rounded-md flex items-center justify-center bg-primary-500',
                        chartCategory === o.code &&
                          'bg-primary-500/80 border-primary-500/80 text-white',
                      )}
                    >
                      <RadioLabel>
                        <VStack className="items-center">
                          <Text className="text-sm text-white">{o.name}</Text>
                          <Text className="text-sm text-white">
                            {o.type === 'currency' ? 'Rp ' : ''}
                            {formatNumber(o.value)}
                            {o.code === 'profit' ? ` (${o.profitPercentage}%)` : ''}
                          </Text>
                        </VStack>
                      </RadioLabel>
                    </Radio>
                  ))}
                </RadioGroup>
                <RadioGroup
                  value={chartType}
                  onChange={setChartType}
                  className="w-full flex-row gap-2"
                >
                  {chartTypeOptions.map((o) => (
                    <Radio
                      key={o.value}
                      value={o.value}
                      size="md"
                      isInvalid={false}
                      isDisabled={false}
                      className={classNames(
                        'flex-1 w-9 h-9 border rounded-md flex items-center justify-center bg-primary-500',
                        chartType === o.value &&
                          'bg-primary-500/80 border-primary-500/80 text-white',
                      )}
                    >
                      <RadioLabel>
                        <SolarIconBold name={o.icon} size={20} color="#fff" />
                      </RadioLabel>
                    </Radio>
                  ))}
                </RadioGroup>
                {chartType === 'area-chart' ? (
                  <AreaChart data={chartData} />
                ) : (
                  <BarChart data={chartData} />
                )}
              </VStack>
            </ScrollView>
          </GridItem>
        ) : (
          <GridItem
            _extra={{ className: isReport || containerWidth > 768 ? 'col-span-1' : 'col-span-2' }}
          >
            <FlashList
              data={transactions}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyExtractor={(transaction) => transaction.id}
              renderItem={({ item: transaction }) => {
                const date = transaction.createdAt ? dayjs(transaction.createdAt) : dayjs();
                return (
                  <Pressable
                    className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/transaction/receipt/[id]',
                        params: { id: transaction.id },
                      })
                    }
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
                        <HStack className="justify-between">
                          <VStack>
                            <Text className="text-typography-400 text-xs">Total</Text>
                            <Text className="font-bold">
                              Rp {formatNumber(transaction.totalAmount ?? 0)}
                            </Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">Pelanggan</Text>
                            <Text className="font-bold">{transaction.customerName}</Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">Pembayaran</Text>
                            <Text className="font-bold">{transaction.paymentTypeName}</Text>
                          </VStack>
                        </HStack>
                        <HStack className="justify-between">
                          <Text className="text-typography-400 font-bold">
                            No: {formatDisplayRefId(transaction.local_ref_id) || transaction.id}
                          </Text>
                        </HStack>
                      </VStack>
                      <Text className="text-typography-400 text-lg">›</Text>
                    </HStack>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Box className="flex-1 justify-center items-center py-10">
                  <Text className="text-gray-500">Belum ada histori transaksi</Text>
                </Box>
              }
            />
          </GridItem>
        )}
      </Grid>
    </VStack>
  );
}
