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
import { Spinner } from '@/components/ui/spinner';
import { usePurchases } from '@/hooks/use-purchasing';
import { DateFilterType, PaymentMethod, Status } from '@/constants';
import { formatDisplayRefId } from '@/utils/reference';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { usePurchasingStore } from '@/stores/purchasing';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ScrollView } from 'react-native';

import AreaChart from '@/components/area-chart';
import BarChart from '@/components/bar-chart';
import FilterAccordion from '@/components/filter-accordion';
import { Grid, GridItem } from '@/components/ui/grid';
import { SolarIconBold, SolarIconBoldProps } from '@/components/ui/solar-icon-wrapper';
import { formatNumber, formatRp } from '@/utils/format';
import classNames from 'classnames';
import { useMemo, useState, useCallback } from 'react';
import PurchasingFilterHistory, {
  PurchasingFilterFormValues,
  purchasingFilterInitialValues,
} from './filter-history';
interface ChartCategory {
  name: string;
  code: string;
  type: string;
}

const chartCategoryDefinitions: ChartCategory[] = [
  { name: 'Total Transaksi', code: 'totalTransaction', type: 'fixed' },
  { name: 'Pengeluaran', code: 'expenses', type: 'currency' },
];

export default function PurchasingHistory({
  isReport,
  lockedSupplierId,
}: {
  isReport?: boolean;
  lockedSupplierId?: string;
}) {
  const header = isReport ? 'LAPORAN PEMBELIAN' : 'RIWAYAT PEMBELIAN';
  const router = useRouter();

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [purchasingFilter, setPurchasingFilter] = useState<PurchasingFilterFormValues>({
    ...purchasingFilterInitialValues,
    supplierId: lockedSupplierId || purchasingFilterInitialValues.supplierId,
  });
  const [chartCategory, setChartCategory] = useState('totalTransaction');
  const [chartType, setChartType] = useState('area-chart');
  const {
    data: allPurchases,
    isLoading,
    refetch,
  } = usePurchases({
    supplierId: purchasingFilter.supplierId || undefined,
    userId: purchasingFilter.userId || undefined,
    paymentTypeIds: purchasingFilter.paymentTypeIds || [],
    dateType: purchasingFilter.dateType,
    startDate: purchasingFilter.startDate?.toISOString(),
    endDate: purchasingFilter.endDate?.toISOString(),
    search: purchasingFilter.search || undefined,
  });

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(usePurchasingStore, handleVersionChange);

  const completedPurchasing = useMemo(
    () => allPurchases?.filter((p) => p.status === Status.COMPLETED) ?? [],
    [allPurchases],
  );

  const groupingChartData = useMemo(() => {
    const now = dayjs();
    const isToday = purchasingFilter.dateType === DateFilterType.TODAY;
    const isThisYear = purchasingFilter.dateType === DateFilterType.THIS_YEAR;

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
      if (purchasingFilter.dateType === DateFilterType.THIS_WEEK) {
        const day = now.day();
        const diff = day === 0 ? -6 : 1 - day;
        start = now.startOf('day').add(diff, 'day');
        end = now.startOf('day');
      } else if (purchasingFilter.dateType === DateFilterType.THIS_MONTH) {
        start = now.startOf('month');
        end = now.startOf('day');
      } else if (
        purchasingFilter.dateType === DateFilterType.CUSTOM &&
        purchasingFilter.startDate &&
        purchasingFilter.endDate
      ) {
        start = dayjs(purchasingFilter.startDate).startOf('day');
        end = dayjs(purchasingFilter.endDate).startOf('day');
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

    // Aggregate purchasing
    const grouped = new Map<string, { totalTransaction: number; expenses: number }>();
    for (const t of completedPurchasing) {
      const d = dayjs(t.createdAt);
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
        expenses: 0,
      };
      grouped.set(key, {
        totalTransaction: existing.totalTransaction + 1,
        expenses: existing.expenses + (t.totalAmount ?? 0),
      });
    }

    // If allKeys is empty (no-filter case), fall back to keys from data sorted
    const keys =
      allKeys.length > 0 ? allKeys : Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

    return keys.map((key) => ({
      date: key,
      ...(grouped.get(key) ?? { totalTransaction: 0, expenses: 0 }),
    }));
  }, [completedPurchasing, purchasingFilter]);

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
    const value = completedPurchasing.reduce((sum, t) => {
      if (item.code === 'totalTransaction') return sum + 1;
      return sum + t.totalAmount;
    }, 0);

    return { ...item, value };
  });

  const chartData = groupingChartData.map((d) => {
    const isToday = purchasingFilter.dateType === DateFilterType.TODAY;
    const isThisYear = purchasingFilter.dateType === DateFilterType.THIS_YEAR;

    // For TODAY keys are "YYYY-MM-DD HH"; for THIS_YEAR keys are "YYYY-MM"; for other types keys are "YYYY-MM-DD"
    const parsed = isToday
      ? dayjs(d.date, 'YYYY-MM-DD HH')
      : isThisYear
        ? dayjs(d.date, 'YYYY-MM')
        : dayjs(d.date, 'YYYY-MM-DD');

    return {
      value: chartCategory === 'totalTransaction' ? d.totalTransaction : d.expenses,
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
          : formatRp(d.expenses),
    };
  });

  const purchasing = completedPurchasing;

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
    <VStack className="flex-1 bg-white">
      <Header header={header} isGoBack />
      <ScrollView
        className="bg-background-0 shadow-lg flex-none"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" className="p-4 items-center">
          <FilterAccordion
            title={isReport ? 'Filter Laporan Pembelian' : 'Filter Riwayat Pembelian'}
            isExpanded={isFilterExpanded}
            onToggle={() => setIsFilterExpanded((prev) => !prev)}
          >
            <PurchasingFilterHistory
              filterValues={purchasingFilter}
              lockedSupplierId={lockedSupplierId}
              onFilter={(data) => {
                setPurchasingFilter(data);
                setIsFilterExpanded(false);
              }}
            />
          </FilterAccordion>
        </VStack>
      </ScrollView>
      <Grid _extra={{ className: 'grid-cols-2' }} className="flex-1">
        {isReport ? (
          <GridItem _extra={{ className: 'col-span-1' }}>
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
          <GridItem _extra={{ className: isReport ? 'col-span-1' : 'col-span-2' }}>
            <FlashList
              data={purchasing}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyExtractor={(purchase) => purchase.id}
              renderItem={({ item: purchase }) => {
                const date = purchase.createdAt ? dayjs(purchase.createdAt) : dayjs();
                return (
                  <Pressable
                    className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                    onPress={() => router.navigate(`/(main)/purchasing/receipt/${purchase.id}`)}
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
                            <Text className="text-typography-400 text-xs">Pengeluaran</Text>
                            <Text className="font-bold">
                              Rp {formatNumber(purchase.totalAmount)}
                            </Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">Supplier</Text>
                            <Text className="font-bold">{purchase.supplierName}</Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">Tipe</Text>
                            <Text className="font-bold">
                              {purchase.paymentType === PaymentMethod.CASH ? 'Tunai' : 'Hutang'}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack className="justify-between">
                          <Text className="text-typography-400 font-bold">
                            No: {formatDisplayRefId(purchase.local_ref_id) || purchase.id}
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
                  <Text className="text-gray-500">Tidak ada Riwayat Pembelian</Text>
                </Box>
              }
            />
          </GridItem>
        )}
      </Grid>
    </VStack>
  );
}
