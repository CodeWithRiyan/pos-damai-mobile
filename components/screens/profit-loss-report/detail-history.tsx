import Header from '@/components/header';
import { Heading, HStack, Pressable, Text, VStack } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { formatNumber } from '@/utils/format';
import { _dummyReports } from '.';

export default function ProfitLostDetailHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const report = _dummyReports.find((f) => f.id === id);
  const isLoading = false;

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

  const transactionTypeLabelHelper = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'Penjualan';
      case 'PURCHASE':
        return 'Pembelian';
      case 'OTHER_INCOME':
        return 'Pendapatan lain';
      case 'OTHER_EXPENSE':
        return 'Pengeluaran lain';
      default:
        return '';
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="LAPORAN LABA RUGI"
        subHeader={dayjs(report?.createdAt).format('DD MMMM YYYY')}
        isGoBack
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!report?.transactions.length ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Belum ada histori transaksi shift</Text>
          </Box>
        ) : (
          report.transactions.map((trx) => {
            const date = trx.date ? dayjs(trx.date) : dayjs();
            return (
              <Pressable
                key={trx.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">{date.format('HH:mm:ss')}</Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.format('DD')}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">{date.format('MMM')}</Text>
                        <Text className="text-typography-500 font-bold">{date.format('YYYY')}</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack space="sm" className="items-center">
                      <Box className="w-4 h-4 rounded-full"></Box>
                      <Text className="font-bold">
                        {transactionTypeLabelHelper(trx.transactionType)}
                      </Text>
                    </HStack>
                    <Text className="text-typography-400 font-bold">
                      Ref: {trx.transactionId || trx.id}
                    </Text>
                  </VStack>
                  <HStack space="xl" className="items-center">
                    <VStack>
                      <Text className="text-typography-400 text-xs">Total Transaksi</Text>
                      <Text className="font-bold">Rp {formatNumber(trx.amount)}</Text>
                    </VStack>
                    <Text className="text-typography-400 text-lg">›</Text>
                  </HStack>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
